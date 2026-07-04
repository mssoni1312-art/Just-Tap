module.exports = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  otpExpiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES) || 10,
  passwordResetExpiresMinutes: Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES) || 60,
  bcryptRounds: 12,
};
