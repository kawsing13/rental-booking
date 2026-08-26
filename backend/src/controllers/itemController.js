const { Op } = require('sequelize');
const { Item, Category } = require('../db/models');
const inventoryService = require('../services/inventoryService');
const auditService = require('../services/auditService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Categories are admin-managed now (see categoryController), not a fixed
// ENUM, so item create/update checks the slug against the categories table
// instead of a hardcoded list.
async function assertValidCategory(slug) {
  const category = await Category.findOne({ where: { slug } });
  if (!category) {
    throw ApiError.badRequest(`Unknown category "${slug}". Add it first via category management.`);
  }
}

// GET /api/items - public catalog browse with category/search/price filters
// and pagination. Kept simple/fast: no availability calc here (that's a
// separate call) so the catalog grid loads instantly.
const list = asyncHandler(async (req, res) => {
  const { category, search, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

  const where = {};
  if (category) where.category = category;
  if (search) where.name = { [Op.iLike]: `%${search}%` };
  if (minPrice || maxPrice) {
    where.rentalPrice = {};
    if (minPrice) where.rentalPrice[Op.gte] = Number(minPrice);
    if (maxPrice) where.rentalPrice[Op.lte] = Number(maxPrice);
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { rows, count } = await Item.findAndCountAll({
    where,
    order: [['name', 'ASC']],
    limit: Number(limit),
    offset,
  });

  res.json({
    items: rows,
    pagination: { page: Number(page), limit: Number(limit), total: count },
  });
});

// GET /api/items/:id
const getOne = asyncHandler(async (req, res) => {
  const item = await Item.findByPk(req.params.id);
  if (!item) throw ApiError.notFound('Item not found');
  res.json({ item });
});

// GET /api/items/:id/availability?eventDate=YYYY-MM-DD&returnDate=YYYY-MM-DD
const checkAvailability = asyncHandler(async (req, res) => {
  const { eventDate, returnDate } = req.query;
  if (!eventDate || !returnDate) {
    throw ApiError.badRequest('eventDate and returnDate are required');
  }
  const availability = await inventoryService.getAvailability(req.params.id, eventDate, returnDate);
  res.json(availability);
});

// POST /api/items (admin)
const create = asyncHandler(async (req, res) => {
  const { name, category, description, rentalPrice, quantityTotal, images, rentalTerms } = req.body;

  await assertValidCategory(category);

  const item = await Item.create({
    name,
    category,
    description,
    rentalPrice,
    quantityTotal,
    images: images || [],
    rentalTerms,
  });

  await auditService.record(req.user.id, 'create_item', 'Item', item.id, { name, category });
  res.status(201).json({ item });
});

// PUT /api/items/:id (admin)
const update = asyncHandler(async (req, res) => {
  const item = await Item.findByPk(req.params.id);
  if (!item) throw ApiError.notFound('Item not found');

  if (req.body.category !== undefined) {
    await assertValidCategory(req.body.category);
  }

  const editable = ['name', 'category', 'description', 'rentalPrice', 'quantityTotal', 'images', 'rentalTerms', 'status'];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) item[field] = req.body[field];
  });

  await item.save();
  await auditService.record(req.user.id, 'update_item', 'Item', item.id, req.body);
  res.json({ item });
});

// DELETE /api/items/:id (admin)
const remove = asyncHandler(async (req, res) => {
  const item = await Item.findByPk(req.params.id);
  if (!item) throw ApiError.notFound('Item not found');

  await item.destroy();
  await auditService.record(req.user.id, 'delete_item', 'Item', req.params.id);
  res.status(204).send();
});

module.exports = { list, getOne, checkAvailability, create, update, remove };
