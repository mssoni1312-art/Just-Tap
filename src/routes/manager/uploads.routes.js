const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const { uploadImage, uploadDocument } = require('../../config/multer');
const domain = require('../../controllers/manager/domain.controller');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);

router.post('/images', uploadImage.single('file'), asyncHandler(domain.upload.image));
router.post('/documents', uploadDocument.single('file'), asyncHandler(domain.upload.document));

module.exports = router;
