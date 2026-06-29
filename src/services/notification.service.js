const logger = require('../utils/logger');

const notificationService = {
  async sendOtp(identifier, otp) {
    logger.info(`OTP for ${identifier}: ${otp}`);
    return true;
  },

  async sendPasswordReset(email, token) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    logger.info(`Password reset for ${email}: ${baseUrl}/reset-password?token=${token}`);
    return true;
  },
};

module.exports = notificationService;
