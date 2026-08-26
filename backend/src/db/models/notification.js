'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      bookingId: { type: DataTypes.UUID, allowNull: true, field: 'booking_id' },
      type: {
        // e.g. booking_received, booking_approved, payment_received,
        // delivery_scheduled, pickup_reminder, booking_completed
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: { type: DataTypes.STRING, allowNull: false },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_read',
      },
    },
    {
      tableName: 'notifications',
      underscored: true,
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Notification.belongsTo(models.Booking, { foreignKey: 'bookingId', as: 'booking' });
  };

  return Notification;
};
