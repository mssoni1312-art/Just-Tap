const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse, sanitizeSortBy } = require('../helpers/pagination');

const formatTemplate = (row) => ({
  id: row.id,
  uuid: row.uuid,
  name: row.name,
  description: row.description,
  category: row.category,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const formatEventTask = (row) => ({
  id: row.id,
  uuid: row.uuid,
  eventId: row.event_id,
  taskTemplateId: row.task_template_id,
  title: row.title,
  description: row.description,
  status: row.status,
  assignedTo: row.assigned_to,
  assigneeName: row.assignee_name || null,
  dueDate: row.due_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const formatTaskAssignment = (row) => ({
  ...formatEventTask(row),
  eventUuid: row.event_uuid || null,
  eventClientName: row.event_client_name || null,
  eventVenue: row.event_venue || null,
});

const taskRepository = {
  async getSummary() {
    const [rows] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN due_date = CURDATE() AND status NOT IN ('completed') THEN 1 ELSE 0 END) AS today,
         SUM(CASE WHEN status = 'overdue' OR (due_date < CURDATE() AND status NOT IN ('completed')) THEN 1 ELSE 0 END) AS overdue,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS complete
       FROM event_tasks WHERE deleted_at IS NULL`
    );
    return {
      total: Number(rows[0].total) || 0,
      today: Number(rows[0].today) || 0,
      overdue: Number(rows[0].overdue) || 0,
      complete: Number(rows[0].complete) || 0,
    };
  },

  async findTemplates(query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('task_templates', query.sortBy);
    const conditions = ['deleted_at IS NULL'];
    const params = [];
    if (query.category) {
      conditions.push('category = ?');
      params.push(query.category);
    }
    if (query.search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      const s = `%${query.search}%`;
      params.push(s, s);
    }
    if (query.isActive !== undefined) {
      conditions.push('is_active = ?');
      params.push(query.isActive ? 1 : 0);
    } else {
      conditions.push('is_active = 1');
    }
    const where = conditions.join(' AND ');
    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM task_templates WHERE ${where}`, params);
    const [rows] = await pool.execute(
      `SELECT * FROM task_templates WHERE ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return buildPaginatedResponse(rows.map(formatTemplate), countRows[0].total, page, limit);
  },

  async findTemplatesForExport(query) {
    const conditions = ['deleted_at IS NULL'];
    const params = [];
    if (query.category) {
      conditions.push('category = ?');
      params.push(query.category);
    }
    const [rows] = await pool.execute(
      `SELECT * FROM task_templates WHERE ${conditions.join(' AND ')} ORDER BY name`,
      params
    );
    return rows.map(formatTemplate);
  },

  async findTemplateById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM task_templates WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  },

  async createTemplate(data) {
    const [result] = await pool.execute(
      'INSERT INTO task_templates (name, description, category, is_active) VALUES (?, ?, ?, 1)',
      [data.name, data.description || null, data.category || null]
    );
    return result.insertId;
  },

  async updateTemplate(id, data) {
    const fields = [];
    const values = [];
    for (const key of ['name', 'description', 'category', 'is_active']) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'is_active' ? (data[key] ? 1 : 0) : data[key]);
      }
    }
    if (!fields.length) return;
    values.push(id);
    await pool.execute(
      `UPDATE task_templates SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      values
    );
  },

  async softDeleteTemplate(id) {
    await pool.execute('UPDATE task_templates SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [id]);
  },

  async bulkDeleteTemplates(ids) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE task_templates SET deleted_at = NOW() WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      ids
    );
    return result.affectedRows;
  },

  async findByEvent(eventId, query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('event_tasks', query.sortBy);
    const conditions = ['et.deleted_at IS NULL', 'et.event_id = ?'];
    const params = [eventId];
    if (query.status) {
      conditions.push('et.status = ?');
      params.push(query.status);
    }
    const where = conditions.join(' AND ');
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM event_tasks et WHERE ${where}`,
      params
    );
    const [rows] = await pool.execute(
      `SELECT et.*, s.name AS assignee_name
       FROM event_tasks et
       LEFT JOIN staff s ON s.id = et.assigned_to
       WHERE ${where}
       ORDER BY et.${sortBy} ${sortOrder}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return buildPaginatedResponse(rows.map(formatEventTask), countRows[0].total, page, limit);
  },

  async assignToEvent(eventId, tasks, assignedTo, options = {}) {
    const { teamType = null, parentTaskTemplateId = null } = options;
    const created = [];
    for (const task of tasks) {
      const [result] = await pool.execute(
        `INSERT INTO event_tasks (
           event_id, task_template_id, title, description, status, assigned_to, due_date,
           team_type, parent_task_template_id
         )
         VALUES (?, ?, ?, ?, 'assigned', ?, ?, ?, ?)`,
        [
          eventId,
          task.task_template_id || null,
          task.title,
          task.description || null,
          assignedTo || null,
          task.due_date || null,
          teamType,
          parentTaskTemplateId,
        ]
      );
      created.push(result.insertId);
    }
    return created;
  },

  async findEventTaskById(id) {
    const [rows] = await pool.execute(
      `SELECT et.*, s.name AS assignee_name
       FROM event_tasks et
       LEFT JOIN staff s ON s.id = et.assigned_to
       WHERE et.id = ? AND et.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  async updateEventTask(id, data) {
    const fields = [];
    const values = [];
    const map = {
      title: 'title',
      description: 'description',
      status: 'status',
      assigned_to: 'assignedTo',
      due_date: 'dueDate',
    };
    for (const [col, key] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return;
    values.push(id);
    await pool.execute(
      `UPDATE event_tasks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      values
    );
  },

  async completeEventTask(id) {
    await pool.execute(
      `UPDATE event_tasks SET status = 'completed', updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
  },

  async softDeleteEventTask(id) {
    await pool.execute(
      'UPDATE event_tasks SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  },

  async findAllAssignments(query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('event_tasks', query.sortBy);
    const conditions = ['et.deleted_at IS NULL', 'e.deleted_at IS NULL'];
    const params = [];

    if (query.status) {
      conditions.push('et.status = ?');
      params.push(query.status);
    }
    if (query.eventId) {
      conditions.push('et.event_id = ?');
      params.push(query.eventId);
    }
    if (query.assignedTo) {
      conditions.push('et.assigned_to = ?');
      params.push(query.assignedTo);
    }
    if (query.unassigned === 'true') {
      conditions.push('et.assigned_to IS NULL');
    }
    if (query.search) {
      conditions.push('(et.title LIKE ? OR et.description LIKE ? OR s.name LIKE ?)');
      const s = `%${query.search}%`;
      params.push(s, s, s);
    }

    const where = conditions.join(' AND ');
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM event_tasks et
       JOIN events e ON e.id = et.event_id
       LEFT JOIN staff s ON s.id = et.assigned_to AND s.deleted_at IS NULL
       WHERE ${where}`,
      params
    );
    const [rows] = await pool.execute(
      `SELECT et.*,
         s.name AS assignee_name,
         e.uuid AS event_uuid,
         e.client_name AS event_client_name,
         e.venue_name AS event_venue
       FROM event_tasks et
       JOIN events e ON e.id = et.event_id
       LEFT JOIN staff s ON s.id = et.assigned_to AND s.deleted_at IS NULL
       WHERE ${where}
       ORDER BY et.${sortBy} ${sortOrder}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return buildPaginatedResponse(rows.map(formatTaskAssignment), countRows[0].total, page, limit);
  },

  async findAllForManager(staffId, query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('event_tasks', query.sortBy);
    const conditions = ['et.deleted_at IS NULL', 'e.deleted_at IS NULL'];
    const params = [];

    conditions.push(`(
      e.assigned_manager_id = ?
      OR EXISTS (
        SELECT 1 FROM event_manager_allocations ema
        WHERE ema.event_id = e.id AND ema.staff_id = ? AND ema.deleted_at IS NULL
      )
    )`);
    params.push(staffId, staffId);

    if (query.status) {
      conditions.push('et.status = ?');
      params.push(query.status);
    }
    if (query.eventId) {
      conditions.push('et.event_id = ?');
      params.push(query.eventId);
    }
    if (query.search) {
      conditions.push('(et.title LIKE ? OR et.description LIKE ?)');
      const s = `%${query.search}%`;
      params.push(s, s);
    }

    const where = conditions.join(' AND ');
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM event_tasks et
       JOIN events e ON e.id = et.event_id
       WHERE ${where}`,
      params
    );
    const [rows] = await pool.execute(
      `SELECT et.*, s.name AS assignee_name, e.client_name AS event_client_name, e.venue_name AS event_venue
       FROM event_tasks et
       JOIN events e ON e.id = et.event_id
       LEFT JOIN staff s ON s.id = et.assigned_to
       WHERE ${where}
       ORDER BY et.${sortBy} ${sortOrder}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return buildPaginatedResponse(rows.map(formatEventTask), countRows[0].total, page, limit);
  },
};

module.exports = taskRepository;
