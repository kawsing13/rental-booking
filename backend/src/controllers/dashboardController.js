const { Op, fn, col, literal } = require('sequelize');
const db = require('../db/models');
const { Booking, Item, Payment, BookingItem, User } = db;
const asyncHandler = require('../utils/asyncHandler');

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// GET /api/admin/dashboard - the numbers the PDF's admin dashboard lists:
// today's bookings, pending requests, active rentals, available inventory,
// monthly revenue, most rented items.
const getDashboard = asyncHandler(async (req, res) => {
  const today = startOfToday();
  const monthStart = startOfMonth();

  const [
    todaysBookings,
    pendingRequests,
    activeRentals,
    totalItems,
    monthlyRevenueResult,
    mostRentedItems,
  ] = await Promise.all([
    Booking.count({ where: { createdAt: { [Op.gte]: today } } }),
    Booking.count({ where: { status: 'pending' } }),
    Booking.count({ where: { status: { [Op.in]: Booking.ACTIVE_HOLD_STATUSES } } }),
    Item.count({ where: { status: 'available' } }),
    Payment.sum('amount', {
      where: { status: 'paid', type: { [Op.in]: ['reservation', 'balance'] }, paidAt: { [Op.gte]: monthStart } },
    }),
    BookingItem.findAll({
      attributes: ['itemId', [fn('SUM', col('BookingItem.quantity')), 'totalRented']],
      include: [{ model: Item, as: 'item', attributes: ['name', 'category'] }],
      group: ['BookingItem.item_id', 'item.id'],
      order: [[literal('"totalRented"'), 'DESC']],
      limit: 5,
    }),
  ]);

  res.json({
    todaysBookings,
    pendingRequests,
    activeRentals,
    availableInventoryItems: totalItems,
    monthlyRevenue: Number(monthlyRevenueResult || 0),
    mostRentedItems: mostRentedItems.map((r) => ({
      itemId: r.itemId,
      name: r.item.name,
      category: r.item.category,
      totalRented: Number(r.get('totalRented')),
    })),
  });
});

// GET /api/admin/customers
const listCustomers = asyncHandler(async (req, res) => {
  const customers = await User.findAll({
    where: { role: 'customer' },
    order: [['createdAt', 'DESC']],
  });
  res.json({ customers });
});

// GET /api/admin/customers/:id - profile + booking history + outstanding balance
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await User.findByPk(req.params.id, {
    include: [
      {
        model: Booking,
        as: 'bookings',
        include: [{ model: Payment, as: 'payments' }],
      },
    ],
  });
  if (!customer) return res.status(404).json({ error: { message: 'Customer not found' } });

  const outstandingBalance = customer.bookings.reduce((sum, booking) => {
    const paid = booking.payments
      .filter((p) => p.status === 'paid' && p.type !== 'refund')
      .reduce((s, p) => s + Number(p.amount), 0);
    const owed = Number(booking.totalAmount) - paid;
    return sum + Math.max(owed, 0);
  }, 0);

  res.json({ customer, outstandingBalance });
});

// GET /api/admin/calendar?month=YYYY-MM - deliveries, pickups, reserved
// dates for the monthly calendar view.
const getCalendar = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const [year, mon] = month.split('-').map(Number);
  const rangeStart = new Date(year, mon - 1, 1);
  const rangeEnd = new Date(year, mon, 0);

  const deliveries = await db.Delivery.findAll({
    where: { scheduledDate: { [Op.between]: [rangeStart, rangeEnd] } },
    include: [{ model: Booking, as: 'booking', attributes: ['bookingReference', 'status'] }],
  });

  const bookings = await Booking.findAll({
    where: {
      status: { [Op.in]: Booking.ACTIVE_HOLD_STATUSES },
      eventDate: { [Op.lte]: rangeEnd },
      returnDate: { [Op.gte]: rangeStart },
    },
    attributes: ['id', 'bookingReference', 'eventDate', 'returnDate', 'status'],
  });

  res.json({ month, deliveries, reservedDates: bookings });
});

module.exports = { getDashboard, listCustomers, getCustomer, getCalendar };
