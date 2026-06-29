const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authController = require('../controllers/auth.controller');
const {
  loginSchema,
  refreshSchema,
  otpSendSchema,
  otpVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('../validations/auth.validation');
const authenticate = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email/phone and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and revoke refresh token
 */
router.post('/logout', authenticate, validate(refreshSchema), asyncHandler(authController.logout));

/**
 * @swagger
 * /auth/token/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     security: []
 */
router.post('/token/refresh', validate(refreshSchema), asyncHandler(authController.refresh));

/**
 * @swagger
 * /auth/otp/send:
 *   post:
 *     tags: [Auth]
 *     summary: Send OTP
 *     security: []
 */
router.post('/otp/send', authLimiter, validate(otpSendSchema), asyncHandler(authController.sendOtp));

/**
 * @swagger
 * /auth/otp/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP
 *     security: []
 */
router.post('/otp/verify', authLimiter, validate(otpVerifySchema), asyncHandler(authController.verifyOtp));

/**
 * @swagger
 * /auth/password/forgot:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 *     security: []
 */
router.post('/password/forgot', authLimiter, validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));

/**
 * @swagger
 * /auth/password/reset:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     security: []
 */
router.post('/password/reset', validate(resetPasswordSchema), asyncHandler(authController.resetPassword));

/**
 * @swagger
 * /auth/password/change:
 *   post:
 *     tags: [Auth]
 *     summary: Change password (authenticated)
 */
router.post('/password/change', authenticate, validate(changePasswordSchema), asyncHandler(authController.changePassword));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 */
router.get('/me', authenticate, asyncHandler(authController.getMe));

module.exports = router;
