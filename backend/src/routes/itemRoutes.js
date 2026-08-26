const express = require('express');
const { body } = require('express-validator');
const itemController = require('../controllers/itemController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Public browsing - no auth required, matches the PDF's "customers can
// browse rental items by category" without forcing a login first.
router.get('/', itemController.list);
router.get('/:id', itemController.getOne);
router.get('/:id/availability', itemController.checkAvailability);

const itemValidators = [
  body('name').trim().notEmpty(),
  // Just shape-check here; itemController checks the slug actually exists
  // in the categories table (which admins can add to at runtime).
  body('category').trim().notEmpty(),
  body('rentalPrice').isFloat({ min: 0 }),
  body('quantityTotal').isInt({ min: 0 }),
];

router.post('/', authenticate, requireRole('admin', 'staff'), itemValidators, validate, itemController.create);
router.put('/:id', authenticate, requireRole('admin', 'staff'), itemController.update);
router.delete('/:id', authenticate, requireRole('admin'), itemController.remove);

module.exports = router;
