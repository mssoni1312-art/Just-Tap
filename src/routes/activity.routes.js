const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const activityController = require('../controllers/activity.controller');
const { eventIdParam } = require('../validations/event.validation');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

router.get('/recent', asyncHandler(activityController.recent));
router.get('/events/:eventId', validate(eventIdParam, 'params'), asyncHandler(activityController.byEvent));

module.exports = router;
