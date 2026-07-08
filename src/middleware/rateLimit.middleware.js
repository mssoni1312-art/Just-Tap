const rateLimit = require('express-rate-limit');

const limiterOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  // Railway sits behind a reverse proxy; never let validation throw and drop
  // the TCP connection before Express can send a response header.
  validate: false,
  passOnStoreError: true,
  keyGenerator: (req) => req.ip || req.socket?.remoteAddress || 'unknown',
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
