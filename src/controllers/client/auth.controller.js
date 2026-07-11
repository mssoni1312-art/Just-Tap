const { sendSuccess } = require('../../helpers/response');
const clientAuthService = require('../../services/client/auth.service');

module.exports = {
  register: async (req, res) => {
    const result = await clientAuthService.register(req.body);
    sendSuccess(res, result, 'Registration successful', 201);
  },
  login: async (req, res) => {
    const result = await clientAuthService.login(req.body.identifier, req.body.password);
    sendSuccess(res, result, 'Login successful');
  },
  sendOtp: async (req, res) => {
    const result = await clientAuthService.sendOtp(req.body.email);
    sendSuccess(res, result, result.message);
  },
  verifyOtp: async (req, res) => {
    const result = await clientAuthService.verifyOtp(req.body.email, req.body.code);
    sendSuccess(res, result, result.message);
  },
};
