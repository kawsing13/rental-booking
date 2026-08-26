// Sequelize-CLI reads this file directly (see .sequelizerc), so it stays in
// the plain "development/test/production" shape the CLI expects rather than
// using our env.js wrapper.
require('dotenv').config();

const base = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'rental_booking',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  dialect: 'postgres',
  logging: false,
};

module.exports = {
  development: { ...base },
  test: { ...base, database: `${base.database}_test` },
  production: {
    ...base,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  },
};
