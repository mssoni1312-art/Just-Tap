const { sendSuccess } = require('../helpers/response');
const reportService = require('../services/report.service');
const reportPdfService = require('../services/reportPdf.service');
const fs = require('fs');

module.exports = {
  meta: async (_req, res) => sendSuccess(res, reportService.getMeta()),
  listTemplates: async (req, res) => sendSuccess(res, await reportService.listTemplates(req.query)),
  create: async (req, res) => {
    const { report, created } = await reportService.create(req.body, req.user.id);
    return sendSuccess(
      res,
      report,
      created ? 'Report created' : 'Report retrieved',
      created ? 201 : 200,
    );
  },
  getById: async (req, res) => sendSuccess(res, await reportService.getById(req.params.id, req.user.id)),
  getByEventId: async (req, res) =>
    sendSuccess(res, await reportService.getByEventId(req.params.eventId, req.user.id)),
  uploadPhoto: async (req, res) =>
    sendSuccess(
      res,
      await reportService.uploadPhoto(req.body.reportId, req.file, req.user.id, req.body),
      'Photo uploaded',
      201,
    ),
  uploadClientLogo: async (req, res) =>
    sendSuccess(
      res,
      await reportService.uploadClientLogo(req.body.reportId, req.file, req.user.id),
      'Client logo uploaded',
      201,
    ),
  deletePhoto: async (req, res) =>
    sendSuccess(
      res,
      await reportService.deletePhoto(req.params.photoId, req.user.id),
      'Photo deleted',
    ),
  selectTemplate: async (req, res) =>
    sendSuccess(res, await reportService.selectTemplate(req.body.reportId, req.body, req.user.id), 'Template selected'),
  uploadTemplate: async (req, res) =>
    sendSuccess(
      res,
      await reportService.uploadTemplate(req.file, req.user.id, req.body),
      'Template uploaded',
      201,
    ),
  updateTheme: async (req, res) =>
    sendSuccess(res, await reportService.updateTheme(req.body.reportId, req.body, req.user.id), 'Theme updated'),
  updateTypography: async (req, res) =>
    sendSuccess(res, await reportService.updateTypography(req.body.reportId, req.body, req.user.id), 'Typography updated'),
  updateGrid: async (req, res) =>
    sendSuccess(res, await reportService.updateGrid(req.body.reportId, req.body, req.user.id), 'Grid settings updated'),
  updatePhotoFilter: async (req, res) =>
    sendSuccess(
      res,
      await reportService.updatePhotoFilter(req.body.reportId, req.body, req.user.id),
      'Photo filter updated',
    ),
  updateClientDetails: async (req, res) =>
    sendSuccess(
      res,
      await reportService.updateClientDetails(req.body, req.user.id),
      'Client details updated',
    ),
  saveDraft: async (req, res) =>
    sendSuccess(res, await reportService.saveDraft(req.body.reportId, req.body, req.user.id), 'Draft saved'),
  publish: async (req, res) =>
    sendSuccess(res, await reportService.publish(req.body.reportId, req.user.id), 'Report published'),
  share: async (req, res) =>
    sendSuccess(res, await reportService.share(req.body.reportId, req.body, req.user.id), 'Report shared with client'),

  generatePdf: async (req, res) =>
    sendSuccess(
      res,
      await reportPdfService.generate(req.body.reportId, req.user.id),
      'PDF generated',
      201,
    ),

  downloadPdf: async (req, res) => {
    const { filePath, fileName, pdfUrl, pdf } = await reportPdfService.download(req.params.reportId, req.user.id);

    if (req.query.urlOnly === 'true') {
      return sendSuccess(res, { pdfUrl, pdf });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(fs.readFileSync(filePath));
  },

  deletePdf: async (req, res) =>
    sendSuccess(res, await reportPdfService.delete(req.params.reportId, req.user.id), 'PDF deleted'),
};
