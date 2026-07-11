const clientRepository = require('../repositories/client.repository');
const AppError = require('../utils/AppError');

const resolveClientProfile = async (req, _res, next) => {
  try {
    const client = await clientRepository.findByUserId(req.user.id);
    if (!client) {
      return next(new AppError('Client profile not found', 403));
    }
    req.clientProfile = client;
    req.clientId = client.id;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = resolveClientProfile;
