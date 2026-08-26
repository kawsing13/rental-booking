const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

// --- Security & platform middleware --------------------------------------
app.use(helmet()); // sensible default security headers
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

// Generic API-wide rate limit (auth routes have their own tighter limit).
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// --- Routes ----------------------------------------------------------------
app.use('/api', routes);

// Unknown route -> 404 through the same error shape as everything else.
app.use((req, res, next) => next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`)));

// Must be registered last: Express identifies error handlers by their 4 args.
app.use(errorHandler);

module.exports = app;
