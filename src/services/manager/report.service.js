const reportService = require('../report.service');
const reportPdfService = require('../reportPdf.service');
const { assertManagerOwnsEvent } = require('../../helpers/managerScope');
const { resolveId } = require('../../helpers/idResolver');
const reportRepository = require('../../repositories/report.repository');
const AppError = require('../../utils/AppError');

const MANAGER_REPORT_OPTIONS = { skipAccessCheck: true };

const assertManagerOwnsReportEvent = async (staffId, reportIdOrUuid) => {
  const reportId = await resolveId('report_master', reportIdOrUuid);
  const eventId = await reportRepository.getEventId(reportId);
  if (!eventId) throw new AppError('Report not found', 404);
  await assertManagerOwnsEvent(staffId, eventId);
  return reportId;
};

const managerReportService = {
  getMeta: () => reportService.getMeta(),
  listTemplates: (query) => reportService.listTemplates(query),

  async create(staffId, data, userId) {
    const eventId = await resolveId('events', data.eventId);
    await assertManagerOwnsEvent(staffId, eventId);
    return reportService.create(data, userId);
  },

  async getById(staffId, reportIdOrUuid, userId) {
    await assertManagerOwnsReportEvent(staffId, reportIdOrUuid);
    return reportService.getById(reportIdOrUuid, userId, MANAGER_REPORT_OPTIONS);
  },

  async getByEventId(staffId, eventIdOrUuid, userId) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return reportService.getByEventId(eventIdOrUuid, userId, MANAGER_REPORT_OPTIONS);
  },

  uploadPhoto: async (staffId, reportId, file, userId, body) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.uploadPhoto(reportId, file, userId, body, MANAGER_REPORT_OPTIONS);
  },

  uploadClientLogo: async (staffId, reportId, file, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.uploadClientLogo(reportId, file, userId);
  },

  uploadTemplate: (file, userId, body) => reportService.uploadTemplate(file, userId, body),

  deletePhoto: async (staffId, photoId, userId) => {
    const numericPhotoId = Number(photoId);
    if (!Number.isInteger(numericPhotoId) || numericPhotoId <= 0) {
      throw new AppError('Photo not found', 404);
    }

    const photo = await reportRepository.findPhotoById(numericPhotoId);
    if (!photo) throw new AppError('Photo not found', 404);

    await assertManagerOwnsReportEvent(staffId, photo.reportId);
    return reportService.deletePhoto(photoId, userId, MANAGER_REPORT_OPTIONS);
  },

  selectTemplate: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.selectTemplate(reportId, data, userId, MANAGER_REPORT_OPTIONS);
  },

  updateTheme: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.updateTheme(reportId, data, userId, MANAGER_REPORT_OPTIONS);
  },

  updateTypography: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.updateTypography(reportId, data, userId, MANAGER_REPORT_OPTIONS);
  },

  updateGrid: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.updateGrid(reportId, data, userId, MANAGER_REPORT_OPTIONS);
  },

  updatePhotoFilter: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.updatePhotoFilter(reportId, data, userId, MANAGER_REPORT_OPTIONS);
  },

  updateClientDetails: async (staffId, data, userId) => {
    if (data.reportId) {
      await assertManagerOwnsReportEvent(staffId, data.reportId);
    } else {
      const eventId = await resolveId('events', data.eventId);
      await assertManagerOwnsEvent(staffId, eventId);
    }
    return reportService.updateClientDetails(data, userId);
  },

  saveDraft: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.saveDraft(reportId, data, userId, MANAGER_REPORT_OPTIONS);
  },

  publish: async (staffId, reportId, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.publish(reportId, userId, MANAGER_REPORT_OPTIONS);
  },

  share: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.share(reportId, data, userId, MANAGER_REPORT_OPTIONS);
  },

  generatePdf: async (staffId, reportId, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportPdfService.generate(reportId, userId, MANAGER_REPORT_OPTIONS);
  },

  downloadPdf: async (staffId, reportId, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportPdfService.download(reportId, userId, MANAGER_REPORT_OPTIONS);
  },

  deletePdf: async (staffId, reportId, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportPdfService.delete(reportId, userId, MANAGER_REPORT_OPTIONS);
  },
};

module.exports = managerReportService;
