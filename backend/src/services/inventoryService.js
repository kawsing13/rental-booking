const { Op } = require('sequelize');
const db = require('../db/models');
const ApiError = require('../utils/ApiError');
const { Booking, BookingItem, Item } = db;

// How much of `itemId` is already committed to OTHER bookings whose stay
// overlaps [eventDate, returnDate]. Two ranges overlap when
// existing.start <= requested.end AND existing.end >= requested.start.
async function getReservedQuantity(itemId, eventDate, returnDate, { excludeBookingId, transaction } = {}) {
  const bookingWhere = {
    status: { [Op.in]: Booking.ACTIVE_HOLD_STATUSES },
    eventDate: { [Op.lte]: returnDate },
    returnDate: { [Op.gte]: eventDate },
  };
  if (excludeBookingId) {
    bookingWhere.id = { [Op.ne]: excludeBookingId };
  }

  const result = await BookingItem.findAll({
    attributes: [[db.sequelize.fn('COALESCE', db.sequelize.fn('SUM', db.sequelize.col('BookingItem.quantity')), 0), 'reserved']],
    where: { itemId },
    include: [{ model: Booking, as: 'booking', attributes: [], where: bookingWhere }],
    raw: true,
    transaction,
  });

  return Number(result[0]?.reserved || 0);
}

// Returns { itemId, quantityTotal, reserved, available } for a single item
// over a given date range. Used by the public "check availability" endpoint
// and the item detail page.
async function getAvailability(itemId, eventDate, returnDate) {
  const item = await Item.findByPk(itemId);
  if (!item) throw ApiError.notFound('Item not found');

  const reserved = await getReservedQuantity(itemId, eventDate, returnDate);
  const available = item.status === 'available' ? Math.max(item.quantityTotal - reserved, 0) : 0;

  return {
    itemId: item.id,
    name: item.name,
    quantityTotal: item.quantityTotal,
    reserved,
    available,
  };
}

// Called inside the booking-creation transaction. Locks each item row
// (SELECT ... FOR UPDATE) so two simultaneous booking requests for the same
// item/date-range can't both pass the availability check and overbook.
// Throws ApiError.conflict if any requested line can't be satisfied.
async function lockAndValidateItems(requestedLines, eventDate, returnDate, transaction) {
  const validated = [];

  for (const line of requestedLines) {
    const item = await Item.findByPk(line.itemId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!item) {
      throw ApiError.badRequest(`Item ${line.itemId} does not exist`);
    }
    if (item.status !== 'available') {
      throw ApiError.conflict(`"${item.name}" is not currently available for booking`);
    }

    const reserved = await getReservedQuantity(item.id, eventDate, returnDate, { transaction });
    const remaining = item.quantityTotal - reserved;

    if (line.quantity > remaining) {
      throw ApiError.conflict(
        `Only ${remaining} unit(s) of "${item.name}" are available for the selected dates`,
        { itemId: item.id, requested: line.quantity, remaining }
      );
    }

    validated.push({ item, quantity: line.quantity });
  }

  return validated;
}

module.exports = { getReservedQuantity, getAvailability, lockAndValidateItems };
