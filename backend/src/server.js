const app = require('./app');
const env = require('./config/env');
const db = require('./db/models');
const logger = require('./utils/logger');

async function start() {
  // Fail fast if the DB is unreachable rather than starting a server that
  // will 500 on every request.
  await db.sequelize.authenticate();
  logger.info('Database connection established.');

  app.listen(env.port, () => {
    logger.info(`Rental Booking API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
