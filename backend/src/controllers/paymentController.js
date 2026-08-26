const db = require('../db/models');
const { Payment, Booking, User } = db;
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const auditService = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { toCents, fromCents } = require('../utils/money');

function generateReceiptNumber() {
  return `RCPT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// Recomputes what's actually been paid toward a booking from the payments
// table itself - the source of truth, never the client's request body.
// Refunded payments (see refund() below) end up with status 'refunded',
// not 'paid', so they naturally fall out of this sum.
async function getPaidCents(bookingId, transaction) {
  const paid = await Payment.findAll({
    where: { bookingId, status: 'paid' },
    attributes: ['amount'],
    transaction,
  });
  return paid.reduce((sum, p) => sum + toCents(p.amount), 0);
}

// POST /api/payments (customer) - records a reservation or balance payment
// against a booking. For cash/bank-transfer this starts "pending" and an
// admin confirms it later (see confirm()); wallet methods resolve
// immediately via paymentService (mocked - see services/paymentService.js).
//
// Runs inside a transaction with the booking row locked so two rapid
// submissions (double-click, slow network + retry, two tabs) can't both
// read "balance due: 500" and both successfully pay it - the second one
// re-reads the balance after the first commits and correctly sees 0 left.
const create = asyncHandler(async (req, res) => {
  const { bookingId, method, type, amount, referenceNo, cashTendered } = req.body;
  const isCash = method === 'cod' || method === 'pickup_cash';

  let bookingReference;

  const payment = await db.sequelize.transaction(async (transaction) => {
    const booking = await Booking.findByPk(bookingId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!booking) throw ApiError.notFound('Booking not found');
    if (booking.customerId !== req.user.id) throw ApiError.forbidden();

    const paidCents = await getPaidCents(bookingId, transaction);
    const totalCents = toCents(booking.totalAmount);
    const balanceDueCents = totalCents - paidCents;

    if (balanceDueCents <= 0) {
      throw ApiError.conflict('This booking is already fully paid.');
    }

    const amountCents = toCents(amount);
    if (amountCents <= 0) {
      throw ApiError.badRequest('Amount must be greater than zero.');
    }
    if (amountCents > balanceDueCents) {
      throw ApiError.conflict(
        `That would overpay this booking - only PHP ${fromCents(balanceDueCents).toFixed(2)} is left to pay.`,
        { balanceDue: fromCents(balanceDueCents) }
      );
    }

    let changeDue = null;
    let tendered = null;
    if (isCash && cashTendered !== undefined && cashTendered !== null && cashTendered !== '') {
      const tenderedCents = toCents(cashTendered);
      if (tenderedCents < amountCents) {
        throw ApiError.badRequest('Cash tendered is less than the amount being paid.');
      }
      changeDue = fromCents(tenderedCents - amountCents);
      tendered = Number(cashTendered);
    }

    bookingReference = booking.bookingReference;

    const chargeResult = await paymentService.charge(method, {
      amount,
      referenceNo,
      bookingReference: booking.bookingReference,
    });

    return Payment.create(
      {
        bookingId,
        method,
        type,
        amount,
        status: chargeResult.status,
        referenceNo: chargeResult.referenceNo,
        receiptNumber: chargeResult.status === 'paid' ? generateReceiptNumber() : null,
        paidAt: chargeResult.status === 'paid' ? new Date() : null,
        cashTendered: tendered,
        changeDue,
      },
      { transaction }
    );
  });

  await auditService.record(req.user.id, 'create_payment', 'Payment', payment.id, { method, amount });

  if (payment.status === 'paid') {
    await notificationService.notify(
      req.user,
      'payment_received',
      `Payment of PHP ${amount} received for booking ${bookingReference}.`,
      payment.bookingId
    );
  }

  res.status(201).json({ payment });
});

// PUT /api/payments/:id/confirm (admin) - manual confirmation for cash /
// bank transfer payments once the money has actually been received.
const confirm = asyncHandler(async (req, res) => {
  const payment = await Payment.findByPk(req.params.id, {
    include: [{ model: Booking, as: 'booking', include: [{ model: User, as: 'customer' }] }],
  });
  if (!payment) throw ApiError.notFound('Payment not found');
  if (payment.status !== 'pending') throw ApiError.badRequest('Only pending payments can be confirmed');

  payment.status = 'paid';
  payment.paidAt = new Date();
  payment.receiptNumber = generateReceiptNumber();
  await payment.save();

  await auditService.record(req.user.id, 'confirm_payment', 'Payment', payment.id);
  await notificationService.notify(
    payment.booking.customer,
    'payment_received',
    `Payment of PHP ${payment.amount} confirmed for booking ${payment.booking.bookingReference}.`,
    payment.bookingId
  );

  res.json({ payment });
});

// POST /api/payments/:id/refund (admin)
const refund = asyncHandler(async (req, res) => {
  const original = await Payment.findByPk(req.params.id);
  if (!original) throw ApiError.notFound('Payment not found');
  if (original.status !== 'paid') throw ApiError.badRequest('Only paid payments can be refunded');

  original.status = 'refunded';
  await original.save();

  const refundRecord = await Payment.create({
    bookingId: original.bookingId,
    method: original.method,
    type: 'refund',
    amount: original.amount,
    status: 'refunded',
    receiptNumber: generateReceiptNumber(),
    paidAt: new Date(),
  });

  await auditService.record(req.user.id, 'refund_payment', 'Payment', original.id);
  res.json({ refund: refundRecord });
});

// GET /api/payments/booking/:bookingId
const listForBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');

  const isOwner = booking.customerId === req.user.id;
  const isStaff = ['admin', 'staff'].includes(req.user.role);
  if (!isOwner && !isStaff) throw ApiError.forbidden();

  const payments = await Payment.findAll({
    where: { bookingId: req.params.bookingId },
    order: [['createdAt', 'ASC']],
  });
  res.json({ payments });
});

module.exports = { create, confirm, refund, listForBooking };
