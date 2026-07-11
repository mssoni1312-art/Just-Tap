require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const {
  adminSwaggerSpec,
  managerSwaggerSpec,
  clientSwaggerSpec,
  combinedSwaggerSpec,
} = require('./config/swagger');
const routes = require('./routes');
const healthRoutes = require('./routes/health.routes');
const errorHandler = require('./middleware/error.middleware');
const requestLogger = require('./middleware/requestLogger.middleware');
const { generalLimiter } = require('./middleware/rateLimit.middleware');

const app = express();

// Railway (and other reverse proxies) sit in front of the app.
app.set('trust proxy', 1);

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

const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    displayOperationId: true,
  },
};

app.use(
  '/api/docs',
  swaggerUi.serveFiles(adminSwaggerSpec, swaggerUiOptions),
  swaggerUi.setup(adminSwaggerSpec, {
    ...swaggerUiOptions,
    customSiteTitle: 'Just Tap Super Admin API',
  })
);
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(adminSwaggerSpec);
});
app.get('/api/docs', (_req, res) => res.redirect(301, '/api/docs/'));

const managerRouter = require('./routes/manager');

const managerSwaggerSetup = {
  explorer: true,
  customSiteTitle: 'Just Tap Manager API',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    url: '/api/manager/docs.json',
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    displayOperationId: true,
    validatorUrl: null,
  },
};

// Manager Swagger — must be registered BEFORE app.use('/api/manager', managerRouter)
app.get('/api/manager/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(managerSwaggerSpec);
});
app.use('/api/manager/docs', swaggerUi.serve);
app.get('/api/manager/docs', swaggerUi.setup(null, managerSwaggerSetup));
app.get('/api/manager/docs/', swaggerUi.setup(null, managerSwaggerSetup));

// Client Swagger — must be registered BEFORE app.use('/api/client', clientRouter)
app.use(
  '/api/client/docs',
  swaggerUi.serveFiles(clientSwaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      displayOperationId: true,
    },
  }),
  swaggerUi.setup(clientSwaggerSpec, {
    explorer: true,
    customSiteTitle: 'Just Tap Client API',
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
app.get('/api/client/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(clientSwaggerSpec);
});
app.get('/api/client/docs', (_req, res) => res.redirect(301, '/api/client/docs/'));

app.get('/openapi.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(combinedSwaggerSpec);
});

app.use('/api/v1', routes);
app.use('/api/manager', managerRouter);
app.use('/api/v1/manager', managerRouter);

const clientRouter = require('./routes/client');
app.use('/api/client', clientRouter);
app.use('/api/v1/client', clientRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', errors: [] });
});

app.use(errorHandler);

module.exports = app;
