const staffRepository = require('../repositories/staff.repository');
const AppError = require('../utils/AppError');

const resolveManagerStaff = async (req, _res, next) => {
  try {
    const staff = await staffRepository.findByUserId(req.user.id);
    if (!staff || staff.role !== 'event_manager') {
      return next(new AppError('Manager staff profile not found', 403));
    }
    req.managerStaffId = staff.id;
    req.managerStaff = staff;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = resolveManagerStaff;
