'use strict';

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    'Payment',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      bookingId: { type: DataTypes.UUID, allowNull: false, field: 'booking_id' },
      method: {
        type: DataTypes.ENUM('cod', 'pickup_cash', 'bank_transfer', 'gcash', 'maya'),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('reservation', 'balance', 'refund'),
        allowNull: false,
      },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      // Gateway/bank transaction id for gcash/maya/bank_transfer; null for cash.
      referenceNo: { type: DataTypes.STRING, allowNull: true, field: 'reference_no' },
      receiptNumber: { type: DataTypes.STRING, allowNull: true, field: 'receipt_number' },
      paidAt: { type: DataTypes.DATE, allowNull: true, field: 'paid_at' },
      // Cash-only ("pay with cash, get change"): what the customer handed
      // over and what's owed back. Null for non-cash methods.
      cashTendered: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'cash_tendered' },
      changeDue: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'change_due' },
    },
    {
      tableName: 'payments',
      underscored: true,
    }
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.Booking, { foreignKey: 'bookingId', as: 'booking' });
  };

  return Payment;
};
