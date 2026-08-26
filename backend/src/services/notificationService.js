const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');
const { Notification } = require('../db/models');

// Lazily-created transporter. If SMTP isn't configured we fall back to
// logging the email to the console instead of failing the request - email
// delivery should never block the actual booking workflow.
let transporter = null;
function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
    });
  }
  return transporter;
}

async function sendEmail(to, subject, text) {
  const t = getTransporter();
  if (!t) {
    logger.info(`[email disabled] to=${to} subject="${subject}" body="${text}"`);
    return;
  }
  await t.sendMail({ from: env.smtp.from, to, subject, text });
}

// Creates the in-app notification record AND fires the corresponding email.
// Call this at every booking lifecycle transition (see bookingController).
async function notify(user, type, message, bookingId = null) {
  await Notification.create({ userId: user.id, bookingId, type, message });
  await sendEmail(user.email, message, message).catch((err) =>
    logger.warn('Failed to send notification email', err.message)
  );
}

module.exports = { notify, sendEmail };
