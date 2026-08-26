'use strict';

// Categories used to be a fixed Postgres ENUM on items.category
// ('chair'|'table'|'karaoke'). The PDF spec calls out future item types
// (tents, decorations, catering equipment), so this table makes the set
// admin-editable instead of requiring a schema migration for every new
// category. See the companion migration that converts items.category from
// ENUM to a plain string referencing this table's `slug`.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      // Stable identifier stored on items.category - lowercase,
      // dash/underscore only, never changes once items reference it.
      slug: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      label: { type: Sequelize.STRING(80), allowNull: false },
      // Optional key into the frontend/mobile icon set (e.g. "chair"); an
      // unrecognized or missing icon falls back to a generic glyph.
      icon: { type: Sequelize.STRING(40), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('categories');
  },
};
