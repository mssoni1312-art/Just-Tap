const staffRepository = require('../repositories/staff.repository');

const managerService = {
  async list(query) {
    if (query.forSelect === 'true') {
      const items = await staffRepository.findAllForExport({
        role: 'event_manager',
        includeInactive: query.includeInactive,
        search: query.search,
        sortBy: 'name',
        sortOrder: 'asc',
      });
      return { items };
    }

    return staffRepository.findAll({ ...query, role: 'event_manager' });
  },
};

module.exports = managerService;
