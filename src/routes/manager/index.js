const express = require('express');
const authRoutes = require('./auth.routes');
const meRoutes = require('./me.routes');
const dashboardRoutes = require('./dashboard.routes');
const eventsRoutes = require('./events.routes');
const menuRoutes = require('./menu.routes');
const tasksRoutes = require('./tasks.routes');
const feedbackRoutes = require('./feedback.routes');
const reportRoutes = require('./report.routes');
const uploadsRoutes = require('./uploads.routes');
const ordersRoutes = require('./orders.routes');
const analyticsRoutes = require('./analytics.routes');
const teamAllocationRoutes = require('./team_allocation.routes');
const inquiriesRoutes = require('./inquiries.routes');
const staffRoutes = require('./staff.routes');
const managersRoutes = require('./managers.routes');
const contentRoutes = require('./content.routes');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Just Tap Manager API',
    data: {
      version: '1.0.0',
      prefix: '/api/manager',
      docs: '/api/manager/docs',
      auth: '/api/manager/auth/login',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/me', meRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/events', eventsRoutes);
router.use('/menu', menuRoutes);
router.use('/tasks', tasksRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/report', reportRoutes);
router.use('/orders', ordersRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/team-allocations', teamAllocationRoutes);
router.use('/inquiries', inquiriesRoutes);
router.use('/staff', staffRoutes);
router.use('/managers', managersRoutes);
router.use('/content', contentRoutes);

module.exports = router;
