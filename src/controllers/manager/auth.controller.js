const { sendSuccess } = require('../../helpers/response');
const managerAuthService = require('../../services/manager/auth.service');

module.exports = {
  login: async (req, res) => {
    const result = await managerAuthService.login(req.body.identifier, req.body.password);
    sendSuccess(res, result, 'Login successful');
  },
  logout: async (req, res) => {
    await managerAuthService.logout(req.body.refreshToken);
    sendSuccess(res, null, 'Logged out successfully');
  },
  refresh: async (req, res) => {
    const result = await managerAuthService.refresh(req.body.refreshToken);
    sendSuccess(res, result, 'Token refreshed');
  },
  sendOtp: async (req, res) => {
    const result = await managerAuthService.sendOtp(req.body.identifier);
    sendSuccess(res, result, result.message);
  },
  verifyOtp: async (req, res) => {
    const result = await managerAuthService.verifyOtp(req.body.identifier, req.body.code);
    sendSuccess(res, result, 'OTP verified');
  },
  forgotPassword: async (req, res) => {
    const result = await managerAuthService.forgotPassword(req.body.identifier);
    sendSuccess(res, result, result.message);
  },
  resetPassword: async (req, res) => {
    const result = await managerAuthService.resetPassword(req.body.token, req.body.newPassword);
    sendSuccess(res, result, result.message);
  },
  changePassword: async (req, res) => {
    const result = await managerAuthService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    sendSuccess(res, result, result.message);
  },
  getMe: async (req, res) => {
    sendSuccess(res, await managerAuthService.getMe(req.user.id));
  },
};
