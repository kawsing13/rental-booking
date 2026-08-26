'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bookings', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      booking_reference: { type: Sequelize.STRING, allowNull: false, unique: true },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      event_date: { type: Sequelize.DATEONLY, allowNull: false },
      return_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: {
        type: Sequelize.ENUM(
          'pending',
          'approved',
          'reserved',
          'out_for_delivery',
          'in_use',
          'returned',
          'completed',
          'rejected',
          'cancelled'
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      delivery_address: { type: Sequelize.STRING, allowNull: true },
      delivery_fee: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      reservation_fee: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      total_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    // Supports the availability-overlap query (WHERE event_date <= ? AND return_date >= ?).
    await queryInterface.addIndex('bookings', ['event_date', 'return_date']);
    await queryInterface.addIndex('bookings', ['customer_id']);
    await queryInterface.addIndex('bookings', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('bookings');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bookings_status";');
  },
};
