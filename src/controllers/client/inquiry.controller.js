const { sendSuccess } = require('../../helpers/response');
const clientInquiryService = require('../../services/client/inquiry.service');

module.exports = {
  list: async (req, res) => {
    const result = await clientInquiryService.list(req.clientProfile, req.query);
    sendSuccess(res, result);
  },
  create: async (req, res) => {
    const result = await clientInquiryService.create(req.clientProfile, req.body);
    sendSuccess(res, result, 'Inquiry submitted successfully', 201);
  },
};
