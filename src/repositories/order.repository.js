const pool = require('../config/database');

const orderRepository = {
  async getSummary(eventId) {
    const [rows] = await pool.execute(
      `SELECT eo.*, s.name AS manager_name
       FROM event_orders eo
       LEFT JOIN staff s ON s.id = eo.manager_id
       WHERE eo.event_id = ? AND eo.deleted_at IS NULL
       ORDER BY eo.id DESC LIMIT 1`,
      [eventId]
    );
    const order = rows[0];
    if (!order) {
      return { functionName: null, managerName: null, totalOrder: 0, totalDelivered: 0 };
    }
    return {
      functionName: order.function_name,
      managerName: order.manager_name,
      totalOrder: order.total_items,
      totalDelivered: order.delivered_count,
    };
  },

  async getTables(eventId) {
    const [rows] = await pool.execute(
      `SELECT ot.table_number, ot.waiter_name, ot.is_active
       FROM order_tables ot
       JOIN event_orders eo ON eo.id = ot.event_order_id
       WHERE eo.event_id = ? AND ot.deleted_at IS NULL AND eo.deleted_at IS NULL
       ORDER BY ot.table_number`,
      [eventId]
    );
    return rows.map((r) => ({
      tableNumber: r.table_number,
      waiterName: r.waiter_name,
      isActive: Boolean(r.is_active),
    }));
  },

  async getTableOrder(eventId, tableNumber, categoryFilter) {
    const conditions = ['eo.event_id = ?', 'ot.table_number = ?', 'oli.deleted_at IS NULL'];
    const params = [eventId, tableNumber];
    if (categoryFilter && categoryFilter !== 'All') {
      conditions.push('oli.category = ?');
      params.push(categoryFilter);
    }
    const [rows] = await pool.execute(
      `SELECT oli.*, mi.name AS item_name, mi.image_url, ot.waiter_name, ot.table_number,
              (SELECT COUNT(*) FROM order_line_items x WHERE x.order_table_id = ot.id AND x.deleted_at IS NULL) AS total_items,
              (SELECT COUNT(*) FROM order_line_items x WHERE x.order_table_id = ot.id AND x.status = 'delivered' AND x.deleted_at IS NULL) AS delivered_count
       FROM order_line_items oli
       JOIN order_tables ot ON ot.id = oli.order_table_id
       JOIN event_orders eo ON eo.id = ot.event_order_id
       LEFT JOIN menu_items mi ON mi.id = oli.menu_item_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY oli.category, oli.created_at`,
      params
    );
    if (!rows.length) return { tableNumber, items: [], totalItems: 0, deliveredCount: 0 };
    return {
      tableNumber: rows[0].table_number,
      waiterName: rows[0].waiter_name,
      totalItems: rows[0].total_items,
      deliveredCount: rows[0].delivered_count,
      items: rows.map((r) => ({
        id: String(r.id),
        name: r.item_name || r.order_ref,
        orderRef: r.order_ref,
        time: r.created_at,
        quantity: r.quantity,
        category: r.category,
        imageUrl: r.image_url,
        status: r.status.toUpperCase(),
      })),
    };
  },

  async getLineItemDetail(lineItemId) {
    const [rows] = await pool.execute(
      `SELECT oli.*, mi.name, mi.description, mi.image_url, mi.is_best_seller
       FROM order_line_items oli
       LEFT JOIN menu_items mi ON mi.id = oli.menu_item_id
       WHERE oli.id = ? AND oli.deleted_at IS NULL`,
      [lineItemId]
    );
    const item = rows[0];
    if (!item) return null;

    const [batches] = await pool.execute(
      `SELECT * FROM order_item_batches WHERE order_line_item_id = ? ORDER BY batch_number`,
      [lineItemId]
    );

    const [totals] = await pool.execute(
      `SELECT SUM(quantity) AS total_ordered,
              SUM(CASE WHEN status = 'in_process' THEN quantity ELSE 0 END) AS in_process
       FROM order_line_items WHERE menu_item_id = ? AND deleted_at IS NULL`,
      [item.menu_item_id]
    );

    return {
      id: String(item.id),
      name: item.name || item.order_ref,
      description: item.description,
      imageUrl: item.image_url,
      isBestSeller: Boolean(item.is_best_seller),
      totalOrdered: totals[0]?.total_ordered || item.quantity,
      inProcessCount: totals[0]?.in_process || 0,
      history: batches.map((b) => ({
        batchNumber: b.batch_number,
        itemCount: b.item_count,
        time: b.created_at,
        status: b.status.toUpperCase(),
        isActive: Boolean(b.is_active),
      })),
    };
  },

  async getReport(eventId) {
    const summary = await this.getSummary(eventId);
    const tables = await this.getTables(eventId);
    const tableDetails = [];
    for (const t of tables) {
      tableDetails.push(await this.getTableOrder(eventId, t.tableNumber));
    }
    return { summary, tables, tableDetails };
  },
};

module.exports = orderRepository;
