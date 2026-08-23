const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, notificationController.getNotifications);
router.post('/:id/read', verifyToken, notificationController.markAsRead);

module.exports = router;