const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse, sanitizeSortBy } = require('../helpers/pagination');

const parseJson = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const formatQuestion = (row) => ({
  id: String(row.id),
  uuid: row.uuid,
  questionText: row.question_text,
  questionType: row.question_type,
  options: parseJson(row.options),
  isRequired: Boolean(row.is_required),
  sortOrder: Number(row.sort_order),
  isActive: Boolean(row.is_active),
  eventId: row.event_id ? String(row.event_id) : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const formatResponse = (row) => ({
  id: String(row.id),
  uuid: row.uuid,
  questionId: String(row.question_id),
  answerText: row.answer_text,
  answerRating: row.answer_rating !== null ? Number(row.answer_rating) : null,
  answerOptions: parseJson(row.answer_options),
  createdAt: row.created_at,
});

const formatSubmission = (row, responses = []) => ({
  id: String(row.id),
  uuid: row.uuid,
  eventId: String(row.event_id),
  clientName: row.client_name,
  tableNo: row.table_no,
  responses,
  createdAt: row.created_at,
});

const feedbackQuestionRepository = {
  formatQuestion,

  async findAll(query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('feedback_questions', query.sortBy);
    const conditions = ['fq.deleted_at IS NULL'];
    const params = [];

    if (query.eventId) {
      conditions.push('fq.event_id = ?');
      params.push(query.eventId);
    }
    if (query.scope === 'global') {
      conditions.push('fq.event_id IS NULL');
    }
    if (query.isActive !== undefined) {
      conditions.push('fq.is_active = ?');
      params.push(query.isActive ? 1 : 0);
    }
    if (query.search) {
      conditions.push('fq.question_text LIKE ?');
      params.push(`%${query.search}%`);
    }

    const where = conditions.join(' AND ');
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM feedback_questions fq WHERE ${where}`,
      params
    );
    const [rows] = await pool.execute(
      `SELECT fq.* FROM feedback_questions fq
       WHERE ${where}
       ORDER BY fq.${sortBy} ${sortOrder}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return buildPaginatedResponse(rows.map(formatQuestion), countRows[0].total, page, limit);
  },

  async findActiveForEvent(eventId) {
    const [rows] = await pool.execute(
      `SELECT * FROM feedback_questions
       WHERE deleted_at IS NULL
         AND is_active = 1
         AND (event_id IS NULL OR event_id = ?)
       ORDER BY sort_order ASC, id ASC`,
      [eventId]
    );
    return rows.map(formatQuestion);
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM feedback_questions WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO feedback_questions
         (question_text, question_type, options, is_required, sort_order, is_active, event_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.question_text,
        data.question_type,
        data.options ? JSON.stringify(data.options) : null,
        data.is_required ? 1 : 0,
        data.sort_order ?? 0,
        data.is_active !== false ? 1 : 0,
        data.event_id || null,
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const map = {
      question_text: 'questionText',
      question_type: 'questionType',
      is_required: 'isRequired',
      sort_order: 'sortOrder',
      is_active: 'isActive',
      event_id: 'eventId',
    };

    for (const [col, key] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        if (col === 'is_required' || col === 'is_active') {
          values.push(data[key] ? 1 : 0);
        } else if (col === 'event_id') {
          values.push(data[key] || null);
        } else {
          values.push(data[key]);
        }
      }
    }

    if (data.options !== undefined) {
      fields.push('options = ?');
      values.push(data.options ? JSON.stringify(data.options) : null);
    }

    if (!fields.length) return;
    values.push(id);
    await pool.execute(
      `UPDATE feedback_questions SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      values
    );
  },

  async reorder(items) {
    for (const item of items) {
      await pool.execute(
        'UPDATE feedback_questions SET sort_order = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL',
        [item.sortOrder, item.id]
      );
    }
  },

  async softDelete(id) {
    await pool.execute(
      'UPDATE feedback_questions SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  },

  async bulkSoftDelete(ids) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE feedback_questions SET deleted_at = NOW()
       WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      ids
    );
    return result.affectedRows;
  },

  async createSubmission({ eventId, clientName, tableNo }) {
    const [result] = await pool.execute(
      'INSERT INTO feedback_submissions (event_id, client_name, table_no) VALUES (?, ?, ?)',
      [eventId, clientName || null, tableNo || null]
    );
    return result.insertId;
  },

  async createResponses(submissionId, responses) {
    const created = [];
    for (const response of responses) {
      const [result] = await pool.execute(
        `INSERT INTO feedback_question_responses
           (submission_id, question_id, answer_text, answer_rating, answer_options)
         VALUES (?, ?, ?, ?, ?)`,
        [
          submissionId,
          response.questionId,
          response.answerText || null,
          response.answerRating ?? null,
          response.answerOptions ? JSON.stringify(response.answerOptions) : null,
        ]
      );
      created.push(result.insertId);
    }
    return created;
  },

  async findSubmissionById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM feedback_submissions WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findResponsesBySubmission(submissionId) {
    const [rows] = await pool.execute(
      'SELECT * FROM feedback_question_responses WHERE submission_id = ? ORDER BY id',
      [submissionId]
    );
    return rows.map(formatResponse);
  },

  async findSubmissionsByEvent(eventId, query) {
    const { page, limit, offset } = parsePagination(query);
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) AS total FROM feedback_submissions WHERE event_id = ?',
      [eventId]
    );
    const [rows] = await pool.execute(
      `SELECT * FROM feedback_submissions
       WHERE event_id = ?
       ORDER BY created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [eventId]
    );

    const items = [];
    for (const row of rows) {
      const responses = await this.findResponsesBySubmission(row.id);
      items.push(formatSubmission(row, responses));
    }

    return buildPaginatedResponse(items, countRows[0].total, page, limit);
  },
};

module.exports = feedbackQuestionRepository;
