const { sendSuccess } = require('../helpers/response');
const authService = require('../services/auth.service');

const authController = {
  async login(req, res) {
    const result = await authService.login(req.body.identifier, req.body.password);
    sendSuccess(res, result, 'Login successful');
  },

  async logout(req, res) {
    await authService.logout(req.body.refreshToken);
    sendSuccess(res, null, 'Logged out successfully');
  },

  async refresh(req, res) {
    const result = await authService.refresh(req.body.refreshToken);
    sendSuccess(res, result, 'Token refreshed');
  },

  async sendOtp(req, res) {
    const result = await authService.sendOtp(req.body.identifier);
    sendSuccess(res, result, result.message);
  },

  async verifyOtp(req, res) {
    const result = await authService.verifyOtp(req.body.identifier, req.body.code);
    sendSuccess(res, result, 'OTP verified');
  },

  async forgotPassword(req, res) {
    const result = await authService.forgotPassword(req.body.identifier);
    sendSuccess(res, result, result.message);
  },

  async resetPassword(req, res) {
    const result = await authService.resetPassword(req.body.token, req.body.newPassword);
    sendSuccess(res, result, result.message);
  },

  async changePassword(req, res) {
    const result = await authService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    sendSuccess(res, result, result.message);
  },

  async getMe(req, res) {
    const result = await authService.getMe(req.user.id);
    sendSuccess(res, result);
  },
};

module.exports = authController;
