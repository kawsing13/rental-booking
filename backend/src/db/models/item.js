'use strict';

module.exports = (sequelize, DataTypes) => {
  const Item = sequelize.define(
    'Item',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      // References categories.slug (see categoryController). Not an ENUM
      // and not a formal FK - admins can add new categories at runtime, and
      // itemController validates the slug exists on create/update.
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      rentalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'rental_price',
      },
      // Total units the business owns. Real-time "available for date range"
      // is computed on the fly by inventoryService - this is NOT decremented
      // per booking, it's the ceiling used in that calculation.
      quantityTotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'quantity_total',
        validate: { min: 0 },
      },
      images: {
        // Array of image URLs, stored as JSON for portability across DBs.
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      rentalTerms: { type: DataTypes.TEXT, allowNull: true, field: 'rental_terms' },
      status: {
        type: DataTypes.ENUM('available', 'under_maintenance'),
        allowNull: false,
        defaultValue: 'available',
      },
    },
    {
      tableName: 'items',
      underscored: true,
    }
  );

  Item.associate = (models) => {
    Item.hasMany(models.BookingItem, { foreignKey: 'itemId', as: 'bookingItems' });
  };

  return Item;
};
