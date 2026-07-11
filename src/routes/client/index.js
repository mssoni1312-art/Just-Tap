const express = require('express');
const authRoutes = require('./auth.routes');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Just Tap Client API',
    data: {
      version: '1.0.0',
      prefix: '/api/client',
      docs: '/api/client/docs',
      auth: {
        signup: '/api/client/auth/signup',
        register: '/api/client/auth/register',
        login: '/api/client/auth/login',
        otpSend: '/api/client/auth/otp/send',
        otpVerify: '/api/client/auth/otp/verify',
      },
      inquiries: '/api/client/inquiries',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/inquiries', require('./inquiries.routes'));

module.exports = router;
