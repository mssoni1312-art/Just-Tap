const tableService = require('../table.service');
const { assertManagerOwnsEvent } = require('../../helpers/managerScope');
const { resolveId } = require('../../helpers/idResolver');

async function withEventScope(staffId, eventIdOrUuid, fn) {
  const eventId = await resolveId('events', eventIdOrUuid);
  await assertManagerOwnsEvent(staffId, eventId);
  return fn(eventIdOrUuid);
}

const managerTableService = {
  getTables: (staffId, eventIdOrUuid) =>
    withEventScope(staffId, eventIdOrUuid, (id) => tableService.getTables(id)),

  bulkSave: (staffId, eventIdOrUuid, assignments) =>
    withEventScope(staffId, eventIdOrUuid, (id) => tableService.bulkSave(id, assignments)),

  assignSingle: (staffId, eventIdOrUuid, tableNumber, data) =>
    withEventScope(staffId, eventIdOrUuid, (id) => tableService.assignSingle(id, tableNumber, data)),

  assignTableToManager: (staffId, eventIdOrUuid, tableNumber, managerStaffId, allocationType) =>
    withEventScope(staffId, eventIdOrUuid, (id) =>
      tableService.assignTableToManager(id, tableNumber, managerStaffId, allocationType),
    ),

  assignTablesToManager: (staffId, eventIdOrUuid, managerStaffId, tableNumbers, allocationType) =>
    withEventScope(staffId, eventIdOrUuid, (id) =>
      tableService.assignTablesToManager(id, managerStaffId, tableNumbers, allocationType),
    ),

  saveAllocation: (staffId, eventIdOrUuid, data) =>
    withEventScope(staffId, eventIdOrUuid, (id) => tableService.saveAllocation(id, data)),
};

module.exports = managerTableService;
