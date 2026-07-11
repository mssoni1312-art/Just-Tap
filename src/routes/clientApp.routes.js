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
  listDiscoverExperiencesSchema,
  createClientDashboardContentSchema,
  updateDiscoverExperienceSchema,
  listTestimonialsSchema,
  updateTestimonialSchema,
} = require('../validations/domain.validation');

const router = express.Router();

// Super Admin module — all routes require super admin auth
router.use(authenticate, requireSuperAdmin);

router.get(
  '/our-events',
  validate(listClientEventTitlesSchema, 'query'),
  asyncHandler(clientEventTitleController.list)
);
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

// Combined create for Discover Experience + Testimonial
router.post(
  '/discover-experiences',
  uploadVideo.single('file'),
  validate(createClientDashboardContentSchema),
  asyncHandler(clientDashboardContentController.create)
);

router.get(
  '/discover-experiences',
  validate(listDiscoverExperiencesSchema, 'query'),
  asyncHandler(clientDashboardContentController.listDiscoverExperiences)
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
  validate(listTestimonialsSchema, 'query'),
  asyncHandler(clientDashboardContentController.listTestimonials)
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
