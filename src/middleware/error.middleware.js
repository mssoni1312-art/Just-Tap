const logger = require('../utils/logger');
const { sendError } = require('../helpers/response');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, _next) => {
  logger.error('Request error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return sendError(res, err.message, err.errors, err.statusCode);
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'Duplicate entry', [err.message], 409);
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    return sendError(res, 'Database schema is out of date. Run migrations and retry.', [err.message], 500);
  }

  if (err.code === 'ER_TRUNCATED_WRONG_VALUE' || err.code === 'ER_WRONG_VALUE') {
    return sendError(res, 'Invalid date or time value in request', [err.message], 400);
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return sendError(res, 'Invalid reference in request', [err.message], 400);
  }

  if (err.name === 'MulterError') {
    return sendError(res, err.message, [], 400);
  }

  return sendError(res, 'Internal server error', [], 500);
};

module.exports = errorHandler;
