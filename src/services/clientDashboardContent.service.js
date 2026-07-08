const clientDashboardContentRepository = require('../repositories/clientDashboardContent.repository');
const { uploadService } = require('./profile.service');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

const CONTENT_TYPES = {
  DISCOVER_EXPERIENCE: 'discover_experience',
  TESTIMONIAL: 'testimonial',
};

const assertContent = async (idOrUuid, expectedType) => {
  const id = await resolveId('client_dashboard_content', idOrUuid);
  const row = await clientDashboardContentRepository.findById(id);
  if (!row || row.contentType !== expectedType) {
    throw new AppError(`${expectedType === CONTENT_TYPES.DISCOVER_EXPERIENCE ? 'Discover experience' : 'Testimonial'} not found`, 404);
  }
  return { id, row };
};

const clientDashboardContentService = {
  async listDiscoverExperiences() {
    return clientDashboardContentRepository.listByType(CONTENT_TYPES.DISCOVER_EXPERIENCE);
  },

  async listTestimonials() {
    return clientDashboardContentRepository.listByType(CONTENT_TYPES.TESTIMONIAL);
  },

  async getDiscoverExperience(idOrUuid) {
    const { row } = await assertContent(idOrUuid, CONTENT_TYPES.DISCOVER_EXPERIENCE);
    return row;
  },

  async getTestimonial(idOrUuid) {
    const { row } = await assertContent(idOrUuid, CONTENT_TYPES.TESTIMONIAL);
    return row;
  },

  async createDiscoverExperience(file, body, userId) {
    if (!file) throw new AppError('Video file is required', 400);

    const upload = await uploadService.saveUpload(userId, file, 'video');
    return clientDashboardContentRepository.create({
      contentType: CONTENT_TYPES.DISCOVER_EXPERIENCE,
      uploadId: upload.id,
      videoUrl: upload.url,
      description: body.description,
      sortOrder: body.sortOrder,
      createdBy: userId,
    });
  },

  async createTestimonial(file, body, userId) {
    let uploadId = null;
    let videoUrl = null;
    if (file) {
      const upload = await uploadService.saveUpload(userId, file, 'video');
      uploadId = upload.id;
      videoUrl = upload.url;
    }

    return clientDashboardContentRepository.create({
      contentType: CONTENT_TYPES.TESTIMONIAL,
      uploadId,
      videoUrl,
      description: body.description,
      name: body.name,
      rating: body.rating,
      sortOrder: body.sortOrder,
      createdBy: userId,
    });
  },

  async updateDiscoverExperience(idOrUuid, file, body, userId) {
    const { id } = await assertContent(idOrUuid, CONTENT_TYPES.DISCOVER_EXPERIENCE);

    const patch = {};
    if (body.description !== undefined) patch.description = body.description;
    if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;

    if (file) {
      const upload = await uploadService.saveUpload(userId, file, 'video');
      patch.uploadId = upload.id;
      patch.videoUrl = upload.url;
    }

    return clientDashboardContentRepository.update(id, patch);
  },

  async updateTestimonial(idOrUuid, file, body, userId) {
    const { id } = await assertContent(idOrUuid, CONTENT_TYPES.TESTIMONIAL);

    const patch = {};
    if (body.description !== undefined) patch.description = body.description;
    if (body.name !== undefined) patch.name = body.name;
    if (body.rating !== undefined) patch.rating = body.rating;
    if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;

    if (file) {
      const upload = await uploadService.saveUpload(userId, file, 'video');
      patch.uploadId = upload.id;
      patch.videoUrl = upload.url;
    }

    return clientDashboardContentRepository.update(id, patch);
  },

  async removeDiscoverExperience(idOrUuid) {
    const { id } = await assertContent(idOrUuid, CONTENT_TYPES.DISCOVER_EXPERIENCE);
    await clientDashboardContentRepository.softDelete(id);
    return { deleted: true };
  },

  async removeTestimonial(idOrUuid) {
    const { id } = await assertContent(idOrUuid, CONTENT_TYPES.TESTIMONIAL);
    await clientDashboardContentRepository.softDelete(id);
    return { deleted: true };
  },
};

module.exports = clientDashboardContentService;
