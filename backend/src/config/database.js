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
  // Hosted Postgres providers (Render, Neon, Supabase, Railway, ...) hand
  // you one connection string rather than separate host/user/password
  // fields. `use_env_variable` is sequelize-cli's built-in convention for
  // that - when set, both the CLI and src/db/models/index.js connect via
  // `new Sequelize(process.env[use_env_variable], config)` instead of the
  // discrete fields above. Falls back to DB_HOST etc. (and eventually
  // localhost) so this file still works unchanged for local dev.
  production: {
    ...base,
    use_env_variable: process.env.DATABASE_URL ? 'DATABASE_URL' : undefined,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  },
};
