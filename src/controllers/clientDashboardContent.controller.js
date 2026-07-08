const { sendSuccess } = require('../helpers/response');
const clientDashboardContentService = require('../services/clientDashboardContent.service');

module.exports = {
  listDiscoverExperiences: async (req, res) =>
    sendSuccess(res, await clientDashboardContentService.listDiscoverExperiences()),

  getDiscoverExperience: async (req, res) =>
    sendSuccess(res, await clientDashboardContentService.getDiscoverExperience(req.params.id)),

  createDiscoverExperience: async (req, res) =>
    sendSuccess(
      res,
      await clientDashboardContentService.createDiscoverExperience(req.file, req.body, req.user.id),
      'Discover experience created',
      201
    ),

  updateDiscoverExperience: async (req, res) =>
    sendSuccess(
      res,
      await clientDashboardContentService.updateDiscoverExperience(
        req.params.id,
        req.file,
        req.body,
        req.user.id
      ),
      'Discover experience updated'
    ),

  removeDiscoverExperience: async (req, res) =>
    sendSuccess(
      res,
      await clientDashboardContentService.removeDiscoverExperience(req.params.id),
      'Discover experience deleted'
    ),

  listTestimonials: async (req, res) =>
    sendSuccess(res, await clientDashboardContentService.listTestimonials()),

  getTestimonial: async (req, res) =>
    sendSuccess(res, await clientDashboardContentService.getTestimonial(req.params.id)),

  createTestimonial: async (req, res) =>
    sendSuccess(
      res,
      await clientDashboardContentService.createTestimonial(req.file, req.body, req.user.id),
      'Testimonial created',
      201
    ),

  updateTestimonial: async (req, res) =>
    sendSuccess(
      res,
      await clientDashboardContentService.updateTestimonial(
        req.params.id,
        req.file,
        req.body,
        req.user.id
      ),
      'Testimonial updated'
    ),

  removeTestimonial: async (req, res) =>
    sendSuccess(
      res,
      await clientDashboardContentService.removeTestimonial(req.params.id),
      'Testimonial deleted'
    ),
};
