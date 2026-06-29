const tableRepository = require('../repositories/table.repository');
const eventRepository = require('../repositories/event.repository');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

const tableService = {
  async getTables(eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    return tableRepository.findByEvent(eventId);
  },

  async bulkSave(eventIdOrUuid, assignments) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    await tableRepository.bulkSave(eventId, assignments.map((a) => ({
      table_number: a.tableNumber,
      allocation_type: a.allocationType || 'dining',
      user_code: a.userCode,
      description: a.description,
      event_label: a.eventLabel,
    })));
    return tableRepository.findByEvent(eventId);
  },

  async assignSingle(eventIdOrUuid, tableNumber, data) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    await tableRepository.assignSingle(eventId, tableNumber, {
      allocation_type: data.allocationType || 'dining',
      user_code: data.userCode,
      description: data.description,
      event_label: data.eventLabel,
    });
    return tableRepository.findByEvent(eventId);
  },

  async saveAllocation(eventIdOrUuid, data) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    await tableRepository.saveAllocation(eventId, data.diningTables, data.captainTables);
    return tableRepository.findByEvent(eventId);
  },
};

module.exports = tableService;
