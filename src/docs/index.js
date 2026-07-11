const components = require('./components');
const { authPaths, mePaths, dashboardPaths } = require('./paths/auth.paths');
const eventsPaths = require('./paths/events.paths');
const { inquiriesPaths, menuPaths } = require('./paths/resources.paths');
const {
  tasksPaths,
  managerPaths,
  clientPaths,
  functionNamePaths,
  staffPaths,
  feedbackPaths,
  feedbackQuestionPaths,
  ordersPaths,
  activityPaths,
  miscPaths,
  teamAllocationPaths,
} = require('./paths/operations.paths');
const reportPaths = require('./paths/report.paths');
const managerPortalPaths = require('./paths/manager.paths');
const clientFlowPaths = require('./paths/clientFlow.paths');
const clientAppPaths = require('./paths/clientApp.paths');
const clientPortalPaths = require('./paths/client.paths');

const healthPaths = {
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
};

const adminApiPaths = {
  ...authPaths,
  ...mePaths,
  ...dashboardPaths,
  ...eventsPaths,
  ...inquiriesPaths,
  ...menuPaths,
  ...tasksPaths,
  ...managerPaths,
  ...clientPaths,
  ...functionNamePaths,
  ...staffPaths,
  ...feedbackPaths,
  ...feedbackQuestionPaths,
  ...ordersPaths,
  ...activityPaths,
  ...miscPaths,
  ...teamAllocationPaths,
  ...reportPaths,
  ...clientFlowPaths,
  ...clientAppPaths,
};

const allTags = [
  { name: 'Health', description: 'Health, liveness, and readiness probes' },
  { name: 'Auth', description: 'Login, logout, OTP, password management' },
  { name: 'Profile', description: 'User profile, preferences, avatar' },
  { name: 'Dashboard', description: 'Home screen aggregated data' },
  { name: 'Events', description: 'Event CRUD, calendar, functions, nested operations' },
  { name: 'Inquiries', description: 'Inquiry management and conversion' },
  { name: 'Menu', description: 'Menu categories, items, packages, and catalog management' },
  { name: 'Menu Planning', description: 'Add Item flow — create categories, subcategories, and menu items' },
  { name: 'Tasks', description: 'Task templates and event task assignment' },
  { name: 'Staff', description: 'Staff master data' },
  { name: 'Managers', description: 'Event manager allocation — create managers and list for team assignment dropdowns (captain uses the same manager records)' },
  { name: 'Team Allocation', description: 'Team allocation boards and manager report (assigned tables, tasks, timeline)' },
  { name: 'Clients', description: 'Client master data — list dropdown & quick-add for Create Event (GET /clients, POST /clients)' },
  { name: 'Function Names', description: 'Function name master data — list dropdown & quick-add for Create Event Function Details step (GET /function-names, POST /function-names)' },
  { name: 'Feedback', description: 'Guest feedback reply and flagging' },
  { name: 'Feedback Questionnaire', description: 'Dynamic feedback questions for admin and guest apps' },
  { name: 'Client Flow', description: 'Client/guest mobile app — reels, feeds, and public event content' },
  { name: 'Client', description: 'Just Tap Client mobile app — authentication and inquiries' },
  { name: 'Client Auth', description: 'Client app login and registration' },
  { name: 'Client Inquiries', description: 'Client app service inquiry history' },
  { name: 'Super Admin Client Dashboard', description: 'Super Admin APIs for client app content — our-events, reels, discover experiences, and testimonials (`/api/v1/admin/*`)' },
  { name: 'Orders', description: 'Order line items and reports' },
  { name: 'Tables', description: 'Table assignments and allocation' },
  { name: 'Activity', description: 'Audit and activity logs' },
  { name: 'Analytics', description: 'Sales and reporting analytics' },
  { name: 'Content', description: 'Static content pages' },
  { name: 'Uploads', description: 'Image and document uploads' },
  { name: 'Report Builder', description: 'Menu report designer — templates, theme, typography, and client sharing' },
  { name: 'Manager', description: 'Just Tap Manager mobile app — scoped to allocated events' },
  { name: 'Manager Auth', description: 'Manager login, logout, OTP, password management' },
  { name: 'Manager Dashboard', description: 'Manager home screen aggregated data' },
  { name: 'Manager Events', description: 'Event CRUD, calendar, functions — manager-scoped' },
  { name: 'Manager Tables', description: 'Dining and captain table assignments for manager events' },
  { name: 'Manager Orders', description: 'Live order summary, tables, line items, and reports for manager events' },
  { name: 'Manager Menu', description: 'Menu categories, items, packages, planning' },
  { name: 'Manager Tasks', description: 'Event task management' },
  { name: 'Manager Feedback', description: 'Customer feedback for manager events' },
  { name: 'Manager Uploads', description: 'Image and document uploads' },
  { name: 'Manager Profile', description: 'Manager profile and preferences' },
  { name: 'Manager Report', description: 'Menu report designer — templates, theme, photos, PDF — manager-scoped' },
];

const isManagerPortalTag = (name) => name === 'Manager' || name.startsWith('Manager ');
const isClientPortalTag = (name) => ['Client', 'Client Auth', 'Client Inquiries'].includes(name);

const prefixManagerApiPaths = (paths) => {
  const prefixed = {};
  for (const [route, definition] of Object.entries(paths)) {
    prefixed[`/api/manager${route}`] = definition;
  }
  return prefixed;
};

const prefixClientApiPaths = (paths) => {
  const prefixed = {};
  for (const [route, definition] of Object.entries(paths)) {
    prefixed[`/api/client${route}`] = definition;
  }
  return prefixed;
};

const buildAdminOpenApiSpec = () => ({
  openapi: '3.0.3',
  info: {
    title: 'Just Tap Super Admin API',
    version: '1.0.0',
    description: [
      'REST API for the **Just Tap Super Admin** mobile application.',
      '',
      '## Authentication',
      '1. Call `POST /auth/login` with email/phone and password.',
      '2. Copy the `token` from the response.',
      '3. Add header on all protected routes: `Authorization: Bearer <token>`.',
      '4. Refresh expired tokens via `POST /auth/token/refresh`.',
      '',
      '**Default seed login:** `admin@justtap.com` / `admin123`',
      '',
      '## Clients (Create Event)',
      '- `GET /clients?forSelect=true` — load **Client Name** dropdown',
      '- `POST /clients` — quick-add client from **+** modal (`{ "name": "testy" }`)',
      '- `GET /clients/{id}` — get client details',
      '',
      '## Function Names (Create Event)',
      '- `GET /function-names?forSelect=true` — load **Select Function** dropdown',
      '- `POST /function-names` — quick-add function from **+** button (`{ "name": "Reception" }`)',
      '- `GET /function-names/{id}` — get function name details',
      '',
      '## Manager API docs',
      'Manager portal has a separate Swagger UI: `/api/manager/docs`',
      '',
      '## Client API docs',
      'Client app has a separate Swagger UI: `/api/client/docs`',
    ].join('\n'),
    contact: { name: 'Just Tap API Support', email: 'admin@justtap.com' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: '/api/v1', description: 'Super Admin API (relative to host)' },
    { url: 'http://localhost:3000/api/v1', description: 'Local development' },
  ],
  tags: allTags.filter((tag) => !isManagerPortalTag(tag.name) && !isClientPortalTag(tag.name)),
  paths: {
    ...healthPaths,
    ...adminApiPaths,
  },
  components,
  security: [{ bearerAuth: [] }],
});

const buildManagerOpenApiSpec = () => ({
  openapi: '3.0.3',
  info: {
    title: 'Just Tap Manager API',
    version: '1.0.0',
    description: [
      'REST API for the **Just Tap Manager** mobile application (JustTap Client Figma).',
      '',
      'Managers only see events they are allocated to.',
      '',
      '## Authentication',
      '1. Call `POST /api/manager/auth/login` with email/phone and password.',
      '2. Copy the `token` from the response.',
      '3. Add header on all protected routes: `Authorization: Bearer <token>`.',
      '4. Refresh expired tokens via `POST /api/manager/auth/token/refresh`.',
      '',
      '**Default seed login:** `manager@justtap.com` / `manager123`',
      '',
      '## Super Admin API docs',
      'Admin portal has a separate Swagger UI: `/api/docs`',
    ].join('\n'),
    contact: { name: 'Just Tap API Support', email: 'admin@justtap.com' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local development' },
    { url: '/', description: 'Current host' },
  ],
  tags: allTags.filter((tag) => isManagerPortalTag(tag.name)),
  paths: prefixManagerApiPaths(managerPortalPaths),
  components,
  security: [{ bearerAuth: [] }],
});

const buildClientOpenApiSpec = () => ({
  openapi: '3.0.3',
  info: {
    title: 'Just Tap Client API',
    version: '1.0.0',
    description: [
      'REST API for the **Just Tap Client** mobile application.',
      '',
      '## Authentication',
      '1. Register via `POST /api/client/auth/register` or login via `POST /api/client/auth/login`.',
      '2. Or verify email via `POST /api/client/auth/otp/send` then `POST /api/client/auth/otp/verify`.',
      '3. Copy the `token` from the response.',
      '4. Add header on protected routes: `Authorization: Bearer <token>`.',
      '',
      '## Inquiries',
      '- `GET /api/client/inquiries` — list service inquiries for the logged-in client',
      '',
      '## Public client content',
      'Browse feeds and submit inquiries without login via `/api/v1/client-flow/*` (see Super Admin docs).',
      '',
      '## Other API docs',
      '- Super Admin: `/api/docs`',
      '- Manager: `/api/manager/docs`',
    ].join('\n'),
    contact: { name: 'Just Tap API Support', email: 'admin@justtap.com' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local development' },
    { url: '/', description: 'Current host' },
  ],
  tags: allTags.filter((tag) => isClientPortalTag(tag.name)),
  paths: prefixClientApiPaths(clientPortalPaths),
  components,
  security: [{ bearerAuth: [] }],
});

const buildOpenApiSpec = () => ({
  openapi: '3.0.3',
  info: {
    title: 'Just Tap API (Combined)',
    version: '1.0.0',
    description: 'Combined OpenAPI spec. Use `/api/docs` (Admin), `/api/manager/docs` (Manager), or `/api/client/docs` (Client).',
    contact: { name: 'Just Tap API Support', email: 'admin@justtap.com' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: '/api/v1', description: 'Super Admin API v1 (relative to host)' },
    { url: 'http://localhost:3000/api/v1', description: 'Super Admin local development' },
    { url: '/api/manager', description: 'Manager API (relative to host)' },
    { url: 'http://localhost:3000/api/manager', description: 'Manager local development' },
    { url: '/api/client', description: 'Client API (relative to host)' },
    { url: 'http://localhost:3000/api/client', description: 'Client local development' },
  ],
  tags: allTags,
  paths: {
    ...healthPaths,
    ...adminApiPaths,
    ...managerPortalPaths,
    ...prefixClientApiPaths(clientPortalPaths),
  },
  components,
  security: [{ bearerAuth: [] }],
});

module.exports = buildOpenApiSpec;
module.exports.buildAdminOpenApiSpec = buildAdminOpenApiSpec;
module.exports.buildManagerOpenApiSpec = buildManagerOpenApiSpec;
module.exports.buildClientOpenApiSpec = buildClientOpenApiSpec;
module.exports.buildOpenApiSpec = buildOpenApiSpec;
