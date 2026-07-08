const rateLimit = require('express-rate-limit');

const limiterOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  // Railway sits behind a reverse proxy; disable strict X-Forwarded-For validation
  // so rate limiting never throws and drops the connection mid-request.
  validate: { trustProxy: false, xForwardedForHeader: false },
};

const authLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later', errors: [] },
});

const generalLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests', errors: [] },
});

module.exports = { authLimiter, generalLimiter };
