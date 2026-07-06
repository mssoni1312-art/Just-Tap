const {
  AUTH, PUBLIC, op, jsonBody, idParam, paginationParams,
} = require('../helpers');
const reportPaths = require('./report.paths');

const MANAGER_TAG = 'Manager';
const MANAGER_REPORT_TAG = 'Manager Report';
const MANAGER_TABLES_TAG = 'Manager Tables';
const MANAGER_ORDERS_TAG = 'Manager Orders';

const eventIdParam = {
  name: 'eventId',
  in: 'path',
  required: true,
  schema: { $ref: '#/components/schemas/IdParam' },
  description: 'Event ID (numeric or UUID)',
};

const prefixManagerReportPaths = () => {
  const result = {};
  for (const [path, methods] of Object.entries(reportPaths)) {
    const transformed = {};
    for (const [method, operation] of Object.entries(methods)) {
      transformed[method] = {
        ...operation,
        tags: [MANAGER_TAG, MANAGER_REPORT_TAG],
        operationId: `manager${operation.operationId.charAt(0).toUpperCase()}${operation.operationId.slice(1)}`,
      };
    }
    result[path] = transformed;
  }
  return result;
};

const managerAuthPaths = {
  '/auth/login': {
    post: op('post', [MANAGER_TAG, 'Manager Auth'], 'Manager login', {
      operationId: 'managerAuthLogin',
      security: PUBLIC,
      requestBody: jsonBody('LoginRequest', true),
      responseSchema: 'LoginResponse',
      successDescription: 'Manager login successful',
    }),
  },
  '/auth/logout': {
    post: op('post', [MANAGER_TAG, 'Manager Auth'], 'Manager logout', {
      operationId: 'managerAuthLogout',
      requestBody: jsonBody('RefreshTokenRequest'),
    }),
  },
  '/auth/token/refresh': {
    post: op('post', [MANAGER_TAG, 'Manager Auth'], 'Refresh manager access token', {
      operationId: 'managerAuthRefresh',
      security: PUBLIC,
      requestBody: jsonBody('RefreshTokenRequest'),
      responseSchema: 'LoginResponse',
    }),
  },
  '/auth/me': {
    get: op('get', [MANAGER_TAG, 'Manager Auth'], 'Get current manager profile', {
      operationId: 'managerAuthMe',
      responseSchema: 'User',
    }),
  },
  '/auth/password/forgot': {
    post: op('post', [MANAGER_TAG, 'Manager Auth'], 'Forgot password', {
      operationId: 'managerForgotPassword',
      security: PUBLIC,
      requestBody: jsonBody('ForgotPasswordRequest'),
    }),
  },
  '/auth/password/reset': {
    post: op('post', [MANAGER_TAG, 'Manager Auth'], 'Reset password', {
      operationId: 'managerResetPassword',
      security: PUBLIC,
      requestBody: jsonBody('ResetPasswordRequest'),
    }),
  },
};

const managerDashboardPaths = {
  '/dashboard/home': {
    get: op('get', [MANAGER_TAG, 'Manager Dashboard'], 'Manager dashboard home stats', {
      operationId: 'managerDashboardHome',
      successDescription: 'Scoped stats for allocated events only',
    }),
  },
};

const managerEventPaths = {
  '/events': {
    get: op('get', [MANAGER_TAG, 'Manager Events'], 'List manager events', {
      operationId: 'managerEventsList',
      parameters: paginationParams([
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
      ]),
    }),
    post: op('post', [MANAGER_TAG, 'Manager Events'], 'Create event (auto-assigns manager)', {
      operationId: 'managerEventsCreate',
      requestBody: jsonBody('CreateManagerEventRequest'),
      created: true,
    }),
  },
  '/events/calendar': {
    get: op('get', [MANAGER_TAG, 'Manager Events'], 'Calendar (month/week/day)', {
      operationId: 'managerEventsCalendar',
      parameters: [
        { name: 'year', in: 'query', schema: { type: 'integer' } },
        { name: 'month', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 12 } },
        { name: 'weekStart', in: 'query', schema: { type: 'string', format: 'date' } },
        { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
      ],
    }),
  },
  '/events/today': {
    get: op('get', [MANAGER_TAG, 'Manager Events'], "Today's events", { operationId: 'managerEventsToday' }),
  },
  '/events/upcoming': {
    get: op('get', [MANAGER_TAG, 'Manager Events'], 'Upcoming events', { operationId: 'managerEventsUpcoming' }),
  },
  '/events/completed': {
    get: op('get', [MANAGER_TAG, 'Manager Events'], 'Completed events', {
      operationId: 'managerEventsCompleted',
      parameters: paginationParams(),
    }),
  },
  '/events/cancelled': {
    get: op('get', [MANAGER_TAG, 'Manager Events'], 'Cancelled events', {
      operationId: 'managerEventsCancelled',
      parameters: paginationParams(),
    }),
  },
  '/events/{eventId}/tables': {
    get: op('get', [MANAGER_TAG, MANAGER_TABLES_TAG], 'Get assign table list for manager event', {
      operationId: 'managerEventTablesGet',
      description:
        'Returns dining and captain table assignments for an event allocated to the authenticated manager. The manager staff ID is resolved from the bearer token (`req.managerStaffId`); the event must be assigned to that manager via `assigned_manager_id` or `event_manager_allocations`.',
      parameters: [eventIdParam],
      successDescription: 'Table assignment list for the event',
    }),
  },
  '/events/{eventId}/orders/summary': {
    get: op('get', [MANAGER_TAG, MANAGER_ORDERS_TAG], 'Order summary for manager event', {
      operationId: 'managerEventOrdersSummary',
      description: 'Order stats for an event. Enforces manager event ownership via `assertManagerOwnsEvent`.',
      parameters: [eventIdParam],
    }),
  },
  '/events/{eventId}/orders/tables': {
    get: op('get', [MANAGER_TAG, MANAGER_ORDERS_TAG], 'Orders grouped by table', {
      operationId: 'managerEventOrdersTables',
      description: 'Table list with waiter assignments. Enforces manager event ownership via `assertManagerOwnsEvent`.',
      parameters: [eventIdParam],
    }),
  },
  '/events/{eventId}/orders/tables/{tableNumber}': {
    get: op('get', [MANAGER_TAG, MANAGER_ORDERS_TAG], 'Order detail for a table', {
      operationId: 'managerEventOrdersTableDetail',
      description: 'Line items for a single table. Enforces manager event ownership via `assertManagerOwnsEvent`.',
      parameters: [
        eventIdParam,
        { name: 'tableNumber', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'category', in: 'query', schema: { type: 'string' } },
      ],
    }),
  },
  '/events/{eventId}/orders/report': {
    get: op('get', [MANAGER_TAG, MANAGER_ORDERS_TAG], 'Export order report', {
      operationId: 'managerEventOrdersReport',
      description: 'Download order report (JSON or CSV). Enforces manager event ownership via `assertManagerOwnsEvent`.',
      parameters: [
        eventIdParam,
        { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'], default: 'json' } },
      ],
      extraResponses: {
        200: {
          description: 'Order report',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } },
            'text/csv': { schema: { type: 'string' } },
          },
        },
      },
    }),
  },
  '/events/{eventId}/manager-cost': {
    get: op('get', [MANAGER_TAG, 'Manager Events'], 'Get manager cost breakdown', {
      operationId: 'managerEventManagerCostGet',
      description: 'Returns saved cost fields for the Cost of Manager screen. When nothing has been saved yet, returns empty values with `filled: false`.',
      parameters: [eventIdParam],
      responseSchema: 'EventManagerCost',
    }),
    put: op('put', [MANAGER_TAG, 'Manager Events'], 'Save manager cost breakdown', {
      operationId: 'managerEventManagerCostSave',
      description: 'Upserts cost fields for the Cost of Manager screen. `totalCost` is calculated server-side from the individual amounts.',
      parameters: [eventIdParam],
      requestBody: jsonBody('SaveManagerCostRequest', true),
      responseSchema: 'EventManagerCost',
    }),
  },
  '/events/{eventId}/all-tasks': {
    get: op('get', [MANAGER_TAG, 'Manager Tasks'], 'Get All Tasks screen payload', {
      operationId: 'managerEventAllTasksGet',
      description:
        'Returns the **All Tasks** screen for an event: reporting time, follower/reel progress, videography/photography tracking, billing collection, and attachments. Targets are derived from event configuration.',
      parameters: [eventIdParam],
      responseSchema: 'ManagerAllTasksResponse',
    }),
    patch: op('patch', [MANAGER_TAG, 'Manager Tasks'], 'Save All Tasks progress', {
      operationId: 'managerEventAllTasksUpdate',
      parameters: [eventIdParam],
      requestBody: jsonBody('UpdateManagerAllTasksRequest'),
      responseSchema: 'ManagerAllTasksResponse',
    }),
  },
  '/events/{eventId}/all-tasks/complete': {
    post: op('post', [MANAGER_TAG, 'Manager Tasks'], 'Mark All Tasks as completed', {
      operationId: 'managerEventAllTasksComplete',
      parameters: [eventIdParam],
      responseSchema: 'ManagerAllTasksResponse',
    }),
  },
  '/events/{eventId}/all-tasks/abandon': {
    post: op('post', [MANAGER_TAG, 'Manager Tasks'], 'Abandon All Tasks workflow', {
      operationId: 'managerEventAllTasksAbandon',
      parameters: [eventIdParam],
      responseSchema: 'ManagerAllTasksResponse',
    }),
  },
  '/events/{eventId}/all-tasks/attachments': {
    post: op('post', [MANAGER_TAG, 'Manager Tasks'], 'Upload All Tasks attachment', {
      operationId: 'managerEventAllTasksUploadAttachment',
      parameters: [eventIdParam],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: { file: { type: 'string', format: 'binary' } },
            },
          },
        },
      },
      responseSchema: 'ManagerAllTaskAttachment',
      created: true,
    }),
  },
  '/events/{eventId}/all-tasks/attachments/{attachmentId}': {
    delete: op('delete', [MANAGER_TAG, 'Manager Tasks'], 'Delete All Tasks attachment', {
      operationId: 'managerEventAllTasksDeleteAttachment',
      parameters: [
        eventIdParam,
        {
          name: 'attachmentId',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/IdParam' },
        },
      ],
    }),
  },
  '/events/{id}': {
    get: op('get', [MANAGER_TAG, 'Manager Events'], 'Event details', {
      operationId: 'managerEventsGetById',
      parameters: [idParam()],
    }),
    patch: op('patch', [MANAGER_TAG, 'Manager Events'], 'Update event', {
      operationId: 'managerEventsUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('CreateManagerEventRequest'),
    }),
    delete: op('delete', [MANAGER_TAG, 'Manager Events'], 'Delete event', {
      operationId: 'managerEventsDelete',
      parameters: [idParam()],
    }),
  },
};

const managerMenuPaths = {
  '/menu/categories': {
    get: op('get', [MANAGER_TAG, 'Manager Menu'], 'List categories', {
      operationId: 'managerMenuCategoriesList',
      parameters: paginationParams(),
      responseSchema: 'PaginatedMenuCategoryList',
    }),
    post: op('post', [MANAGER_TAG, 'Manager Menu'], 'Create category', {
      operationId: 'managerMenuCategoriesCreate',
      requestBody: jsonBody('CreateMenuCategoryRequest'),
      responseSchema: 'MenuCategory',
      created: true,
    }),
  },
  '/menu/categories/{id}': {
    get: op('get', [MANAGER_TAG, 'Manager Menu'], 'Get category by ID', {
      operationId: 'managerMenuCategoriesGetById',
      parameters: [idParam()],
      responseSchema: 'MenuCategory',
    }),
    patch: op('patch', [MANAGER_TAG, 'Manager Menu'], 'Update category', {
      operationId: 'managerMenuCategoriesUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('CreateMenuCategoryRequest'),
      responseSchema: 'MenuCategory',
    }),
    delete: op('delete', [MANAGER_TAG, 'Manager Menu'], 'Delete category', {
      operationId: 'managerMenuCategoriesDelete',
      parameters: [idParam()],
    }),
  },
  '/menu/items': {
    get: op('get', [MANAGER_TAG, 'Manager Menu'], 'List menu items', {
      operationId: 'managerMenuItemsList',
      parameters: paginationParams(),
      responseSchema: 'PaginatedMenuItemList',
    }),
    post: op('post', [MANAGER_TAG, 'Manager Menu'], 'Create menu item', {
      operationId: 'managerMenuItemsCreate',
      requestBody: jsonBody('CreateMenuItemRequest'),
      responseSchema: 'MenuItem',
      created: true,
    }),
  },
  '/menu/items/{id}': {
    get: op('get', [MANAGER_TAG, 'Manager Menu'], 'Get menu item by ID', {
      operationId: 'managerMenuItemsGetById',
      parameters: [idParam()],
      responseSchema: 'MenuItem',
    }),
    patch: op('patch', [MANAGER_TAG, 'Manager Menu'], 'Update menu item', {
      operationId: 'managerMenuItemsUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('CreateMenuItemRequest'),
      responseSchema: 'MenuItem',
    }),
    delete: op('delete', [MANAGER_TAG, 'Manager Menu'], 'Delete menu item', {
      operationId: 'managerMenuItemsDelete',
      parameters: [idParam()],
    }),
  },
  '/menu/packages': {
    get: op('get', [MANAGER_TAG, 'Manager Menu'], 'List packages', { operationId: 'managerMenuPackagesList' }),
  },
};

const managerTaskPaths = {
  '/tasks': {
    get: op('get', [MANAGER_TAG, 'Manager Tasks'], 'List event tasks across manager events', {
      operationId: 'managerTasksList',
      parameters: paginationParams([{ name: 'status', in: 'query', schema: { type: 'string' } }]),
    }),
    post: op('post', [MANAGER_TAG, 'Manager Tasks'], 'Create event task', {
      operationId: 'managerTasksCreate',
      created: true,
    }),
  },
  '/tasks/{id}': {
    get: op('get', [MANAGER_TAG, 'Manager Tasks'], 'Task details', {
      operationId: 'managerTasksGetById',
      parameters: [idParam()],
    }),
    patch: op('patch', [MANAGER_TAG, 'Manager Tasks'], 'Update task', {
      operationId: 'managerTasksUpdate',
      parameters: [idParam()],
    }),
    delete: op('delete', [MANAGER_TAG, 'Manager Tasks'], 'Delete task', {
      operationId: 'managerTasksDelete',
      parameters: [idParam()],
    }),
  },
  '/tasks/{id}/complete': {
    post: op('post', [MANAGER_TAG, 'Manager Tasks'], 'Complete task', {
      operationId: 'managerTasksComplete',
      parameters: [idParam()],
    }),
  },
};

const managerFeedbackPaths = {
  '/feedback': {
    get: op('get', [MANAGER_TAG, 'Manager Feedback'], 'List feedback across manager events', {
      operationId: 'managerFeedbackList',
      parameters: paginationParams(),
    }),
  },
  '/feedback/{id}': {
    get: op('get', [MANAGER_TAG, 'Manager Feedback'], 'Feedback details', {
      operationId: 'managerFeedbackGetById',
      parameters: [idParam()],
    }),
  },
};

const managerOrderPaths = {
  '/orders/items/{lineItemId}': {
    get: op('get', [MANAGER_TAG, MANAGER_ORDERS_TAG], 'Get order line item detail', {
      operationId: 'managerOrdersLineItem',
      description:
        'Item details with batch history. Resolves the parent event from the line item and enforces manager event ownership via `assertManagerOwnsEvent`.',
      parameters: [{
        name: 'lineItemId',
        in: 'path',
        required: true,
        schema: { $ref: '#/components/schemas/IdParam' },
      }],
    }),
  },
};

const managerMiscPaths = {
  '/uploads/images': {
    post: op('post', [MANAGER_TAG, 'Manager Uploads'], 'Upload image', {
      operationId: 'managerUploadImage',
      requestBody: {
        required: true,
        content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } },
      },
      created: true,
    }),
  },
  '/me': {
    get: op('get', [MANAGER_TAG, 'Manager Profile'], 'Get manager profile', { operationId: 'managerProfileGet' }),
    patch: op('patch', [MANAGER_TAG, 'Manager Profile'], 'Update manager profile', {
      operationId: 'managerProfileUpdate',
      requestBody: jsonBody('UpdateProfileRequest'),
    }),
  },
};

const prefixPaths = (paths, prefix = '') => {
  const result = {};
  for (const [path, def] of Object.entries(paths)) {
    result[`${prefix}${path}`] = def;
  }
  return result;
};

module.exports = {
  ...prefixPaths(managerAuthPaths),
  ...prefixPaths(managerDashboardPaths),
  ...prefixPaths(managerEventPaths),
  ...prefixPaths(managerMenuPaths),
  ...prefixPaths(managerTaskPaths),
  ...prefixPaths(managerFeedbackPaths),
  ...prefixPaths(managerOrderPaths),
  ...prefixPaths(managerMiscPaths),
  ...prefixManagerReportPaths(),
};
