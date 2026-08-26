'use strict';

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      slug: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[a-z0-9]+(-[a-z0-9]+)*$/, // lowercase, dash-separated - safe to use as a URL/query param
        },
      },
      label: { type: DataTypes.STRING(80), allowNull: false },
      icon: { type: DataTypes.STRING(40), allowNull: true },
    },
    {
      tableName: 'categories',
      underscored: true,
    }
  );

  // No formal association to Item - items.category stores the slug as a
  // plain string rather than a foreign key (see migration notes), so this
  // stays a simple lookup table rather than a relation Sequelize manages.

  return Category;
};
