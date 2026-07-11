const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validate.middleware');
const authController = require('../../controllers/client/auth.controller');
const { loginSchema } = require('../../validations/auth.validation');
const { registerClientSchema, clientOtpSendSchema, clientOtpVerifySchema } = require('../../validations/clientAuth.validation');
const { authLimiter } = require('../../middleware/rateLimit.middleware');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  validate(registerClientSchema),
  asyncHandler(authController.register)
);
router.post(
  '/signup',
  authLimiter,
  validate(registerClientSchema),
  asyncHandler(authController.register)
);
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/otp/send', authLimiter, validate(clientOtpSendSchema), asyncHandler(authController.sendOtp));
router.post('/otp/verify', authLimiter, validate(clientOtpVerifySchema), asyncHandler(authController.verifyOtp));

module.exports = router;
