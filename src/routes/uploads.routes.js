const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const { uploadImage, uploadDocument, uploadVideo } = require('../config/multer');
const domain = require('../controllers/domain.controller');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

/**
 * @swagger
 * tags:
 *   - name: Uploads
 *     description: File uploads
 */

router.post('/images', uploadImage.single('file'), asyncHandler(domain.upload.image));
router.post('/documents', uploadDocument.single('file'), asyncHandler(domain.upload.document));
router.post('/videos', uploadVideo.single('file'), asyncHandler(domain.upload.video));

module.exports = router;
