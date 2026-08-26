'use strict';

module.exports = (sequelize, DataTypes) => {
  const Delivery = sequelize.define(
    'Delivery',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      bookingId: { type: DataTypes.UUID, allowNull: false, field: 'booking_id' },
      type: { type: DataTypes.ENUM('delivery', 'pickup'), allowNull: false },
      scheduledDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'scheduled_date' },
      address: { type: DataTypes.STRING, allowNull: false },
      assignedPersonnel: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'assigned_personnel',
      },
      status: {
        type: DataTypes.ENUM('scheduled', 'out', 'completed'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
    },
    {
      tableName: 'deliveries',
      underscored: true,
    }
  );

  Delivery.associate = (models) => {
    Delivery.belongsTo(models.Booking, { foreignKey: 'bookingId', as: 'booking' });
  };

  return Delivery;
};
