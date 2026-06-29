const express = require('express');
const authRoutes = require('./auth.routes');
const meRoutes = require('./me.routes');
const dashboardRoutes = require('./dashboard.routes');
const eventsRoutes = require('./events.routes');
const inquiriesRoutes = require('./inquiries.routes');
const menuRoutes = require('./menu.routes');
const tasksRoutes = require('./tasks.routes');
const { ordersRouter } = require('./orders.routes');
const feedbackRoutes = require('./feedback.routes');
const staffRoutes = require('./staff.routes');
const managerRoutes = require('./manager.routes');
const analyticsRoutes = require('./analytics.routes');
const contentRoutes = require('./content.routes');
const uploadsRoutes = require('./uploads.routes');
const activityRoutes = require('./activity.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/me', meRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/events', eventsRoutes);
router.use('/inquiries', inquiriesRoutes);
router.use('/menu', menuRoutes);
router.use('/tasks', tasksRoutes);
router.use('/orders', ordersRouter);
router.use('/feedback', feedbackRoutes);
router.use('/staff', staffRoutes);
router.use('/managers', managerRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/content', contentRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/activity', activityRoutes);

module.exports = router;
