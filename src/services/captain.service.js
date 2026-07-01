const staffRepository = require('../repositories/staff.repository');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

const captainService = {
  async getById(idOrUuid) {
    const id = await resolveId('staff', idOrUuid);
    const row = await staffRepository.findById(id);
    if (!row || row.role !== 'captain') throw new AppError('Captain not found', 404);
    return staffRepository.formatStaff(row);
  },

  async create(data) {
    const id = await staffRepository.create({
      name: data.name,
      role: 'captain',
      is_active: data.isActive,
    });
    return this.getById(id);
  },

  async list(query) {
    if (query.forSelect === 'true') {
      const items = await staffRepository.findAllForExport({
        role: 'captain',
        includeInactive: query.includeInactive,
        search: query.search,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      return { items };
    }

    return staffRepository.findAll({ ...query, role: 'captain' });
  },
};

module.exports = captainService;
