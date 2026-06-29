const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const feedbackController = require('../controllers/feedback.controller');
const { feedbackReplySchema, bulkIdsSchema } = require('../validations/domain.validation');
const { idParamSchema } = require('../validations/event.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.post('/bulk-delete', validate(bulkIdsSchema), asyncHandler(feedbackController.bulkDelete));
router.post('/bulk-flag', validate(bulkIdsSchema), asyncHandler(feedbackController.bulkFlag));
router.post('/:id/reply', validate(idParamSchema, 'params'), validate(feedbackReplySchema), asyncHandler(feedbackController.reply));
router.post('/:id/flag', validate(idParamSchema, 'params'), asyncHandler(feedbackController.flag));

module.exports = router;
