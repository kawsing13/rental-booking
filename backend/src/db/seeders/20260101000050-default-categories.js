'use strict';

const { v4: uuidv4 } = require('uuid');

// Seeds the three categories the original spec ships with. Admins can add
// more afterward via POST /api/categories - this just makes sure the
// pre-existing item data (seeded with category slugs 'chair'/'table'/
// 'karaoke') has matching category records to show up in the UI's filters.
module.exports = {
  up: async (queryInterface) => {
    // Idempotent on purpose: sequelize-cli doesn't track which seeders have
    // already run the way it does migrations, and this now runs on every
    // deploy (render.yaml's buildCommand) rather than as a manual one-off
    // shell step - without this guard, a redeploy would hit the unique
    // constraint on `slug` and fail the build.
    const [existing] = await queryInterface.sequelize.query('SELECT COUNT(*)::int AS count FROM categories');
    if (existing[0].count > 0) return;

    const now = new Date();
    await queryInterface.bulkInsert('categories', [
      { id: uuidv4(), slug: 'chair', label: 'Chairs', icon: 'chair', created_at: now, updated_at: now },
      { id: uuidv4(), slug: 'table', label: 'Tables', icon: 'table', created_at: now, updated_at: now },
      { id: uuidv4(), slug: 'karaoke', label: 'Karaoke Sets', icon: 'karaoke', created_at: now, updated_at: now },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('categories', { slug: ['chair', 'table', 'karaoke'] });
  },
};
