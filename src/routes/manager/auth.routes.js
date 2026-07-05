const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate.middleware');
const authenticate = require('../../middleware/auth.middleware');
const requireManager = require('../../middleware/requireManager.middleware');
const resolveManagerStaff = require('../../middleware/resolveManagerStaff.middleware');
const authController = require('../../controllers/manager/auth.controller');
const {
  loginSchema,
  refreshSchema,
  otpSendSchema,
  otpVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('../../validations/auth.validation');
const { authLimiter } = require('../../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/token/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/otp/send', authLimiter, validate(otpSendSchema), asyncHandler(authController.sendOtp));
router.post('/otp/verify', authLimiter, validate(otpVerifySchema), asyncHandler(authController.verifyOtp));
router.post('/password/forgot', authLimiter, validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
router.post('/password/reset', validate(resetPasswordSchema), asyncHandler(authController.resetPassword));

router.use(authenticate, requireManager);
router.post('/logout', validate(refreshSchema), asyncHandler(authController.logout));
router.post('/password/change', validate(changePasswordSchema), asyncHandler(authController.changePassword));
router.get('/me', asyncHandler(authController.getMe));

module.exports = router;
