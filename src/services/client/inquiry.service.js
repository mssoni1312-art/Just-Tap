const inquiryRepository = require('../../repositories/inquiry.repository');
const inquiryService = require('../inquiry.service');

const clientInquiryService = {
  async list(client, query) {
    return inquiryRepository.findAllForClient(client.id, query);
  },

  async create(client, data) {
    const result = await inquiryService.createClientInquiry(data, client.id);
    return {
      ...result,
      clientId: client.id,
    };
  },
};

module.exports = clientInquiryService;
