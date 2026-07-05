const { sendSuccess } = require('../../helpers/response');
const managerOrderService = require('../../services/manager/order.service');

module.exports = {
  summary: async (req, res) =>
    sendSuccess(
      res,
      await managerOrderService.getSummary(req.managerStaffId, req.params.eventId)
    ),
  tables: async (req, res) =>
    sendSuccess(
      res,
      await managerOrderService.getTables(req.managerStaffId, req.params.eventId)
    ),
  tableDetail: async (req, res) =>
    sendSuccess(
      res,
      await managerOrderService.getTableOrder(
        req.managerStaffId,
        req.params.eventId,
        req.params.tableNumber,
        req.query.category
      )
    ),
  report: async (req, res) => {
    const report = await managerOrderService.getReport(
      req.managerStaffId,
      req.params.eventId,
      req.query.format
    );
    if (report.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="order-report-${req.params.eventId}.csv"`
      );
      return res.status(200).send(report.content);
    }
    return sendSuccess(res, report);
  },
  lineItem: async (req, res) =>
    sendSuccess(
      res,
      await managerOrderService.getLineItemDetail(
        req.managerStaffId,
        req.params.lineItemId
      )
    ),
};
