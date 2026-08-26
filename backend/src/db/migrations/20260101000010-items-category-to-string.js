'use strict';

// Converts items.category from the fixed ENUM('chair','table','karaoke') to
// a plain VARCHAR holding a categories.slug value, so admins can add new
// categories without a schema change. Existing rows keep their value
// unchanged - 'chair' the enum label becomes 'chair' the string, verbatim.
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE items ALTER COLUMN category TYPE VARCHAR(50) USING category::text;'
    );
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_items_category";');
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "CREATE TYPE \"enum_items_category\" AS ENUM('chair', 'table', 'karaoke');"
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE items ALTER COLUMN category TYPE "enum_items_category" USING category::"enum_items_category";'
    );
  },
};
