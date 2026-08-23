const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../middleware/upload');

router.put('/me', verifyToken, upload.fields([ { name: 'profilePicture', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }, ]), userController.updateProfile);
router.get('/:id', verifyToken, userController.getPublicProfile);

module.exports = router;