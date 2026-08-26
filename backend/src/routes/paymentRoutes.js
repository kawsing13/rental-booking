const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
router.use(authenticate);

router.post(
  '/',
  [
    body('bookingId').isUUID(),
    body('method').isIn(['cod', 'pickup_cash', 'bank_transfer', 'gcash', 'maya']),
    body('type').isIn(['reservation', 'balance']),
    body('amount').isFloat({ min: 0.01 }),
    body('cashTendered').optional({ values: 'null' }).isFloat({ min: 0 }),
  ],
  validate,
  paymentController.create
);

router.get('/booking/:bookingId', paymentController.listForBooking);
router.put('/:id/confirm', requireRole('admin', 'staff'), paymentController.confirm);
router.post('/:id/refund', requireRole('admin'), paymentController.refund);

module.exports = router;
