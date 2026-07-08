const crypto = require('crypto');
const reportRepository = require('../repositories/report.repository');
const eventRepository = require('../repositories/event.repository');
const activityRepository = require('../repositories/activity.repository');
const { uploadService } = require('./profile.service');
const { resolveId } = require('../helpers/idResolver');
const { buildPaginatedResponse } = require('../helpers/pagination');
const AppError = require('../utils/AppError');

const TEMPLATE_CATEGORIES = ['all', 'luxury', 'minimal', 'classic', 'custom'];
const TEMPLATE_THEME_DEFAULTS = {
  luxury: {
    primary: { hex: '#A9A9A9', opacity: 100 },
    secondary: { hex: '#D4AF37', opacity: 100 },
    accent: { hex: '#FFFFFF', opacity: 100 },
    background: { hex: '#1A1A1A', opacity: 100 },
  },
  classic: {
    primary: { hex: '#D4AF37', opacity: 100 },
    secondary: { hex: '#8B7355', opacity: 100 },
    accent: { hex: '#FFFFFF', opacity: 100 },
    background: { hex: '#0F0F0F', opacity: 100 },
  },
  minimal: {
    primary: { hex: '#1A1A1A', opacity: 100 },
    secondary: { hex: '#666666', opacity: 100 },
    accent: { hex: '#FFFFFF', opacity: 100 },
    background: { hex: '#F5F5F5', opacity: 100 },
  },
  custom: {
    primary: { hex: '#A9A9A9', opacity: 100 },
    secondary: { hex: '#D4AF37', opacity: 100 },
    accent: { hex: '#FFFFFF', opacity: 100 },
    background: { hex: '#1A1A1A', opacity: 100 },
  },
};
const FONT_PAIRINGS = ['playfair_inter', 'space_grotesk_mono', 'fraunces_inter'];
const GRID_PRESETS = ['compact', 'default', 'spacious'];
const PHOTO_FILTER_PRESETS = ['none', 'vintage_gold', 'high_contrast', 'warm', 'cool', 'sepia'];
const LAYOUT_POSITIONS = ['top', 'background', 'side'];

const toDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

async function resolveReportId(reportIdOrUuid) {
  return resolveId('report_master', reportIdOrUuid);
}

async function assertReportAccess(reportId, userId, options = {}) {
  if (options.skipAccessCheck) return;

  const ownerId = await reportRepository.getOwnerId(reportId);
  if (!ownerId) throw new AppError('Report not found', 404);
  if (String(ownerId) !== String(userId)) {
    throw new AppError('You do not have permission to access this report', 403);
  }
}

const reportService = {
  getMeta() {
    return {
      templateCategories: TEMPLATE_CATEGORIES.filter((c) => c !== 'all'),
      fontPairings: FONT_PAIRINGS,
      gridPresets: GRID_PRESETS,
      photoFilterPresets: PHOTO_FILTER_PRESETS,
      layoutPositions: LAYOUT_POSITIONS,
      statuses: ['draft', 'published', 'shared'],
    };
  },

  async listTemplates(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const category = query.category || 'all';

    const { items, total } = await reportRepository.listTemplates({
      category,
      search: query.search,
      page,
      limit,
    });

    return buildPaginatedResponse(items, total, page, limit);
  },

  async create(data, userId) {
    const eventId = await resolveId('events', data.eventId);

    const existingReportId = await reportRepository.findByEventId(eventId);
    if (existingReportId) {
      return {
        report: await reportRepository.findById(existingReportId),
        created: false,
      };
    }

    let packageId = null;
    if (data.packageId) {
      packageId = await resolveId('menu_packages', data.packageId);
    }

    let templateId = null;
    if (data.templateId) {
      templateId = await resolveId('report_templates', data.templateId);
      const template = await reportRepository.findTemplateById(templateId);
      if (!template) throw new AppError('Invalid template', 400);
    }

    const reportId = await reportRepository.create({
      eventId,
      packageId,
      templateId,
      includeMenuInTemplate: data.includeMenuInTemplate,
      layoutPosition: data.layoutPosition,
      userId,
    });

    await activityRepository.log({
      eventId,
      userId,
      action: 'report_created',
      description: 'Report builder draft created',
      metadata: { reportId },
    });

    return {
      report: await reportRepository.findById(reportId),
      created: true,
    };
  },

  async getById(reportIdOrUuid, userId, options = {}) {
    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId, options);
    const report = await reportRepository.findById(reportId);
    if (!report) throw new AppError('Report not found', 404);
    return report;
  },

  async getByEventId(eventIdOrUuid, userId, options = {}) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const existingReportId = await reportRepository.findByEventId(eventId);
    if (!existingReportId) throw new AppError('Report not found', 404);
    await assertReportAccess(existingReportId, userId, options);
    const report = await reportRepository.findById(existingReportId);
    if (!report) throw new AppError('Report not found', 404);
    return report;
  },

  async deletePhoto(photoId, userId, options = {}) {
    const numericPhotoId = Number(photoId);
    if (!Number.isInteger(numericPhotoId) || numericPhotoId <= 0) {
      throw new AppError('Photo not found', 404);
    }

    const photo = await reportRepository.findPhotoById(numericPhotoId);
    if (!photo) throw new AppError('Photo not found', 404);

    await assertReportAccess(photo.reportId, userId, options);

    const report = await reportRepository.findById(photo.reportId);
    if (report?.brideGroomPhotoUrl && report.brideGroomPhotoUrl === photo.imageUrl) {
      await reportRepository.updateMaster(photo.reportId, { brideGroomPhotoUrl: null }, userId);
    }

    await reportRepository.softDeletePhoto(numericPhotoId);

    return {
      photoId: String(numericPhotoId),
      reportId: String(photo.reportId),
      deleted: true,
    };
  },

  async uploadPhoto(reportIdOrUuid, file, userId, body = {}, options = {}) {
    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId, options);

    const upload = await uploadService.saveUpload(userId, file, 'image');
    const sortOrder = body.sortOrder != null ? Number(body.sortOrder) : 0;

    await reportRepository.addPhoto(reportId, {
      imageUrl: upload.url,
      uploadId: upload.id,
      sortOrder,
    });

    if (body.setAsBrideGroomPhoto) {
      await reportRepository.updateMaster(reportId, { brideGroomPhotoUrl: upload.url }, userId);
    }

    return {
      ...upload,
      reportId: String(reportId),
      setAsBrideGroomPhoto: Boolean(body.setAsBrideGroomPhoto),
    };
  },

  async uploadClientLogo(reportIdOrUuid, file, userId) {
    if (!file) throw new AppError('Image file is required', 400);

    const reportId = await resolveReportId(reportIdOrUuid);
    const report = await reportRepository.findById(reportId);
    if (!report) throw new AppError('Report not found', 404);

    const upload = await uploadService.saveUpload(userId, file, 'image');
    await reportRepository.updateMaster(reportId, { clientLogoUrl: upload.url }, userId);

    return {
      ...upload,
      reportId: String(reportId),
      clientLogoUrl: upload.url,
    };
  },

  async uploadTemplate(file, userId, body = {}) {
    const upload = await uploadService.saveUpload(userId, file, 'image');
    const name = String(body.name || 'Custom Design').trim() || 'Custom Design';

    const template = await reportRepository.createTemplate({
      name,
      previewUrl: upload.url,
      thumbnailUrl: upload.url,
      category: 'custom',
    });

    if (!template) throw new AppError('Unable to save custom template', 500);
    return template;
  },

  async selectTemplate(reportIdOrUuid, data, userId, options = {}) {
    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId, options);

    const templateId = await resolveId('report_templates', data.templateId);
    const template = await reportRepository.findTemplateById(templateId);
    if (!template) throw new AppError('Invalid template', 400);

    await reportRepository.updateMaster(reportId, { templateId }, userId);

    const themeDefaults =
      TEMPLATE_THEME_DEFAULTS[template.category] || TEMPLATE_THEME_DEFAULTS.classic;
    await reportRepository.upsertTheme(reportId, themeDefaults);

    return reportRepository.findById(reportId);
  },

  async updateTheme(reportIdOrUuid, data, userId, options = {}) {
    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId, options);

    const report = await reportRepository.findById(reportId);
    if (!report) throw new AppError('Report not found', 404);

    const colors = { ...report.theme, ...data.colors };
    await reportRepository.upsertTheme(reportId, colors);
    await reportRepository.updateMaster(reportId, {}, userId);

    return reportRepository.findById(reportId);
  },

  async updateTypography(reportIdOrUuid, data, userId, options = {}) {
    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId, options);

    const report = await reportRepository.findById(reportId);
    if (!report) throw new AppError('Report not found', 404);

    const typography = {
      ...report.typography,
      ...(data.fontPairing !== undefined ? { fontPairing: data.fontPairing } : {}),
      ...(data.sizeScaling !== undefined ? { sizeScaling: data.sizeScaling } : {}),
    };

    await reportRepository.upsertSettings(reportId, { typography });
    await reportRepository.updateMaster(reportId, {}, userId);

    return reportRepository.findById(reportId);
  },

  async updateGrid(reportIdOrUuid, data, userId, options = {}) {
    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId, options);

    const report = await reportRepository.findById(reportId);
    if (!report) throw new AppError('Report not found', 404);

    const grid = {
      ...report.grid,
      ...(data.preset !== undefined ? { preset: data.preset } : {}),
      ...(data.customIntensity !== undefined ? { customIntensity: data.customIntensity } : {}),
    };

    await reportRepository.upsertSettings(reportId, { grid });
    await reportRepository.updateMaster(reportId, {}, userId);

    return reportRepository.findById(reportId);
  },

  async updatePhotoFilter(reportIdOrUuid, data, userId, options = {}) {
    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId, options);

    const report = await reportRepository.findById(reportId);
    if (!report) throw new AppError('Report not found', 404);

    const photoFilter = {
      ...report.photoFilter,
      ...(data.preset !== undefined ? { preset: data.preset } : {}),
      ...(data.intensity !== undefined ? { intensity: data.intensity } : {}),
    };

    await reportRepository.upsertSettings(reportId, { photoFilter });
    await reportRepository.updateMaster(reportId, {}, userId);

    return reportRepository.findById(reportId);
  },

  async updateClientDetails(data, userId) {
    let reportId = null;
    let eventId = null;

    if (data.reportId) {
      reportId = await resolveReportId(data.reportId);
      eventId = await reportRepository.getEventId(reportId);
    } else {
      eventId = await resolveId('events', data.eventId);
      reportId = await reportRepository.findByEventId(eventId);
    }

    if (!eventId) throw new AppError('Event not found', 404);

    const eventRow = await eventRepository.findById(eventId);
    if (!eventRow) throw new AppError('Event not found', 404);

    const eventUpdate = {};
    if (data.clientName !== undefined) eventUpdate.client_name = data.clientName;
    if (data.clientMobile !== undefined) eventUpdate.client_mobile = data.clientMobile || null;
    if (data.brideName !== undefined) eventUpdate.bride_name = data.brideName || null;
    if (data.groomName !== undefined) eventUpdate.groom_name = data.groomName || null;
    if (data.functionName !== undefined) eventUpdate.event_function_name = data.functionName || null;
    if (data.venueName !== undefined) eventUpdate.venue_name = data.venueName;
    if (data.cityName !== undefined) eventUpdate.city_name = data.cityName;

    if (data.eventStartDate !== undefined) {
      const startDate = toDateOnly(data.eventStartDate);
      eventUpdate.start_date = startDate;
      const currentEndDate = toDateOnly(eventRow.end_date);
      if (currentEndDate && startDate > currentEndDate) {
        eventUpdate.end_date = startDate;
      }
    }

    await eventRepository.update(eventId, eventUpdate);

    if (!reportId) {
      const created = await this.create({ eventId }, userId);
      reportId = Number(created.report.id);
    } else {
      await reportRepository.touchMaster(reportId, userId);
    }

    return reportRepository.findById(reportId);
  },

  async saveDraft(reportIdOrUuid, data, userId, options = {}) {
    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId, options);

    const masterUpdate = { status: 'draft' };
    if (data.packageId !== undefined) {
      masterUpdate.packageId = data.packageId ? await resolveId('menu_packages', data.packageId) : null;
    }
    if (data.includeMenuInTemplate !== undefined) {
      masterUpdate.includeMenuInTemplate = data.includeMenuInTemplate;
    }
    if (data.layoutPosition !== undefined) {
      masterUpdate.layoutPosition = data.layoutPosition;
    }

    await reportRepository.updateMaster(reportId, masterUpdate, userId);
    return reportRepository.findById(reportId);
  },

  async publish(reportIdOrUuid, userId, options = {}) {
    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId, options);

    const report = await reportRepository.findById(reportId);
    if (!report) throw new AppError('Report not found', 404);
    if (!report.template) {
      throw new AppError('Select a template before publishing', 400);
    }

    const now = new Date();
    await reportRepository.updateMaster(reportId, {
      status: 'published',
      publishedAt: now,
    }, userId);

    await activityRepository.log({
      eventId: Number(report.eventId),
      userId,
      action: 'report_published',
      description: 'Report published',
      metadata: { reportId },
    });

    return reportRepository.findById(reportId);
  },

  async share(reportIdOrUuid, data, userId, options = {}) {
    const reportId = await resolveReportId(reportIdOrUuid);
    await assertReportAccess(reportId, userId, options);

    const report = await reportRepository.findById(reportId);
    if (!report) throw new AppError('Report not found', 404);
    if (report.status === 'draft') {
      throw new AppError('Publish the report before sharing with client', 400);
    }

    const shareToken = crypto.randomBytes(32).toString('hex');
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/api/v1/report/shared/${shareToken}`;

    await reportRepository.createShare(reportId, {
      shareToken,
      sharedBy: userId,
      expiresAt: data.expiresAt || null,
      notes: data.notes || null,
    });

    await reportRepository.updateMaster(reportId, { status: 'shared' }, userId);

    await activityRepository.log({
      eventId: Number(report.eventId),
      userId,
      action: 'report_shared',
      description: 'Report shared with client',
      metadata: { reportId, shareToken },
    });

    return {
      reportId: String(reportId),
      shareToken,
      shareUrl,
      sharedAt: new Date().toISOString(),
      expiresAt: data.expiresAt || null,
      notes: data.notes || null,
    };
  },
};

module.exports = reportService;
