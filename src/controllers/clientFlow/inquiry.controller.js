const { sendSuccess } = require('../../helpers/response');
const inquiryService = require('../../services/inquiry.service');

module.exports = {
  create: async (req, res) =>
    sendSuccess(
      res,
      await inquiryService.createClientInquiry(req.body),
      'Inquiry submitted successfully',
      201
    ),
};
