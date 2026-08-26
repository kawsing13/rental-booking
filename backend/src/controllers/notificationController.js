const { Notification } = require('../db/models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// GET /api/notifications/mine
const listMine = asyncHandler(async (req, res) => {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 100,
  });
  res.json({ notifications });
});

// PUT /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification) throw ApiError.notFound('Notification not found');
  if (notification.userId !== req.user.id) throw ApiError.forbidden();

  notification.isRead = true;
  await notification.save();
  res.json({ notification });
});

// PUT /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
  res.json({ message: 'All notifications marked as read' });
});

module.exports = { listMine, markRead, markAllRead };
