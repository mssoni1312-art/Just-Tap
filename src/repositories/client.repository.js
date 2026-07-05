const pool = require('../config/database');
const { parsePagination, buildPaginatedResponse, sanitizeSortBy } = require('../helpers/pagination');

const formatClient = (row) => ({
  id: row.id,
  uuid: row.uuid,
  name: row.name,
  catererName: row.caterer_name,
  clientAddress: row.client_address || null,
  cityName: row.city_name,
  contactNo: row.contact_no,
  reference: row.reference,
  isHighPriority: Boolean(row.is_high_priority),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildClientWhere = (query) => {
  const conditions = ['deleted_at IS NULL'];
  const params = [];
  if (query.search) {
    conditions.push('(name LIKE ? OR caterer_name LIKE ? OR contact_no LIKE ?)');
    const s = `%${query.search}%`;
    params.push(s, s, s);
  }
  return { where: conditions.join(' AND '), params };
};

const clientRepository = {
  formatClient,

  async findAll(query) {
    const { page, limit, offset, sortOrder } = parsePagination(query);
    const sortBy = sanitizeSortBy('clients', query.sortBy);
    const { where, params } = buildClientWhere(query);

    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM clients WHERE ${where}`, params);
    const [rows] = await pool.execute(
      `SELECT * FROM clients WHERE ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return buildPaginatedResponse(rows.map(formatClient), countRows[0].total, page, limit);
  },

  async findAllForSelect(query) {
    const { where, params } = buildClientWhere(query);
    const [rows] = await pool.execute(
      `SELECT * FROM clients WHERE ${where} ORDER BY name ASC`,
      params
    );
    return rows.map(formatClient);
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM clients WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  },

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO clients (name, caterer_name, client_address, city_name, contact_no, reference, is_high_priority)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.caterer_name,
        data.client_address || null,
        data.city_name,
        data.contact_no || null,
        data.reference,
        data.is_high_priority ? 1 : 0,
      ]
    );
    return result.insertId;
  },
};

module.exports = clientRepository;
