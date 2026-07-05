const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate.middleware');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const feedbackController = require('../../controllers/manager/feedback.controller');
const { feedbackReplySchema } = require('../../validations/domain.validation');
const { listFeedbackSchema } = require('../../validations/domain.validation');
const { idParamSchema } = require('../../validations/event.validation');

const router = express.Router();
router.use(authenticate, requireManager, resolveManagerStaff);

router.get('/', validate(listFeedbackSchema, 'query'), asyncHandler(feedbackController.list));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(feedbackController.getById));
router.post('/:id/reply', validate(idParamSchema, 'params'), validate(feedbackReplySchema), asyncHandler(feedbackController.reply));
router.post('/:id/flag', validate(idParamSchema, 'params'), asyncHandler(feedbackController.flag));
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(feedbackController.remove));

module.exports = router;
