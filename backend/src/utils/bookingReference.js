// Generates a short human-readable booking reference like "BK-20260807-A1B2",
// shown to customers/admins instead of the internal UUID.
function generateBookingReference(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BK-${y}${m}${d}-${random}`;
}

module.exports = { generateBookingReference };
