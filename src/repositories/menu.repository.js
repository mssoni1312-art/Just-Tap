const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse, sanitizeSortBy } = require('../helpers/pagination');

const menuRepository = {
  async findCategories(query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('menu_categories', query.sortBy);
    const conditions = ['mc.deleted_at IS NULL'];
    const params = [];
    if (query.search) {
      conditions.push('(mc.name LIKE ? OR mc.description LIKE ?)');
      const s = `%${query.search}%`;
      params.push(s, s);
    }
    const where = conditions.join(' AND ');
    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM menu_categories mc WHERE ${where}`, params);
    const [rows] = await pool.execute(
      `SELECT mc.*, COUNT(mi.id) AS item_count
       FROM menu_categories mc
       LEFT JOIN menu_items mi ON mi.category_id = mc.id AND mi.deleted_at IS NULL
       WHERE ${where}
       GROUP BY mc.id
       ORDER BY mc.${sortBy} ${sortOrder}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    const items = rows.map((r) => ({
      id: String(r.id),
      uuid: r.uuid,
      name: r.name,
      description: r.description,
      itemCount: r.item_count,
      sortOrder: r.sort_order,
    }));
    return buildPaginatedResponse(items, countRows[0].total, page, limit);
  },

  async findCategoryById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM menu_categories WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  },

  async findCategoriesForExport(query) {
    const conditions = ['mc.deleted_at IS NULL'];
    const params = [];
    if (query.search) {
      conditions.push('(mc.name LIKE ? OR mc.description LIKE ?)');
      const s = `%${query.search}%`;
      params.push(s, s);
    }
    const [rows] = await pool.execute(
      `SELECT mc.*, COUNT(mi.id) AS item_count
       FROM menu_categories mc
       LEFT JOIN menu_items mi ON mi.category_id = mc.id AND mi.deleted_at IS NULL
       WHERE ${conditions.join(' AND ')}
       GROUP BY mc.id ORDER BY mc.sort_order`,
      params
    );
    return rows;
  },

  async bulkDeleteCategories(ids) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE menu_categories SET deleted_at = NOW() WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      ids
    );
    return result.affectedRows;
  },

  async bulkUpdateCategories(ids, data) {
    if (!ids.length || data.sort_order === undefined) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE menu_categories SET sort_order = ?, updated_at = NOW()
       WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      [data.sort_order, ...ids]
    );
    return result.affectedRows;
  },

  async createCategory(data) {
    const [result] = await pool.execute(
      'INSERT INTO menu_categories (name, description, sort_order) VALUES (?, ?, ?)',
      [data.name, data.description || null, data.sort_order || 0]
    );
    return result.insertId;
  },

  async updateCategory(id, data) {
    const fields = [];
    const values = [];
    for (const key of ['name', 'description', 'sort_order']) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return;
    values.push(id);
    await pool.execute(
      `UPDATE menu_categories SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      values
    );
  },

  async deleteCategory(id) {
    await pool.execute('UPDATE menu_categories SET deleted_at = NOW() WHERE id = ?', [id]);
  },

  async findItems(query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('menu_items', query.sortBy);
    const conditions = ['mi.deleted_at IS NULL'];
    const params = [];
    if (query.category) {
      conditions.push('mc.name = ?');
      params.push(query.category);
    }
    if (query.categoryId) {
      conditions.push('mi.category_id = ?');
      params.push(query.categoryId);
    }
    if (query.search) {
      conditions.push('mi.name LIKE ?');
      params.push(`%${query.search}%`);
    }
    const where = conditions.join(' AND ');
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM menu_items mi JOIN menu_categories mc ON mc.id = mi.category_id WHERE ${where}`,
      params
    );
    const [rows] = await pool.execute(
      `SELECT mi.*, mc.name AS category_name
       FROM menu_items mi
       JOIN menu_categories mc ON mc.id = mi.category_id
       WHERE ${where}
       ORDER BY mi.${sortBy} ${sortOrder}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    const items = rows.map((r) => ({
      id: String(r.id),
      uuid: r.uuid,
      name: r.name,
      category: r.category_name,
      categoryId: r.category_id,
      price: String(r.price),
      isVeg: Boolean(r.is_veg),
      imageUrl: r.image_url,
      isBestSeller: Boolean(r.is_best_seller),
      description: r.description,
    }));
    return buildPaginatedResponse(items, countRows[0].total, page, limit);
  },

  async findItemById(id) {
    const [rows] = await pool.execute(
      `SELECT mi.*, mc.name AS category_name
       FROM menu_items mi
       JOIN menu_categories mc ON mc.id = mi.category_id
       WHERE mi.id = ? AND mi.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  async findItemsForExport(query) {
    const conditions = ['mi.deleted_at IS NULL'];
    const params = [];
    if (query.category) {
      conditions.push('mc.name = ?');
      params.push(query.category);
    }
    if (query.search) {
      conditions.push('mi.name LIKE ?');
      params.push(`%${query.search}%`);
    }
    const [rows] = await pool.execute(
      `SELECT mi.*, mc.name AS category_name
       FROM menu_items mi
       JOIN menu_categories mc ON mc.id = mi.category_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY mi.name`,
      params
    );
    return rows;
  },

  async bulkUpdateItems(ids, data) {
    if (!ids.length) return 0;
    const fields = [];
    const values = [];
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }
    if (data.category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(data.category_id);
    }
    if (!fields.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE menu_items SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      [...values, ...ids]
    );
    return result.affectedRows;
  },

  async createItem(data) {
    const [result] = await pool.execute(
      `INSERT INTO menu_items (category_id, name, description, price, is_veg, image_url, is_best_seller, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.category_id,
        data.name,
        data.description || null,
        data.price,
        data.is_veg !== false ? 1 : 0,
        data.image_url || null,
        data.is_best_seller ? 1 : 0,
        data.is_active !== false ? 1 : 0,
      ]
    );
    return result.insertId;
  },

  async updateItem(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['category_id', 'name', 'description', 'price', 'is_veg', 'image_url', 'is_best_seller', 'is_active'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(['is_veg', 'is_best_seller', 'is_active'].includes(key) ? (data[key] ? 1 : 0) : data[key]);
      }
    }
    if (!fields.length) return;
    values.push(id);
    await pool.execute(
      `UPDATE menu_items SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      values
    );
  },

  async deleteItem(id) {
    await pool.execute('UPDATE menu_items SET deleted_at = NOW() WHERE id = ?', [id]);
  },

  async bulkDeleteItems(ids) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE menu_items SET deleted_at = NOW() WHERE id IN (${placeholders})`,
      ids
    );
    return result.affectedRows;
  },

  async findPackages() {
    const [rows] = await pool.execute(
      "SELECT id, name, slug, type FROM menu_packages WHERE deleted_at IS NULL ORDER BY id"
    );
    return rows;
  },

  async findCourses() {
    const [rows] = await pool.execute(
      `SELECT mi.id, mi.name, mc.name AS category
       FROM menu_items mi
       JOIN menu_categories mc ON mc.id = mi.category_id
       WHERE mi.deleted_at IS NULL AND mi.is_active = 1
       ORDER BY mc.sort_order, mi.name`
    );
    return rows.map((r) => ({ id: String(r.id), name: r.name, category: r.category }));
  },

  async getPlanningItems(eventId, categoryFilter) {
    const conditions = ['mi.deleted_at IS NULL', 'mi.is_active = 1'];
    const params = [eventId];
    if (categoryFilter && categoryFilter !== 'All') {
      conditions.push('mc.name = ?');
      params.push(categoryFilter);
    }
    const [available] = await pool.execute(
      `SELECT mi.id, mi.name, mc.id AS category_id, mc.name AS category, mi.image_url,
              CASE WHEN ems.id IS NOT NULL AND ems.deleted_at IS NULL THEN 1 ELSE 0 END AS is_selected
       FROM menu_items mi
       JOIN menu_categories mc ON mc.id = mi.category_id
       LEFT JOIN event_menu_selections ems ON ems.menu_item_id = mi.id AND ems.event_id = ?
       WHERE ${conditions.join(' AND ')}
       ORDER BY mc.sort_order, mi.name`,
      params
    );
    const [categories] = await pool.execute(
      `SELECT mc.id, mc.name AS label, COUNT(mi.id) AS count
       FROM menu_categories mc
       LEFT JOIN menu_items mi ON mi.category_id = mc.id AND mi.deleted_at IS NULL
       WHERE mc.deleted_at IS NULL
       GROUP BY mc.id ORDER BY mc.sort_order`
    );
    return {
      categories: [{ id: 'all', label: 'All', count: available.length }, ...categories.map((c) => ({
        id: String(c.id),
        label: c.label,
        count: c.count,
      }))],
      items: available.map((i) => ({
        id: String(i.id),
        name: i.name,
        categoryId: String(i.category_id),
        category: i.category,
        imageUrl: i.image_url,
        isSelected: Boolean(i.is_selected),
      })),
    };
  },
};

module.exports = menuRepository;
