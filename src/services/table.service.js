const tableRepository = require('../repositories/table.repository');
const eventRepository = require('../repositories/event.repository');
const staffRepository = require('../repositories/staff.repository');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

async function assertEventManagerForEvent(eventId, staffIdOrUuid) {
  const staffId = await resolveId('staff', staffIdOrUuid);
  const staff = await staffRepository.findById(staffId);
  if (!staff || staff.role !== 'event_manager' || !staff.is_active) {
    throw new AppError('Manager not found or inactive', 404);
  }

  const event = await eventRepository.findById(eventId);
  const allocations = await eventRepository.getManagerAllocations(eventId);
  const isAllocated =
    event?.assigned_manager_id === staffId ||
    allocations.some((manager) => manager.id === staffId);

  if (!isAllocated) {
    throw new AppError('Manager is not allocated to this event', 400);
  }

  return staffId;
}

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
    const mapped = [];
    for (const a of assignments) {
      mapped.push({
        table_number: a.tableNumber,
        allocation_type: a.allocationType || 'dining',
        staff_id: a.staffId ? await resolveId('staff', a.staffId) : null,
        user_code: a.userCode,
        description: a.description,
        event_label: a.eventLabel,
      });
    }
    await tableRepository.bulkSave(eventId, mapped);
    return tableRepository.findByEvent(eventId);
  },

  async assignSingle(eventIdOrUuid, tableNumber, data) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    await tableRepository.assignSingle(eventId, tableNumber, {
      allocation_type: data.allocationType || 'dining',
      staff_id: data.staffId ? await resolveId('staff', data.staffId) : null,
      user_code: data.userCode,
      description: data.description,
      event_label: data.eventLabel,
    });
    return tableRepository.findByEvent(eventId);
  },

  async assignTableToManager(eventIdOrUuid, tableNumber, staffIdOrUuid, allocationType = 'dining') {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    const staffId = await assertEventManagerForEvent(eventId, staffIdOrUuid);
    return tableRepository.assignTableManager(eventId, tableNumber, staffId, allocationType);
  },

  async assignTablesToManager(eventIdOrUuid, staffIdOrUuid, tableNumbers, allocationType = 'dining') {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    const staffId = await assertEventManagerForEvent(eventId, staffIdOrUuid);
    await tableRepository.assignManagerTables(eventId, staffId, tableNumbers, allocationType);
    return tableRepository.findByEvent(eventId);
  },

  async getTablesByManager(staffIdOrUuid) {
    const staffId = await resolveId('staff', staffIdOrUuid);
    return tableRepository.findByStaff(staffId);
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
