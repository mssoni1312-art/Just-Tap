const Joi = require('joi');

const loginSchema = Joi.object({
  identifier: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const otpSendSchema = Joi.object({
  identifier: Joi.string().required(),
});

const otpVerifySchema = Joi.object({
  identifier: Joi.string().required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const forgotPasswordSchema = Joi.object({
  identifier: Joi.string().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(100),
  lastName: Joi.string().max(100),
  handle: Joi.string().max(100).allow(null, ''),
  email: Joi.string().email(),
  phone: Joi.string().max(20).allow(null, ''),
});

const updatePreferencesSchema = Joi.object({
  pushEnabled: Joi.boolean(),
  emailAlertsEnabled: Joi.boolean(),
  darkModeEnabled: Joi.boolean(),
  onboardingCompleted: Joi.boolean(),
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().allow(''),
  sortBy: Joi.string(),
  sortOrder: Joi.string().valid('asc', 'desc'),
});

module.exports = {
  loginSchema,
  refreshSchema,
  otpSendSchema,
  otpVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  updatePreferencesSchema,
  paginationSchema,
};
