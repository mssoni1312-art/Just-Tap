const staffRepository = require('../repositories/staff.repository');

const managerService = {
  async list(query) {
    return staffRepository.findAll({ ...query, role: 'event_manager' });
  },
};

module.exports = managerService;
