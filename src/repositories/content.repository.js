const pool = require('../config/database');

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
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'];
    const [rows] = await pool.execute(
      `SELECT QUARTER(created_at) AS q, COUNT(*) AS value
       FROM order_line_items
       WHERE deleted_at IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
       GROUP BY QUARTER(created_at)
       ORDER BY q`
    );
    const dataMap = Object.fromEntries(rows.map((r) => [`Q${r.q}`, r.value]));
    const chartData = quarters.map((label) => ({
      label,
      value: dataMap[label] || 0,
    }));
    const sorted = [...chartData].sort((a, b) => b.value - a.value);
    return {
      chartData,
      highestServed: sorted[0],
      lowestServed: sorted[sorted.length - 1],
    };
  },
};

module.exports = { contentRepository, uploadRepository, analyticsRepository };
