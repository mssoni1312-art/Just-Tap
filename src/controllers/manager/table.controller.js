const { sendSuccess } = require('../../helpers/response');
const managerTableService = require('../../services/manager/table.service');

module.exports = {
  listByEvent: async (req, res) =>
    sendSuccess(
      res,
      await managerTableService.getTables(req.managerStaffId, req.params.eventId),
    ),

  bulkSave: async (req, res) =>
    sendSuccess(
      res,
      await managerTableService.bulkSave(
        req.managerStaffId,
        req.params.eventId,
        req.body.assignments,
      ),
    ),

  assign: async (req, res) =>
    sendSuccess(
      res,
      await managerTableService.assignSingle(
        req.managerStaffId,
        req.params.eventId,
        Number(req.params.tableNumber),
        req.body,
      ),
    ),

  assignTableManager: async (req, res) =>
    sendSuccess(
      res,
      await managerTableService.assignTableToManager(
        req.managerStaffId,
        req.params.eventId,
        Number(req.params.tableNumber),
        req.body.staffId,
        req.body.allocationType,
      ),
      'Manager assigned to table',
    ),

  assignManager: async (req, res) =>
    sendSuccess(
      res,
      await managerTableService.assignTablesToManager(
        req.managerStaffId,
        req.params.eventId,
        req.body.staffId,
        req.body.tableNumbers,
        req.body.allocationType,
      ),
      'Tables assigned to manager',
    ),

  allocate: async (req, res) =>
    sendSuccess(
      res,
      await managerTableService.saveAllocation(req.managerStaffId, req.params.eventId, req.body),
    ),
};
