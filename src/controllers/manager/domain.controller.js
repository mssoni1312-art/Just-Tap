const { sendSuccess } = require('../../helpers/response');
const managerReportService = require('../../services/manager/report.service');
const managerAuthService = require('../../services/manager/auth.service');
const { profileService, uploadService } = require('../../services/profile.service');
const fs = require('fs');

module.exports = {
  profile: {
    getMe: async (req, res) => sendSuccess(res, await managerAuthService.getMe(req.user.id)),
    update: async (req, res) =>
      sendSuccess(res, await profileService.updateProfile(req.user.id, req.body)),
    preferences: async (req, res) =>
      sendSuccess(res, await profileService.updatePreferences(req.user.id, req.body)),
    avatar: async (req, res) =>
      sendSuccess(res, await profileService.saveAvatar(req.user.id, req.file)),
  },
  upload: {
    image: async (req, res) =>
      sendSuccess(
        res,
        await uploadService.saveUpload(req.user.id, req.file, 'image'),
        'Image uploaded',
        201
      ),
    document: async (req, res) =>
      sendSuccess(
        res,
        await uploadService.saveUpload(req.user.id, req.file, 'document'),
        'Document uploaded',
        201
      ),
    video: async (req, res) =>
      sendSuccess(
        res,
        await uploadService.saveUpload(req.user.id, req.file, 'video'),
        'Video uploaded',
        201
      ),
  },
  report: {
    meta: async (_req, res) => sendSuccess(res, managerReportService.getMeta()),
    listTemplates: async (req, res) =>
      sendSuccess(res, await managerReportService.listTemplates(req.query)),
    create: async (req, res) => {
      const { report, created } = await managerReportService.create(
        req.managerStaffId,
        req.body,
        req.user.id,
      );
      return sendSuccess(
        res,
        report,
        created ? 'Report created' : 'Report retrieved',
        created ? 201 : 200,
      );
    },
    getById: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.getById(req.managerStaffId, req.params.id, req.user.id)
      ),
    getByEventId: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.getByEventId(
          req.managerStaffId,
          req.params.eventId,
          req.user.id,
        ),
      ),
    uploadPhoto: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.uploadPhoto(
          req.managerStaffId,
          req.body.reportId,
          req.file,
          req.user.id,
          req.body
        ),
        'Photo uploaded',
        201
      ),
    uploadClientLogo: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.uploadClientLogo(
          req.managerStaffId,
          req.body.reportId,
          req.file,
          req.user.id
        ),
        'Client logo uploaded',
        201
      ),
    deletePhoto: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.deletePhoto(req.managerStaffId, req.params.photoId, req.user.id),
        'Photo deleted'
      ),
    selectTemplate: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.selectTemplate(
          req.managerStaffId,
          req.body.reportId,
          req.body,
          req.user.id
        )
      ),
    uploadTemplate: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.uploadTemplate(req.file, req.user.id, req.body),
        'Template uploaded',
        201
      ),
    updateTheme: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.updateTheme(
          req.managerStaffId,
          req.body.reportId,
          req.body,
          req.user.id
        )
      ),
    updateTypography: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.updateTypography(
          req.managerStaffId,
          req.body.reportId,
          req.body,
          req.user.id
        )
      ),
    updateGrid: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.updateGrid(
          req.managerStaffId,
          req.body.reportId,
          req.body,
          req.user.id
        )
      ),
    updatePhotoFilter: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.updatePhotoFilter(
          req.managerStaffId,
          req.body.reportId,
          req.body,
          req.user.id
        )
      ),
    updateClientDetails: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.updateClientDetails(
          req.managerStaffId,
          req.body,
          req.user.id
        ),
        'Client details updated',
      ),
    saveDraft: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.saveDraft(
          req.managerStaffId,
          req.body.reportId,
          req.body,
          req.user.id
        )
      ),
    publish: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.publish(req.managerStaffId, req.body.reportId, req.user.id)
      ),
    share: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.share(
          req.managerStaffId,
          req.body.reportId,
          req.body,
          req.user.id
        )
      ),
    generatePdf: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.generatePdf(req.managerStaffId, req.body.reportId, req.user.id),
        'PDF generated',
        201
      ),
    downloadPdf: async (req, res) => {
      const { filePath, fileName, pdfUrl, pdf } = await managerReportService.downloadPdf(
        req.managerStaffId,
        req.params.reportId,
        req.user.id
      );
      if (req.query.urlOnly === 'true') {
        return sendSuccess(res, { pdfUrl, pdf });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.status(200).send(fs.readFileSync(filePath));
    },
    deletePdf: async (req, res) =>
      sendSuccess(
        res,
        await managerReportService.deletePdf(req.managerStaffId, req.params.reportId, req.user.id)
      ),
  },
};
