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

  async create(data) {
    const name = (data.name || data.memberName).trim();
    const id = await staffRepository.create({
      name,
      role: 'event_manager',
      designation: data.designation?.trim() || null,
      is_active: data.isActive,
    });
    const row = await staffRepository.findById(id);
    return staffRepository.formatStaff(row);
  },
};

module.exports = managerService;
