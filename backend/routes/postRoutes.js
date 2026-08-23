const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const verifyToken = require('../middleware/verifyToken');
const uploadPostPhoto = require('../middleware/uploadPostPhoto');

router.post('/', verifyToken, postController.createPost);
router.get('/feed', verifyToken, postController.getCompatiblePosts);
router.get('/gallery', verifyToken, postController.getCompletedPostsWithPhotos);
router.post('/:id/join', verifyToken, postController.joinPost);
router.get('/mine', verifyToken, postController.getMyPosts);
router.get('/mine/photos', verifyToken, postController.getMyPhotos);
router.put('/:id', verifyToken, postController.updateMyPost);
router.get('/:id', verifyToken, postController.getPostById);
router.delete('/:id', verifyToken, postController.deleteMyPost);
router.post('/:id/leave', verifyToken, postController.leavePost);
router.get('/mine/events', verifyToken, postController.getJoinedPost);
router.get('/:id/participants', verifyToken, postController.getPostParticipants);
router.post('/:id/photos', verifyToken, uploadPostPhoto.single('photo'), postController.uploadPostPhoto)
router.delete('/:id/photos/:photoId', verifyToken, postController.deletePhoto);

module.exports = router;