const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const feedbackQuestionController = require('../controllers/feedbackQuestion.controller');
const {
  listFeedbackQuestionsSchema,
  createFeedbackQuestionSchema,
  updateFeedbackQuestionSchema,
  reorderFeedbackQuestionsSchema,
  listFeedbackSubmissionsSchema,
  submitFeedbackQuestionnaireSchema,
  bulkIdsSchema,
} = require('../validations/domain.validation');
const { idParamSchema, eventIdParam } = require('../validations/event.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/', validate(listFeedbackQuestionsSchema, 'query'), asyncHandler(feedbackQuestionController.list));
router.post('/', validate(createFeedbackQuestionSchema), asyncHandler(feedbackQuestionController.create));
router.patch('/reorder', validate(reorderFeedbackQuestionsSchema), asyncHandler(feedbackQuestionController.reorder));
router.post('/bulk-delete', validate(bulkIdsSchema), asyncHandler(feedbackQuestionController.bulkDelete));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(feedbackQuestionController.getById));
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateFeedbackQuestionSchema), asyncHandler(feedbackQuestionController.update));
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(feedbackQuestionController.remove));

module.exports = router;
