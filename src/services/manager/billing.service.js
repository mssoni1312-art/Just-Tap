const billingService = require('../billing.service');
const { assertManagerOwnsEvent } = require('../../helpers/managerScope');
const { resolveId } = require('../../helpers/idResolver');

const managerBillingService = {
  async get(staffId, eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return billingService.get(eventIdOrUuid);
  },

  async savePreview(staffId, eventIdOrUuid, data, userId) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return billingService.savePreview(eventIdOrUuid, data, userId);
  },
};

module.exports = managerBillingService;
