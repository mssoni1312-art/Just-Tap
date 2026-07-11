const { sendSuccess } = require('../../helpers/response');
const clientInquiryService = require('../../services/client/inquiry.service');

module.exports = {
  create: async (req, res) =>
    sendSuccess(
      res,
      await clientInquiryService.create(req.clientProfile, req.body),
      'Inquiry submitted successfully',
      201
    ),

  list: async (req, res) =>
    sendSuccess(res, await clientInquiryService.list(req.clientProfile, req.query)),
};
