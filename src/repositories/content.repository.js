const pool = require('../config/database');
const { MANAGER_EVENT_SCOPE_SQL, managerScopeParams } = require('../helpers/managerScope');

const contentRepository = {
  async getPage(key) {
    const [rows] = await pool.execute(
      'SELECT content FROM content_pages WHERE page_key = ?',
      [key]
    );
    if (!rows[0]) return null;
    return typeof rows[0].content === 'string' ? JSON.parse(rows[0].content) : rows[0].content;
  },
};

const uploadRepository = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO uploads (user_id, original_name, stored_name, mime_type, size_bytes, upload_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.user_id, data.original_name, data.stored_name, data.mime_type, data.size_bytes, data.upload_type]
    );
    return result.insertId;
  },
};

const analyticsRepository = {
  async getMenuReport({ search, category } = {}) {
    const itemConditions = ['mi.deleted_at IS NULL', 'mi.is_active = 1', 'mc.deleted_at IS NULL'];
    const params = [];

    if (search) {
      itemConditions.push('(mi.name LIKE ? OR mc.name LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term);
    }

    if (category && category !== 'All') {
      itemConditions.push('mc.name = ?');
      params.push(category);
    }

    const where = itemConditions.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT
         mi.id,
         mi.uuid,
         mi.name,
         mc.name AS category,
         COALESCE(SUM(
           CASE
             WHEN oli.deleted_at IS NULL
               AND oli.status = 'delivered'
               AND oli.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
             THEN oli.quantity
             ELSE 0
           END
         ), 0) AS served_count
       FROM menu_items mi
       JOIN menu_categories mc ON mc.id = mi.category_id
       LEFT JOIN order_line_items oli ON oli.menu_item_id = mi.id
       WHERE ${where}
       GROUP BY mi.id, mi.uuid, mi.name, mc.name
       ORDER BY served_count DESC, mi.name ASC`,
      params
    );

    const items = rows.map((row) => ({
      id: String(row.id),
      uuid: row.uuid,
      name: row.name,
      category: row.category,
      servedCount: Number(row.served_count) || 0,
      badge: null,
    }));

    const servedCounts = items.map((item) => item.servedCount);
    const maxServed = servedCounts.length ? Math.max(...servedCounts) : 0;
    const positiveCounts = servedCounts.filter((count) => count > 0);
    const minServed = positiveCounts.length ? Math.min(...positiveCounts) : 0;

    if (maxServed > 0) {
      const highest = items.find((item) => item.servedCount === maxServed);
      if (highest) highest.badge = 'highest';
    }

    if (minServed > 0 && minServed < maxServed) {
      const slowest = [...items]
        .reverse()
        .find((item) => item.servedCount === minServed && item.badge !== 'highest');
      if (slowest) slowest.badge = 'slowest';
    }

    const totalItems = items.length;
    const totalServed = servedCounts.reduce((sum, count) => sum + count, 0);
    const avgServed = totalItems > 0 ? Math.round(totalServed / totalItems) : 0;

    const [categoryRows] = await pool.execute(
      `SELECT mc.name
       FROM menu_categories mc
       WHERE mc.deleted_at IS NULL
         AND EXISTS (
           SELECT 1
           FROM menu_items mi
           WHERE mi.category_id = mc.id
             AND mi.deleted_at IS NULL
             AND mi.is_active = 1
         )
       ORDER BY mc.sort_order, mc.name`
    );

    return {
      totalItems,
      avgServed,
      periodLabel: 'Last 24h',
      categories: ['All', ...categoryRows.map((row) => row.name)],
      items,
    };
  },

  async getSalesChart() {
    const [rows] = await pool.execute(
      `SELECT
         mi.name AS name,
         COALESCE(SUM(
           CASE
             WHEN oli.deleted_at IS NULL
               AND oli.status = 'delivered'
               AND oli.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
             THEN oli.quantity
             ELSE 0
           END
         ), 0) AS value
       FROM menu_items mi
       LEFT JOIN order_line_items oli ON oli.menu_item_id = mi.id
       WHERE mi.deleted_at IS NULL AND mi.is_active = 1
       GROUP BY mi.id, mi.name
       ORDER BY value DESC, mi.name ASC
       LIMIT 7`
    );

    const chartData = rows.map((row) => ({
      label: row.name,
      name: row.name,
      value: Number(row.value) || 0,
    }));

    const withPositive = chartData.filter((point) => point.value > 0);
    const highestServed = withPositive.length
      ? [...withPositive].sort((a, b) => b.value - a.value)[0]
      : null;

    let lowestServed = null;
    if (withPositive.length > 1) {
      lowestServed = [...withPositive].sort((a, b) => a.value - b.value)[0];
    }

    return {
      chartData,
      highestServed,
      lowestServed,
    };
  },

  async getPackageRevenue(staffId = null) {
    const eventConditions = ['e.deleted_at IS NULL', 'e.package_id IS NOT NULL'];
    const params = [];

    if (staffId) {
      eventConditions.push(MANAGER_EVENT_SCOPE_SQL);
      params.push(...managerScopeParams(staffId));
    }

    const eventJoinOn = eventConditions.join(' AND ');

    const [rows] = await pool.execute(
      `SELECT
         mp.id,
         mp.uuid,
         mp.name,
         mp.slug,
         mp.price,
         COUNT(DISTINCT e.id) AS event_count,
         COALESCE(SUM(eb.grand_total), 0) AS total_revenue,
         COALESCE(SUM(paid.total_paid), 0) AS collected_revenue
       FROM menu_packages mp
       LEFT JOIN events e ON e.package_id = mp.id AND ${eventJoinOn}
       LEFT JOIN event_billing eb ON eb.event_id = e.id AND eb.deleted_at IS NULL
       LEFT JOIN (
         SELECT billing_id, SUM(amount) AS total_paid
         FROM event_billing_payments
         WHERE deleted_at IS NULL
         GROUP BY billing_id
       ) paid ON paid.billing_id = eb.id
       WHERE mp.deleted_at IS NULL
       GROUP BY mp.id, mp.uuid, mp.name, mp.slug, mp.price, mp.sort_order
       ORDER BY mp.sort_order, mp.id`,
      params,
    );

    const packages = rows.map((row) => ({
      id: String(row.id),
      uuid: row.uuid,
      name: row.name,
      slug: row.slug,
      price: row.price != null ? Number(row.price) : null,
      eventCount: Number(row.event_count) || 0,
      totalRevenue: Number(row.total_revenue) || 0,
      collectedRevenue: Number(row.collected_revenue) || 0,
    }));

    return {
      packages,
      totalRevenue: packages.reduce((sum, pkg) => sum + pkg.totalRevenue, 0),
      totalCollected: packages.reduce((sum, pkg) => sum + pkg.collectedRevenue, 0),
      totalEvents: packages.reduce((sum, pkg) => sum + pkg.eventCount, 0),
    };
  },
};

module.exports = { contentRepository, uploadRepository, analyticsRepository };
