const db = require('../db/models');
const { Booking, BookingItem, Item, User } = db;
const inventoryService = require('../services/inventoryService');
const notificationService = require('../services/notificationService');
const auditService = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { generateBookingReference } = require('../utils/bookingReference');

// Flat delivery fee applied when the customer asks for delivery instead of
// pickup, and the percentage of the item subtotal collected as a
// reservation/down-payment. Simple constants for now; a real business would
// likely make these configurable per item/distance in the admin panel.
const DELIVERY_FEE = 200;
const RESERVATION_FEE_RATE = 0.2;

// Explicit allow-list of status transitions, mirroring the PDF's workflow
// diagram. Anything not listed here is rejected - this is what stops an
// admin (or a bug) from e.g. jumping straight from "pending" to "completed".
const ALLOWED_TRANSITIONS = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['reserved', 'cancelled'],
  reserved: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['in_use'],
  in_use: ['returned'],
  returned: ['completed'],
  completed: [],
  rejected: [],
  cancelled: [],
};

const STATUS_MESSAGES = {
  approved: 'Your booking has been approved.',
  rejected: 'Your booking request was rejected.',
  reserved: 'Your booking is confirmed and reserved.',
  out_for_delivery: 'Your rental items are out for delivery.',
  in_use: 'Your rental period has started.',
  returned: 'We have received your returned items.',
  completed: 'Your booking is now complete. Thank you for renting with us!',
  cancelled: 'Your booking has been cancelled.',
};

function serializeBooking(booking) {
  return booking.toJSON();
}

// POST /api/bookings (customer)
// The whole read-check-write cycle runs inside one DB transaction with row
// locks (see inventoryService.lockAndValidateItems) so two customers
// booking the last unit of an item at the same moment can't both succeed.
const create = asyncHandler(async (req, res) => {
  const { eventDate, returnDate, items, deliveryAddress, notes } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('At least one item is required');
  }

  const result = await db.sequelize.transaction(async (transaction) => {
    const validatedLines = await inventoryService.lockAndValidateItems(
      items,
      eventDate,
      returnDate,
      transaction
    );

    const itemsSubtotal = validatedLines.reduce(
      (sum, line) => sum + Number(line.item.rentalPrice) * line.quantity,
      0
    );
    const deliveryFee = deliveryAddress ? DELIVERY_FEE : 0;
    const totalAmount = itemsSubtotal + deliveryFee;
    const reservationFee = Number((totalAmount * RESERVATION_FEE_RATE).toFixed(2));

    const booking = await Booking.create(
      {
        bookingReference: generateBookingReference(),
        customerId: req.user.id,
        eventDate,
        returnDate,
        status: 'pending',
        deliveryAddress: deliveryAddress || null,
        deliveryFee,
        reservationFee,
        totalAmount,
        notes: notes || null,
      },
      { transaction }
    );

    await BookingItem.bulkCreate(
      validatedLines.map((line) => ({
        bookingId: booking.id,
        itemId: line.item.id,
        quantity: line.quantity,
        unitPrice: line.item.rentalPrice,
        subtotal: Number(line.item.rentalPrice) * line.quantity,
      })),
      { transaction }
    );

    return booking;
  });

  await auditService.record(req.user.id, 'create_booking', 'Booking', result.id, {
    eventDate,
    returnDate,
  });

  await notificationService.notify(
    req.user,
    'booking_received',
    `Booking ${result.bookingReference} received and pending approval.`,
    result.id
  );

  const booking = await Booking.findByPk(result.id, {
    include: [{ model: BookingItem, as: 'items', include: [{ model: Item, as: 'item' }] }],
  });

  res.status(201).json({ booking: serializeBooking(booking) });
});

// GET /api/bookings/mine (customer)
const listMine = asyncHandler(async (req, res) => {
  const bookings = await Booking.findAll({
    where: { customerId: req.user.id },
    include: [{ model: BookingItem, as: 'items', include: [{ model: Item, as: 'item' }] }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ bookings });
});

// GET /api/bookings (admin) - optional ?status= filter for the admin board
const listAll = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;

  const bookings = await Booking.findAll({
    where,
    include: [
      { model: BookingItem, as: 'items', include: [{ model: Item, as: 'item' }] },
      { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
    ],
    order: [['createdAt', 'DESC']],
  });
  res.json({ bookings });
});

// GET /api/bookings/:id
const getOne = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id, {
    include: [
      { model: BookingItem, as: 'items', include: [{ model: Item, as: 'item' }] },
      { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
      { model: db.Payment, as: 'payments' },
      { model: db.Delivery, as: 'deliveries' },
    ],
  });
  if (!booking) throw ApiError.notFound('Booking not found');

  const isOwner = booking.customerId === req.user.id;
  const isStaff = ['admin', 'staff'].includes(req.user.role);
  if (!isOwner && !isStaff) throw ApiError.forbidden();

  res.json({ booking: serializeBooking(booking) });
});

// PUT /api/bookings/:id/status (admin) - drives the booking through the
// workflow in the PDF's flowchart.
const updateStatus = asyncHandler(async (req, res) => {
  const { status: nextStatus } = req.body;
  const booking = await Booking.findByPk(req.params.id, { include: [{ model: User, as: 'customer' }] });
  if (!booking) throw ApiError.notFound('Booking not found');

  const allowed = ALLOWED_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw ApiError.badRequest(`Cannot move booking from "${booking.status}" to "${nextStatus}"`);
  }

  booking.status = nextStatus;
  await booking.save();

  await auditService.record(req.user.id, 'update_booking_status', 'Booking', booking.id, {
    status: nextStatus,
  });

  const message = STATUS_MESSAGES[nextStatus];
  if (message) {
    await notificationService.notify(booking.customer, nextStatus, message, booking.id);
  }

  res.json({ booking: serializeBooking(booking) });
});

// PUT /api/bookings/:id/cancel (customer - only while pending/approved)
const cancel = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.customerId !== req.user.id) throw ApiError.forbidden();
  if (!['pending', 'approved'].includes(booking.status)) {
    throw ApiError.badRequest('Only pending or approved bookings can be cancelled');
  }

  booking.status = 'cancelled';
  await booking.save();
  await auditService.record(req.user.id, 'cancel_booking', 'Booking', booking.id);

  res.json({ booking: serializeBooking(booking) });
});

module.exports = { create, listMine, listAll, getOne, updateStatus, cancel, ALLOWED_TRANSITIONS };
