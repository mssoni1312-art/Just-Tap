const resolveManagerStaff = require('./resolveManagerStaff.middleware');

const optionalResolveManagerStaff = (req, res, next) => {
  if (req.user?.role === 'super_admin') {
    return next();
  }
  return resolveManagerStaff(req, res, next);
};

module.exports = optionalResolveManagerStaff;
