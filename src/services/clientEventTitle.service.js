const clientEventTitleRepository = require('../repositories/clientEventTitle.repository');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

const clientEventTitleService = {
  async list(query = {}) {
    const items = await clientEventTitleRepository.listAll(query);
    if (query.forSelect === 'true') {
      return { items };
    }
    return items;
  },

  async create(data, userId) {
    const name = data.name?.trim();
    if (!name) throw new AppError('Name is required', 400);

    const existing = await clientEventTitleRepository.findByName(name);
    if (existing) throw new AppError('Our event title already exists', 409);

    return clientEventTitleRepository.create({
      name,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      createdBy: userId,
    });
  },

  async remove(idOrUuid) {
    const id = await resolveId('client_event_titles', idOrUuid);
    const row = await clientEventTitleRepository.findById(id);
    if (!row) throw new AppError('Our event title not found', 404);

    await clientEventTitleRepository.softDelete(id);
    return { deleted: true };
  },
};

module.exports = clientEventTitleService;
