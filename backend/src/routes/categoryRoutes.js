const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/', categoryController.list); // public - catalog filters need this without login

router.post(
  '/',
  authenticate,
  requireRole('admin', 'staff'),
  [
    body('slug')
      .trim()
      .toLowerCase()
      .matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      .withMessage('Slug must be lowercase letters/numbers with dashes only, e.g. "tents"'),
    body('label').trim().notEmpty().withMessage('Label is required'),
    body('icon').optional().trim(),
  ],
  validate,
  categoryController.create
);

router.put(
  '/:id',
  authenticate,
  requireRole('admin', 'staff'),
  [body('label').optional().trim().notEmpty(), body('icon').optional().trim()],
  validate,
  categoryController.update
);

router.delete('/:id', authenticate, requireRole('admin'), categoryController.remove);

module.exports = router;
