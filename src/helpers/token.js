const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = (payload) =>
  jwt.sign(payload, jwtConfig.accessSecret, { expiresIn: jwtConfig.accessExpiresIn });

const generateRefreshToken = (payload) =>
  jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpiresIn }
  );

const verifyAccessToken = (token) => jwt.verify(token, jwtConfig.accessSecret);

const verifyRefreshToken = (token) => jwt.verify(token, jwtConfig.refreshSecret);

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

module.exports = {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateOtp,
  generateResetToken,
};
