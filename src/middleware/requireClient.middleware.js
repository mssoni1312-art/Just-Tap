const AppError = require('../utils/AppError');

const requireClient = (req, _res, next) => {
  if (!req.user || req.user.role !== 'client') {
    return next(new AppError('Client access required', 403));
  }
  next();
};

module.exports = requireClient;
