const reportService = require('../report.service');
const reportPdfService = require('../reportPdf.service');
const { assertManagerOwnsEvent } = require('../../helpers/managerScope');
const { resolveId } = require('../../helpers/idResolver');
const reportRepository = require('../../repositories/report.repository');
const AppError = require('../../utils/AppError');

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
    return reportService.getById(reportIdOrUuid, userId);
  },

  async getByEventId(staffId, eventIdOrUuid, userId) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return reportService.getByEventId(eventIdOrUuid, userId);
  },

  uploadPhoto: async (staffId, reportId, file, userId, body) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.uploadPhoto(reportId, file, userId, body);
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
    return reportService.deletePhoto(photoId, userId);
  },

  selectTemplate: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.selectTemplate(reportId, data, userId);
  },

  updateTheme: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.updateTheme(reportId, data, userId);
  },

  updateTypography: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.updateTypography(reportId, data, userId);
  },

  updateGrid: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.updateGrid(reportId, data, userId);
  },

  updatePhotoFilter: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.updatePhotoFilter(reportId, data, userId);
  },

  saveDraft: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.saveDraft(reportId, data, userId);
  },

  publish: async (staffId, reportId, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.publish(reportId, userId);
  },

  share: async (staffId, reportId, data, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportService.share(reportId, data, userId);
  },

  generatePdf: async (staffId, reportId, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportPdfService.generate(reportId, userId);
  },

  downloadPdf: async (staffId, reportId, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportPdfService.download(reportId, userId);
  },

  deletePdf: async (staffId, reportId, userId) => {
    await assertManagerOwnsReportEvent(staffId, reportId);
    return reportPdfService.delete(reportId, userId);
  },
};

module.exports = managerReportService;
