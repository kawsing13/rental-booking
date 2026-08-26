const { Category, Item } = require('../db/models');
const auditService = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// GET /api/categories - public, used to populate the catalog's filter
// chips and the admin "add item" category dropdown.
const list = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({ order: [['label', 'ASC']] });
  res.json({ categories });
});

// POST /api/categories (admin) - lets an admin add a new rental category
// (e.g. "tents", "decorations") without a code change, per the PDF's
// "Future Enhancements" list of additional item types.
const create = asyncHandler(async (req, res) => {
  const { slug, label, icon } = req.body;

  const existing = await Category.findOne({ where: { slug } });
  if (existing) {
    throw ApiError.conflict(`Category "${slug}" already exists`);
  }

  const category = await Category.create({ slug, label, icon: icon || null });
  await auditService.record(req.user.id, 'create_category', 'Category', category.id, { slug, label });

  res.status(201).json({ category });
});

// PUT /api/categories/:id (admin) - label/icon only. The slug is
// intentionally immutable once created: items already reference it by
// value, and there's no FK to cascade a rename through.
const update = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');

  if (req.body.label !== undefined) category.label = req.body.label;
  if (req.body.icon !== undefined) category.icon = req.body.icon;
  await category.save();

  await auditService.record(req.user.id, 'update_category', 'Category', category.id, req.body);
  res.json({ category });
});

// DELETE /api/categories/:id (admin) - blocked while any item still uses
// this category, so the catalog never ends up with orphaned items whose
// category no longer resolves to a label/icon.
const remove = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');

  const itemsUsingIt = await Item.count({ where: { category: category.slug } });
  if (itemsUsingIt > 0) {
    throw ApiError.conflict(
      `Cannot delete "${category.label}" - ${itemsUsingIt} item(s) still use it. Reassign or remove those items first.`
    );
  }

  await category.destroy();
  await auditService.record(req.user.id, 'delete_category', 'Category', req.params.id);
  res.status(204).send();
});

module.exports = { list, create, update, remove };
