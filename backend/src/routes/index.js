const express = require('express');

const authRoutes = require('./authRoutes');
const itemRoutes = require('./itemRoutes');
const categoryRoutes = require('./categoryRoutes');
const bookingRoutes = require('./bookingRoutes');
const paymentRoutes = require('./paymentRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/categories', categoryRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;
