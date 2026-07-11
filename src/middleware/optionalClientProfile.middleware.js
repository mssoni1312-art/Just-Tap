const { verifyAccessToken } = require('../helpers/token');
const clientRepository = require('../repositories/client.repository');
const AppError = require('../utils/AppError');

const optionalClientProfile = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = header.slice(7);
    const decoded = verifyAccessToken(token);
    if (decoded.role !== 'client') {
      return next();
    }

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    const client = await clientRepository.findByUserId(req.user.id);
    if (!client) {
      return next(new AppError('Client profile not found', 403));
    }

    req.clientProfile = client;
    req.clientId = client.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    next(err);
  }
};

module.exports = optionalClientProfile;
