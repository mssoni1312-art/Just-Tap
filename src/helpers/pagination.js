const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const sortOrder = (query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return { page, limit, offset, sortOrder, sortBy: query.sortBy || 'created_at' };
};

const buildPaginatedResponse = (items, total, page, limit) => ({
  items,
  pagination: {
    page,
    limit,
    total: Number(total) || 0,
    totalPages: Math.ceil((Number(total) || 0) / limit) || 0,
  },
});

const ALLOWED_SORT_COLUMNS = {
  events: ['created_at', 'start_date', 'client_name', 'status', 'venue_name', 'city_name'],
  inquiries: ['created_at', 'event_date', 'client_name', 'ref_number', 'venue', 'status'],
  menu_categories: ['sort_order', 'name', 'created_at'],
  menu_subcategories: ['sort_order', 'name', 'created_at', 'category_id'],
  menu_items: ['name', 'price', 'created_at', 'category_id', 'subcategory_id'],
  feedback: ['created_at', 'rating', 'client_name'],
  feedback_questions: ['sort_order', 'created_at', 'question_text'],
  staff: ['name', 'role', 'created_at'],
  clients: ['name', 'city_name', 'created_at'],
  function_names: ['sort_order', 'name', 'created_at'],
  task_templates: ['name', 'category', 'created_at'],
  event_tasks: ['due_date', 'status', 'created_at', 'title'],
};

const sanitizeSortBy = (table, sortBy) => {
  const allowed = ALLOWED_SORT_COLUMNS[table] || ['created_at'];
  return allowed.includes(sortBy) ? sortBy : 'created_at';
};

module.exports = { parsePagination, buildPaginatedResponse, sanitizeSortBy };
