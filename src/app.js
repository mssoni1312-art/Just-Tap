require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const healthRoutes = require('./routes/health.routes');
const errorHandler = require('./middleware/error.middleware');
const requestLogger = require('./middleware/requestLogger.middleware');
const { generalLimiter } = require('./middleware/rateLimit.middleware');

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim());

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: corsOrigins.includes('*') ? true : corsOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/health', healthRoutes);
app.get('/live', (_req, res) => {
  const healthService = require('./services/health.service');
  res.status(200).json({ success: true, message: 'alive', data: healthService.getLiveness() });
});
app.get('/ready', async (req, res, next) => {
  try {
    const healthService = require('./services/health.service');
    const readiness = await healthService.getReadiness();
    const statusCode = readiness.status === 'ready' ? 200 : 503;
    res.status(statusCode).json({ success: statusCode === 200, message: readiness.status, data: readiness });
  } catch (err) {
    next(err);
  }
});

app.use(requestLogger);
app.use(generalLimiter);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Just Tap Super Admin API',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      displayOperationId: true,
    },
  })
);
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});
app.get('/openapi.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

app.use('/api/v1', routes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', errors: [] });
});

app.use(errorHandler);

module.exports = app;
