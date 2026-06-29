const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const healthService = require('../services/health.service');

const router = express.Router();

router.get('/', asyncHandler(async (_req, res) => {
  const health = await healthService.getHealth();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json({ success: statusCode === 200, message: health.status, data: health });
}));

router.get('/live', (_req, res) => {
  const liveness = healthService.getLiveness();
  res.status(200).json({ success: true, message: 'alive', data: liveness });
});

router.get('/ready', asyncHandler(async (_req, res) => {
  const readiness = await healthService.getReadiness();
  const statusCode = readiness.status === 'ready' ? 200 : 503;
  res.status(statusCode).json({ success: statusCode === 200, message: readiness.status, data: readiness });
}));

module.exports = router;
