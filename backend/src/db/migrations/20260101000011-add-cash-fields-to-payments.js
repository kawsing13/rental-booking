'use strict';

// Supports "pay with cash and get change" for cod/pickup_cash payments:
// cash_tendered is what the customer physically handed over, change_due is
// what's owed back. Both null for non-cash methods and for cash payments
// where the customer paid the exact amount.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('payments', 'cash_tendered', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('payments', 'change_due', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('payments', 'cash_tendered');
    await queryInterface.removeColumn('payments', 'change_due');
  },
};
