'use strict';

module.exports = (sequelize, DataTypes) => {
  const BookingItem = sequelize.define(
    'BookingItem',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      bookingId: { type: DataTypes.UUID, allowNull: false, field: 'booking_id' },
      itemId: { type: DataTypes.UUID, allowNull: false, field: 'item_id' },
      quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
      // Snapshot of the item's price at booking time, so later price changes
      // in the catalog never retroactively change a customer's total.
      unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'unit_price' },
      subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    },
    {
      tableName: 'booking_items',
      underscored: true,
    }
  );

  BookingItem.associate = (models) => {
    BookingItem.belongsTo(models.Booking, { foreignKey: 'bookingId', as: 'booking' });
    BookingItem.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
  };

  return BookingItem;
};
