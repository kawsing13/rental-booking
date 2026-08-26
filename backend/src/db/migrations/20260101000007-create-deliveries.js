'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('deliveries', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'bookings', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      type: { type: Sequelize.ENUM('delivery', 'pickup'), allowNull: false },
      scheduled_date: { type: Sequelize.DATEONLY, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      assigned_personnel: { type: Sequelize.STRING, allowNull: true },
      status: {
        type: Sequelize.ENUM('scheduled', 'out', 'completed'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('deliveries', ['booking_id']);
    await queryInterface.addIndex('deliveries', ['scheduled_date']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('deliveries');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_deliveries_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_deliveries_status";');
  },
};
