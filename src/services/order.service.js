const orderRepository = require('../repositories/order.repository');
const eventRepository = require('../repositories/event.repository');
const { resolveId } = require('../helpers/idResolver');
const AppError = require('../utils/AppError');

const orderService = {
  async getSummary(eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    return orderRepository.getSummary(eventId);
  },

  async getTables(eventIdOrUuid) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    return orderRepository.getTables(eventId);
  },

  async getTableOrder(eventIdOrUuid, tableNumber, category) {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    return orderRepository.getTableOrder(eventId, tableNumber, category);
  },

  async getLineItemDetail(lineItemIdOrUuid) {
    const lineItemId = await resolveId('order_line_items', lineItemIdOrUuid);
    const item = await orderRepository.getLineItemDetail(lineItemId);
    if (!item) throw new AppError('Order item not found', 404);
    return item;
  },

  async getReport(eventIdOrUuid, format = 'json') {
    const eventId = await resolveId('events', eventIdOrUuid);
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError('Event not found', 404);
    const report = await orderRepository.getReport(eventId);
    if (format === 'csv') {
      const lines = ['Table,Item,Quantity,Status'];
      for (const table of report.tableDetails) {
        for (const item of table.items || []) {
          lines.push(`${table.tableNumber},${item.name},${item.quantity},${item.status}`);
        }
      }
      return { format: 'csv', content: lines.join('\n') };
    }
    return report;
  },
};

module.exports = orderService;
