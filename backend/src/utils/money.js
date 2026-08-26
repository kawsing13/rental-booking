// Money is stored as DECIMAL in Postgres but arrives in JS as either a
// string (from Sequelize) or a float - summing/subtracting floats directly
// accumulates binary rounding error (0.1 + 0.2 !== 0.3), which is exactly
// the kind of bug that could let a balance-due check silently pass when it
// shouldn't. Doing the arithmetic in integer cents avoids that.
function toCents(value) {
  return Math.round(Number(value) * 100);
}

function fromCents(cents) {
  return Math.round(cents) / 100;
}

// Sums an array of money values (or an array of objects + a key) safely.
function sumMoney(values) {
  return fromCents(values.reduce((cents, v) => cents + toCents(v), 0));
}

module.exports = { toCents, fromCents, sumMoney };
