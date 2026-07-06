const clientRepository = require('../repositories/client.repository');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

const clientService = {
  async list(query) {
    if (query.forSelect === 'true') {
      const items = await clientRepository.findAllForSelect(query);
      return { items };
    }
    return clientRepository.findAll(query);
  },

  async getById(idOrUuid) {
    const id = await resolveId('clients', idOrUuid);
    const client = await clientRepository.findById(id);
    if (!client) throw new AppError('Client not found', 404);
    return clientRepository.formatClient(client);
  },

  async create(data) {
    const name = data.name?.trim();
    const id = await clientRepository.create({
      name,
      caterer_name: data.catererName?.trim() || name,
      client_address: data.clientAddress?.trim() || null,
      city_name: data.cityName?.trim() || '',
      contact_no: data.contactNo?.trim() || null,
      reference: data.reference?.trim() ?? '',
      is_high_priority: data.isHighPriority,
    });
    return this.getById(id);
  },
};

module.exports = clientService;
