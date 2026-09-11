const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const verifyToken = require('../middleware/verifyToken');

router.get('/search', verifyToken, friendController.searchUsers);
router.post('/request/:userId', verifyToken, friendController.sendRequest);
router.delete('/remove/:userId', verifyToken, friendController.removeRequest);
router.post('/accept/:id', verifyToken, friendController.acceptRequest);
router.get('/requests', verifyToken, friendController.getPendingRequests);
router.post('/reject/:id', verifyToken, friendController.rejectRequest);
router.delete('/:userId', verifyToken, friendController.removeFriend);
router.get('/list/:userId', verifyToken, friendController.getFriendsList);

module.exports = router;