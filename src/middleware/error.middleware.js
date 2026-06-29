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

  if (err.name === 'MulterError') {
    return sendError(res, err.message, [], 400);
  }

  return sendError(res, 'Internal server error', [], 500);
};

module.exports = errorHandler;
