const Joi = require('joi');
const { paginationQuery } = require('./common.validation');

const registerClientSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().trim().required(),
  phone: Joi.string().trim().allow(null, '').optional(),
  cityName: Joi.string().trim().allow(null, '').optional(),
});

const listClientInquiriesSchema = paginationQuery.keys({
  status: Joi.string().valid('pending', 'converted'),
});

const clientOtpSendSchema = Joi.object({
  email: Joi.string().trim().email().required(),
});

const clientOtpVerifySchema = Joi.object({
  email: Joi.string().trim().email().required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required(),
});

module.exports = {
  registerClientSchema,
  listClientInquiriesSchema,
  clientOtpSendSchema,
  clientOtpVerifySchema,
};
