const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');
const requireSuperAdmin = require('../middleware/role.middleware');
const { uploadVideo } = require('../config/multer');
const clientEventTitleController = require('../controllers/clientEventTitle.controller');
const clientDashboardContentController = require('../controllers/clientDashboardContent.controller');
const reelController = require('../controllers/reel.controller');
const { idParamSchema } = require('../validations/common.validation');
const {
  listClientEventTitlesSchema,
  createClientEventTitleSchema,
  createReelSchema,
  clientFlowReelsListSchema,
  createDiscoverExperienceSchema,
  updateDiscoverExperienceSchema,
  createTestimonialSchema,
  updateTestimonialSchema,
} = require('../validations/domain.validation');

const router = express.Router();

router.get(
  '/our-events',
  validate(listClientEventTitlesSchema, 'query'),
  asyncHandler(clientEventTitleController.list)
);

router.use(authenticate, requireSuperAdmin);

router.post(
  '/our-events',
  validate(createClientEventTitleSchema),
  asyncHandler(clientEventTitleController.create)
);
router.delete(
  '/our-events/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(clientEventTitleController.remove)
);

router.get(
  '/reels',
  validate(clientFlowReelsListSchema, 'query'),
  asyncHandler(reelController.list)
);
router.post(
  '/reels',
  uploadVideo.single('file'),
  validate(createReelSchema),
  asyncHandler(reelController.create)
);
router.delete(
  '/reels/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(reelController.remove)
);

router.get(
  '/discover-experiences',
  asyncHandler(clientDashboardContentController.listDiscoverExperiences)
);
router.post(
  '/discover-experiences',
  uploadVideo.single('file'),
  validate(createDiscoverExperienceSchema),
  asyncHandler(clientDashboardContentController.createDiscoverExperience)
);
router.get(
  '/discover-experiences/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(clientDashboardContentController.getDiscoverExperience)
);
router.patch(
  '/discover-experiences/:id',
  validate(idParamSchema, 'params'),
  uploadVideo.single('file'),
  validate(updateDiscoverExperienceSchema),
  asyncHandler(clientDashboardContentController.updateDiscoverExperience)
);
router.delete(
  '/discover-experiences/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(clientDashboardContentController.removeDiscoverExperience)
);

router.get(
  '/testimonials',
  asyncHandler(clientDashboardContentController.listTestimonials)
);
router.post(
  '/testimonials',
  uploadVideo.single('file'),
  validate(createTestimonialSchema),
  asyncHandler(clientDashboardContentController.createTestimonial)
);
router.get(
  '/testimonials/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(clientDashboardContentController.getTestimonial)
);
router.patch(
  '/testimonials/:id',
  validate(idParamSchema, 'params'),
  uploadVideo.single('file'),
  validate(updateTestimonialSchema),
  asyncHandler(clientDashboardContentController.updateTestimonial)
);
router.delete(
  '/testimonials/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(clientDashboardContentController.removeTestimonial)
);

module.exports = router;
