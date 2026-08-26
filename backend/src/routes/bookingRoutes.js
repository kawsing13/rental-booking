const express = require('express');
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(authenticate); // every booking route requires a logged-in user

const createValidators = [
  body('eventDate').isISO8601().withMessage('eventDate must be a valid date'),
  body('returnDate').isISO8601().withMessage('returnDate must be a valid date'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.itemId').isUUID(),
  body('items.*.quantity').isInt({ min: 1 }),
];

router.post('/', createValidators, validate, bookingController.create);
router.get('/mine', bookingController.listMine);
router.get('/', requireRole('admin', 'staff'), bookingController.listAll);
router.get('/:id', bookingController.getOne);
router.put(
  '/:id/status',
  requireRole('admin', 'staff'),
  [body('status').notEmpty()],
  validate,
  bookingController.updateStatus
);
router.put('/:id/cancel', bookingController.cancel);

module.exports = router;
