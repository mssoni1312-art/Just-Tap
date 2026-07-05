const pool = require('../../config/database');
const orderService = require('../order.service');
const { assertManagerOwnsEvent } = require('../../helpers/managerScope');
const { resolveId } = require('../../helpers/idResolver');
const AppError = require('../../utils/AppError');

const managerOrderService = {
  async getSummary(staffId, eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return orderService.getSummary(eventIdOrUuid);
  },

  async getTables(staffId, eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return orderService.getTables(eventIdOrUuid);
  },

  async getTableOrder(staffId, eventIdOrUuid, tableNumber, category) {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return orderService.getTableOrder(eventIdOrUuid, tableNumber, category);
  },

  async getReport(staffId, eventIdOrUuid, format = 'json') {
    const eventId = await resolveId('events', eventIdOrUuid);
    await assertManagerOwnsEvent(staffId, eventId);
    return orderService.getReport(eventIdOrUuid, format);
  },

  async getLineItemDetail(staffId, lineItemIdOrUuid) {
    const lineItemId = await resolveId('order_line_items', lineItemIdOrUuid);
    const [rows] = await pool.execute(
      `SELECT eo.event_id
       FROM order_line_items oli
       JOIN order_tables ot ON ot.id = oli.order_table_id
       JOIN event_orders eo ON eo.id = ot.event_order_id
       WHERE oli.id = ? AND oli.deleted_at IS NULL`,
      [lineItemId]
    );
    const eventId = rows[0]?.event_id;
    if (!eventId) throw new AppError('Order item not found', 404);
    await assertManagerOwnsEvent(staffId, eventId);
    return orderService.getLineItemDetail(lineItemIdOrUuid);
  },
};

module.exports = managerOrderService;
