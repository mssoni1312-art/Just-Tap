const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const feedbackQuestionController = require('../controllers/feedbackQuestion.controller');
const {
  publicFeedbackQuestionsSchema,
  submitFeedbackQuestionnaireSchema,
} = require('../validations/domain.validation');
const { eventIdParam } = require('../validations/event.validation');

const router = express.Router();

router.get(
  '/feedback-questions',
  validate(publicFeedbackQuestionsSchema, 'query'),
  asyncHandler(feedbackQuestionController.getActiveByQuery)
);

router.get(
  '/events/:eventId/feedback-questions',
  validate(eventIdParam, 'params'),
  asyncHandler(feedbackQuestionController.getActiveForEvent)
);

router.post(
  '/feedback-submissions',
  validate(submitFeedbackQuestionnaireSchema),
  asyncHandler(feedbackQuestionController.submit)
);

module.exports = router;
