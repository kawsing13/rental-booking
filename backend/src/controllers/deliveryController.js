const { Delivery, Booking, User } = require('../db/models');
const notificationService = require('../services/notificationService');
const auditService = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// GET /api/deliveries (admin) - optional ?date= filter for the ops board
const list = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.date) where.scheduledDate = req.query.date;

  const deliveries = await Delivery.findAll({
    where,
    include: [{ model: Booking, as: 'booking', attributes: ['bookingReference', 'customerId'] }],
    order: [['scheduledDate', 'ASC']],
  });
  res.json({ deliveries });
});

// POST /api/deliveries (admin) - schedule a delivery or pickup for a booking
const create = asyncHandler(async (req, res) => {
  const { bookingId, type, scheduledDate, address, assignedPersonnel } = req.body;

  const booking = await Booking.findByPk(bookingId, { include: [{ model: User, as: 'customer' }] });
  if (!booking) throw ApiError.notFound('Booking not found');

  const delivery = await Delivery.create({
    bookingId,
    type,
    scheduledDate,
    address: address || booking.deliveryAddress,
    assignedPersonnel,
  });

  await auditService.record(req.user.id, 'schedule_delivery', 'Delivery', delivery.id, { type, scheduledDate });
  await notificationService.notify(
    booking.customer,
    type === 'delivery' ? 'delivery_schedule' : 'pickup_reminder',
    `Your ${type} is scheduled for ${scheduledDate}.`,
    booking.id
  );

  res.status(201).json({ delivery });
});

// PUT /api/deliveries/:id (admin) - update status / assigned personnel
const update = asyncHandler(async (req, res) => {
  const delivery = await Delivery.findByPk(req.params.id);
  if (!delivery) throw ApiError.notFound('Delivery not found');

  const editable = ['scheduledDate', 'address', 'assignedPersonnel', 'status'];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) delivery[field] = req.body[field];
  });

  await delivery.save();
  await auditService.record(req.user.id, 'update_delivery', 'Delivery', delivery.id, req.body);

  res.json({ delivery });
});

module.exports = { list, create, update };
