const components = require('./components');
const { authPaths, mePaths, dashboardPaths } = require('./paths/auth.paths');
const eventsPaths = require('./paths/events.paths');
const { inquiriesPaths, menuPaths } = require('./paths/resources.paths');
const {
  tasksPaths,
  managerPaths,
  staffPaths,
  feedbackPaths,
  ordersPaths,
  activityPaths,
  miscPaths,
} = require('./paths/operations.paths');

const buildOpenApiSpec = () => ({
  openapi: '3.0.3',
  info: {
    title: 'Just Tap Super Admin Mobile API',
    version: '1.0.0',
    description: [
      'REST API for the **Just Tap Mobile Super Admin** application (Figma Frame 1261155661).',
      '',
      '## Authentication',
      '1. Call `POST /auth/login` with email/phone and password.',
      '2. Copy the `accessToken` from the response.',
      '3. Add header on all protected routes: `Authorization: Bearer <accessToken>`.',
      '4. Refresh expired tokens via `POST /auth/token/refresh`.',
      '',
      '## Response format',
      'All endpoints return JSON: `{ success, message, data }` on success or `{ success, message, errors }` on failure.',
      '',
      '## Validation',
      'Request bodies and query params are validated with Joi. Validation errors return HTTP **422** with an `errors` array.',
      '',
      '## Pagination',
      'List endpoints accept `page`, `limit`, `search`, `sortBy`, `sortOrder` plus domain-specific filters.',
    ].join('\n'),
    contact: { name: 'Just Tap API Support', email: 'admin@justtap.com' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: '/api/v1', description: 'API v1 (relative to host)' },
    { url: 'http://localhost:3000/api/v1', description: 'Local development' },
  ],
  tags: [
    { name: 'Health', description: 'Health, liveness, and readiness probes' },
    { name: 'Auth', description: 'Login, logout, OTP, password management' },
    { name: 'Profile', description: 'User profile, preferences, avatar' },
    { name: 'Dashboard', description: 'Home screen aggregated data' },
    { name: 'Events', description: 'Event CRUD, calendar, functions, nested operations' },
    { name: 'Inquiries', description: 'Inquiry management and conversion' },
    { name: 'Menu', description: 'Menu categories, items, packages, planning' },
    { name: 'Tasks', description: 'Task templates and event task assignment' },
    { name: 'Staff', description: 'Staff master data' },
    { name: 'Managers', description: 'Event manager list for assignment dropdowns' },
    { name: 'Feedback', description: 'Guest feedback reply and flagging' },
    { name: 'Orders', description: 'Order line items and reports' },
    { name: 'Tables', description: 'Table assignments and allocation' },
    { name: 'Activity', description: 'Audit and activity logs' },
    { name: 'Analytics', description: 'Sales and reporting analytics' },
    { name: 'Content', description: 'Static content pages' },
    { name: 'Uploads', description: 'Image and document uploads' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Overall health status',
        operationId: 'healthCheck',
        security: [],
        responses: {
          200: { description: 'All dependencies healthy' },
          503: { description: 'One or more dependencies unavailable' },
        },
      },
    },
    '/health/live': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        description: 'Returns 200 if the Node.js process is running. Use for Kubernetes liveness probes.',
        operationId: 'healthLive',
        security: [],
        responses: { 200: { description: 'Process is alive' } },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe',
        description: 'Checks MySQL and Redis connectivity. Returns 503 until all dependencies are ready.',
        operationId: 'healthReady',
        security: [],
        responses: {
          200: { description: 'Ready to accept traffic' },
          503: { description: 'Not ready — database or Redis unavailable' },
        },
      },
    },
    '/live': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe (alias)',
        operationId: 'liveAlias',
        security: [],
        responses: { 200: { description: 'Process is alive' } },
      },
    },
    '/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe (alias)',
        operationId: 'readyAlias',
        security: [],
        responses: {
          200: { description: 'Ready' },
          503: { description: 'Not ready' },
        },
      },
    },
    ...authPaths,
    ...mePaths,
    ...dashboardPaths,
    ...eventsPaths,
    ...inquiriesPaths,
    ...menuPaths,
    ...tasksPaths,
    ...managerPaths,
    ...staffPaths,
    ...feedbackPaths,
    ...ordersPaths,
    ...activityPaths,
    ...miscPaths,
  },
  components,
  security: [{ bearerAuth: [] }],
});

module.exports = buildOpenApiSpec;
