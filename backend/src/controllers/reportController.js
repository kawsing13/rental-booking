const { Op, fn, col, literal } = require('sequelize');
const db = require('../db/models');
const { Booking, BookingItem, Item, Payment } = db;
const reportService = require('../services/reportService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Shared "send these rows in whatever format was requested" helper used by
// every report endpoint below, so each one only has to build its own rows.
async function sendReport(res, format, filenameBase, title, rows, fields) {
  if (format === 'csv') {
    res.header('Content-Type', 'text/csv');
    res.attachment(`${filenameBase}.csv`);
    return res.send(reportService.toCsv(rows, fields));
  }
  if (format === 'excel') {
    const buffer = await reportService.toExcelBuffer(rows, fields, title);
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`${filenameBase}.xlsx`);
    return res.send(buffer);
  }
  if (format === 'pdf') {
    res.header('Content-Type', 'application/pdf');
    res.attachment(`${filenameBase}.pdf`);
    return reportService.streamPdf(res, title, rows, fields);
  }
  // Default: plain JSON, handy for the admin UI to render a preview table.
  return res.json({ title, rows });
}

function rangeStartFor(period) {
  const now = new Date();
  if (period === 'daily') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'weekly') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return new Date(now.getFullYear(), now.getMonth(), 1); // monthly (default)
}

// GET /api/reports/bookings?period=daily|weekly|monthly&format=csv|excel|pdf|json
const bookingsReport = asyncHandler(async (req, res) => {
  const { period = 'monthly', format = 'json' } = req.query;
  const bookings = await Booking.findAll({
    where: { createdAt: { [Op.gte]: rangeStartFor(period) } },
    include: [{ model: db.User, as: 'customer', attributes: ['name', 'email'] }],
    order: [['createdAt', 'DESC']],
  });

  const rows = bookings.map((b) => ({
    reference: b.bookingReference,
    customer: b.customer?.name,
    eventDate: b.eventDate,
    returnDate: b.returnDate,
    status: b.status,
    totalAmount: Number(b.totalAmount),
  }));

  await sendReport(res, format, `bookings-${period}`, `${period[0].toUpperCase()}${period.slice(1)} Bookings`, rows, [
    'reference',
    'customer',
    'eventDate',
    'returnDate',
    'status',
    'totalAmount',
  ]);
});

// GET /api/reports/revenue?format=
const revenueReport = asyncHandler(async (req, res) => {
  const { format = 'json' } = req.query;
  const payments = await Payment.findAll({
    where: { status: 'paid', type: { [Op.in]: ['reservation', 'balance'] } },
    include: [{ model: Booking, as: 'booking', attributes: ['bookingReference'] }],
    order: [['paidAt', 'DESC']],
  });

  const rows = payments.map((p) => ({
    receiptNumber: p.receiptNumber,
    bookingReference: p.booking?.bookingReference,
    method: p.method,
    type: p.type,
    amount: Number(p.amount),
    paidAt: p.paidAt,
  }));

  await sendReport(res, format, 'revenue', 'Revenue', rows, [
    'receiptNumber',
    'bookingReference',
    'method',
    'type',
    'amount',
    'paidAt',
  ]);
});

// GET /api/reports/inventory-usage?format= - also doubles as "most rented items"
const inventoryUsageReport = asyncHandler(async (req, res) => {
  const { format = 'json' } = req.query;
  const usage = await BookingItem.findAll({
    attributes: ['itemId', [fn('SUM', col('BookingItem.quantity')), 'totalRented'], [fn('SUM', col('BookingItem.subtotal')), 'totalRevenue']],
    include: [{ model: Item, as: 'item', attributes: ['name', 'category'] }],
    group: ['BookingItem.item_id', 'item.id'],
    order: [[literal('"totalRented"'), 'DESC']],
  });

  const rows = usage.map((u) => ({
    item: u.item.name,
    category: u.item.category,
    totalRented: Number(u.get('totalRented')),
    totalRevenue: Number(u.get('totalRevenue')),
  }));

  await sendReport(res, format, 'inventory-usage', 'Inventory Usage', rows, [
    'item',
    'category',
    'totalRented',
    'totalRevenue',
  ]);
});

// GET /api/reports/cancelled?format=
const cancelledReport = asyncHandler(async (req, res) => {
  const { format = 'json' } = req.query;
  const bookings = await Booking.findAll({
    where: { status: { [Op.in]: ['cancelled', 'rejected'] } },
    include: [{ model: db.User, as: 'customer', attributes: ['name', 'email'] }],
    order: [['updatedAt', 'DESC']],
  });

  const rows = bookings.map((b) => ({
    reference: b.bookingReference,
    customer: b.customer?.name,
    status: b.status,
    totalAmount: Number(b.totalAmount),
    updatedAt: b.updatedAt,
  }));

  await sendReport(res, format, 'cancelled-bookings', 'Cancelled Bookings', rows, [
    'reference',
    'customer',
    'status',
    'totalAmount',
    'updatedAt',
  ]);
});

module.exports = { bookingsReport, revenueReport, inventoryUsageReport, cancelledReport };
