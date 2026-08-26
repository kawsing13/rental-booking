'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      category: {
        type: Sequelize.ENUM('chair', 'table', 'karaoke'),
        allowNull: false,
      },
      description: { type: Sequelize.TEXT, allowNull: true },
      rental_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      quantity_total: { type: Sequelize.INTEGER, allowNull: false },
      images: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      rental_terms: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('available', 'under_maintenance'),
        allowNull: false,
        defaultValue: 'available',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('items', ['category']);
    await queryInterface.addIndex('items', ['name']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('items');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_items_category";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_items_status";');
  },
};
