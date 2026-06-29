const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const { uploadImage } = require('../config/multer');
const domain = require('../controllers/domain.controller');
const { updateProfileSchema, updatePreferencesSchema } = require('../validations/auth.validation');

const router = express.Router();

router.use(authenticate, requireSuperAdmin);

/**
 * @swagger
 * tags:
 *   - name: Profile
 *     description: User profile and preferences
 */

router.get('/', asyncHandler(domain.profile.getMe));
router.patch('/', validate(updateProfileSchema), asyncHandler(domain.profile.update));
router.patch('/preferences', validate(updatePreferencesSchema), asyncHandler(domain.profile.preferences));
router.post('/avatar', uploadImage.single('avatar'), asyncHandler(domain.profile.avatar));

module.exports = router;
