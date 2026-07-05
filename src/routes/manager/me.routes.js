const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate.middleware');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const domain = require('../../controllers/manager/domain.controller');
const { updateProfileSchema, updatePreferencesSchema } = require('../../validations/auth.validation');
const { uploadImage } = require('../../config/multer');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);

router.get('/', asyncHandler(domain.profile.getMe));
router.patch('/', validate(updateProfileSchema), asyncHandler(domain.profile.update));
router.patch('/preferences', validate(updatePreferencesSchema), asyncHandler(domain.profile.preferences));
router.post('/avatar', uploadImage.single('avatar'), asyncHandler(domain.profile.avatar));

module.exports = router;
