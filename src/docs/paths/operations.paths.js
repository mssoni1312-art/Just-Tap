const {
  op, jsonBody, idParam, paginationParams, exportParams, importBody, bulkIdsBody,
} = require('../helpers');

const tasksPaths = {
  '/tasks/summary': {
    get: op('get', ['Tasks'], 'Task summary counts', { operationId: 'tasksSummary' }),
  },
  '/tasks/export': {
    get: op('get', ['Tasks'], 'Export task templates', {
      operationId: 'tasksExport',
      parameters: exportParams(),
    }),
  },
  '/tasks': {
    get: op('get', ['Tasks'], 'List task templates', {
      operationId: 'tasksList',
      parameters: paginationParams([{ name: 'category', in: 'query', schema: { type: 'string' } }]),
      responseSchema: 'PaginatedList',
    }),
    post: op('post', ['Tasks'], 'Create task template', {
      operationId: 'tasksCreate',
      requestBody: jsonBody('CreateTaskRequest'),
      successDescription: 'Task template created',
    }),
  },
  '/tasks/bulk-delete': {
    post: op('post', ['Tasks'], 'Bulk delete task templates', {
      operationId: 'tasksBulkDelete',
      requestBody: bulkIdsBody(),
    }),
  },
  '/tasks/{id}': {
    get: op('get', ['Tasks'], 'Get task template by ID', {
      operationId: 'tasksGetById',
      parameters: [idParam()],
      responseSchema: 'TaskTemplate',
    }),
    patch: op('patch', ['Tasks'], 'Update task template', {
      operationId: 'tasksUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('CreateTaskRequest'),
    }),
    delete: op('delete', ['Tasks'], 'Delete task template', {
      operationId: 'tasksDelete',
      parameters: [idParam()],
    }),
  },
};

const managerPaths = {
  '/managers': {
    get: op('get', ['Managers'], 'List event managers', {
      operationId: 'managersList',
      description: 'Returns active event managers (`staff` with role `event_manager`). Supports pagination and search by name.',
      parameters: paginationParams([
        { name: 'includeInactive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
      ]),
      responseSchema: 'PaginatedList',
    }),
  },
};

const staffPaths = {
  '/staff/export': {
    get: op('get', ['Staff'], 'Export staff', {
      operationId: 'staffExport',
      parameters: exportParams(),
    }),
  },
  '/staff/import': {
    post: op('post', ['Staff'], 'Import staff from CSV or JSON', {
      operationId: 'staffImport',
      requestBody: importBody(),
    }),
  },
  '/staff': {
    get: op('get', ['Staff'], 'List staff', {
      operationId: 'staffList',
      parameters: paginationParams([
        { name: 'role', in: 'query', schema: { type: 'string', enum: ['event_manager', 'waiter', 'captain', 'other'] } },
        { name: 'includeInactive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
      ]),
      responseSchema: 'PaginatedList',
    }),
    post: op('post', ['Staff'], 'Create staff member', {
      operationId: 'staffCreate',
      requestBody: jsonBody('CreateStaffRequest'),
      successDescription: 'Staff created',
    }),
  },
  '/staff/bulk-delete': {
    post: op('post', ['Staff'], 'Bulk delete staff', {
      operationId: 'staffBulkDelete',
      requestBody: bulkIdsBody(),
    }),
  },
  '/staff/bulk-update': {
    patch: op('patch', ['Staff'], 'Bulk update staff', {
      operationId: 'staffBulkUpdate',
      requestBody: jsonBody('BulkUpdateStaffRequest', true, { ids: [1], isActive: false }),
    }),
  },
  '/staff/{id}': {
    get: op('get', ['Staff'], 'Get staff by ID', {
      operationId: 'staffGetById',
      parameters: [idParam()],
      responseSchema: 'Staff',
    }),
    patch: op('patch', ['Staff'], 'Update staff', {
      operationId: 'staffUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('CreateStaffRequest'),
    }),
    delete: op('delete', ['Staff'], 'Delete staff', {
      operationId: 'staffDelete',
      parameters: [idParam()],
    }),
  },
};

const feedbackPaths = {
  '/feedback/bulk-delete': {
    post: op('post', ['Feedback'], 'Bulk delete feedback', {
      operationId: 'feedbackBulkDelete',
      requestBody: bulkIdsBody(),
    }),
  },
  '/feedback/bulk-flag': {
    post: op('post', ['Feedback'], 'Bulk flag feedback', {
      operationId: 'feedbackBulkFlag',
      requestBody: bulkIdsBody(),
    }),
  },
  '/feedback/{id}/reply': {
    post: op('post', ['Feedback'], 'Reply to feedback', {
      operationId: 'feedbackReply',
      parameters: [idParam()],
      requestBody: jsonBody('FeedbackReplyRequest'),
      successDescription: 'Reply saved',
    }),
  },
  '/feedback/{id}/flag': {
    post: op('post', ['Feedback'], 'Flag feedback for review', {
      operationId: 'feedbackFlag',
      parameters: [idParam()],
      successDescription: 'Feedback flagged',
    }),
  },
};

const ordersPaths = {
  '/orders/items/{lineItemId}': {
    get: op('get', ['Orders'], 'Get order line item detail', {
      operationId: 'ordersLineItem',
      parameters: [{
        name: 'lineItemId',
        in: 'path',
        required: true,
        schema: { $ref: '#/components/schemas/IdParam' },
      }],
    }),
  },
};

const activityPaths = {
  '/activity/recent': {
    get: op('get', ['Activity'], 'Recent activity feed', {
      operationId: 'activityRecent',
      responseSchema: 'ActivityLog',
    }),
  },
  '/activity/events/{eventId}': {
    get: op('get', ['Activity'], 'Activity log for event', {
      operationId: 'activityByEvent',
      parameters: [{
        name: 'eventId',
        in: 'path',
        required: true,
        schema: { $ref: '#/components/schemas/IdParam' },
      }],
      responseSchema: 'ActivityLog',
    }),
  },
};

const miscPaths = {
  '/analytics/sales': {
    get: op('get', ['Analytics'], 'Sales analytics data', { operationId: 'analyticsSales' }),
  },
  '/analytics/menu-report': {
    get: op('get', ['Analytics'], 'Menu item served analytics report', {
      operationId: 'analyticsMenuReport',
      parameters: [
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'category', in: 'query', schema: { type: 'string' } },
      ],
    }),
  },
  '/content/about': {
    get: op('get', ['Content'], 'About page content', { operationId: 'contentAbout' }),
  },
  '/content/contact': {
    get: op('get', ['Content'], 'Contact page content', { operationId: 'contentContact' }),
  },
  '/uploads/images': {
    post: {
      tags: ['Uploads'],
      summary: 'Upload image',
      operationId: 'uploadsImage',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: { type: 'string', format: 'binary', description: 'JPEG, PNG, WebP, GIF' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Image uploaded',
          content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/UploadResponse' } } }] } } },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/uploads/documents': {
    post: {
      tags: ['Uploads'],
      summary: 'Upload document',
      operationId: 'uploadsDocument',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: { type: 'string', format: 'binary', description: 'PDF, DOC, DOCX, JPEG, PNG' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Document uploaded',
          content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/UploadResponse' } } }] } } },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
};

module.exports = {
  tasksPaths,
  managerPaths,
  staffPaths,
  feedbackPaths,
  ordersPaths,
  activityPaths,
  miscPaths,
};
