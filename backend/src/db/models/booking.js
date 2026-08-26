'use strict';

// Order here mirrors the PDF's rental workflow diagram exactly, so
// `BOOKING_STATUSES.indexOf(status)` roughly tracks lifecycle progress.
const BOOKING_STATUSES = [
  'pending',
  'approved',
  'reserved',
  'out_for_delivery',
  'in_use',
  'returned',
  'completed',
  'rejected',
  'cancelled',
];

// Statuses that still "hold" inventory (count against availability for
// their date range). Completed/rejected/cancelled bookings release stock.
const ACTIVE_HOLD_STATUSES = [
  'pending',
  'approved',
  'reserved',
  'out_for_delivery',
  'in_use',
];

module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    'Booking',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      bookingReference: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'booking_reference',
      },
      customerId: { type: DataTypes.UUID, allowNull: false, field: 'customer_id' },
      eventDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'event_date' },
      returnDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'return_date' },
      status: {
        type: DataTypes.ENUM(...BOOKING_STATUSES),
        allowNull: false,
        defaultValue: 'pending',
      },
      deliveryAddress: { type: DataTypes.STRING, allowNull: true, field: 'delivery_address' },
      deliveryFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'delivery_fee',
      },
      reservationFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'reservation_fee',
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'total_amount',
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'bookings',
      underscored: true,
      validate: {
        returnAfterEvent() {
          if (this.returnDate < this.eventDate) {
            throw new Error('returnDate cannot be before eventDate');
          }
        },
      },
    }
  );

  Booking.BOOKING_STATUSES = BOOKING_STATUSES;
  Booking.ACTIVE_HOLD_STATUSES = ACTIVE_HOLD_STATUSES;

  Booking.associate = (models) => {
    Booking.belongsTo(models.User, { foreignKey: 'customerId', as: 'customer' });
    Booking.hasMany(models.BookingItem, { foreignKey: 'bookingId', as: 'items' });
    Booking.hasMany(models.Payment, { foreignKey: 'bookingId', as: 'payments' });
    Booking.hasMany(models.Delivery, { foreignKey: 'bookingId', as: 'deliveries' });
    Booking.hasMany(models.Notification, { foreignKey: 'bookingId', as: 'notifications' });
  };

  return Booking;
};
