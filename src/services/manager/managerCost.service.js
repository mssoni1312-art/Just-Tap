const managerCostService = require('../managerCost.service');
const { assertManagerOwnsEvent } = require('../../helpers/managerScope');
const { resolveId } = require('../../helpers/idResolver');

const managerManagerCostService = {
  async get(staffId, eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return managerCostService.get(eventIdOrUuid);
  },

  async save(staffId, eventIdOrUuid, data, userId) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return managerCostService.save(eventIdOrUuid, data, userId);
  },
};

module.exports = managerManagerCostService;
