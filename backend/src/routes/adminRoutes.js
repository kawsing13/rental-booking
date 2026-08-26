const express = require('express');
const { body } = require('express-validator');
const dashboardController = require('../controllers/dashboardController');
const deliveryController = require('../controllers/deliveryController');
const reportController = require('../controllers/reportController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Every route in this file is staff-only.
router.use(authenticate, requireRole('admin', 'staff'));

router.get('/dashboard', dashboardController.getDashboard);
router.get('/customers', dashboardController.listCustomers);
router.get('/customers/:id', dashboardController.getCustomer);
router.get('/calendar', dashboardController.getCalendar);

router.get('/deliveries', deliveryController.list);
router.post(
  '/deliveries',
  [
    body('bookingId').isUUID(),
    body('type').isIn(['delivery', 'pickup']),
    body('scheduledDate').isISO8601(),
  ],
  validate,
  deliveryController.create
);
router.put('/deliveries/:id', deliveryController.update);

router.get('/reports/bookings', reportController.bookingsReport);
router.get('/reports/revenue', reportController.revenueReport);
router.get('/reports/inventory-usage', reportController.inventoryUsageReport);
router.get('/reports/cancelled', reportController.cancelledReport);

module.exports = router;
