// Wraps an async Express route handler so rejected promises are forwarded
// to next(err) automatically, instead of every controller needing its own
// try/catch just to avoid crashing the process on an unhandled rejection.
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
