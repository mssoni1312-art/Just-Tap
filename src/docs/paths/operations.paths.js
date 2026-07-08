const {
  AUTH, PUBLIC, op, jsonBody, idParam, paginationParams, exportParams, importBody, bulkIdsBody,
} = require('../helpers');

const tasksPaths = {
  '/tasks/summary': {
    get: op('get', ['Tasks'], 'Task summary counts', { operationId: 'tasksSummary' }),
  },
  '/tasks/assignments': {
    get: op('get', ['Tasks'], 'List task-to-manager assignments', {
      operationId: 'tasksAssignmentsList',
      description:
        'Returns event tasks with the manager each task is assigned to (`assignedTo`, `assigneeName`). Supports filtering by event, manager, status, or unassigned tasks.',
      parameters: paginationParams([
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'assigned', 'in_progress', 'completed', 'overdue'] } },
        { name: 'eventId', in: 'query', schema: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }] } },
        { name: 'assignedTo', in: 'query', schema: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }], description: 'Manager staff ID' } },
        { name: 'unassigned', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
        { name: 'search', in: 'query', schema: { type: 'string', description: 'Search task title, description, or manager name' } },
      ]),
      responseSchema: 'PaginatedList',
    }),
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
      description: 'Returns active event managers (`staff` with role `event_manager`). Captain is the same role — use this endpoint for both captain and manager dropdowns on create event step 4. Use `forSelect=true` for an unpaginated list sorted by name (multi-select dropdowns). Supports pagination and search by name.',
      parameters: paginationParams([
        { name: 'includeInactive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
        { name: 'forSelect', in: 'query', schema: { type: 'string', enum: ['true', 'false'] }, description: 'Return all matching managers as `{ items }` without pagination' },
      ]),
      responseSchema: 'PaginatedList',
    }),
    post: op('post', ['Managers'], 'Allocate new manager', {
      operationId: 'managersCreate',
      description:
        'Creates a new event manager (`staff` with role `event_manager`) from the **Allocate New Member** modal or captain quick-add. Send `memberName` and `designation`.',
      requestBody: jsonBody('CreateManagerRequest', true, {
        memberName: 'Julian Reed',
        designation: 'Content Strategist',
        email: 'manager@example.com',
        password: 'secret123',
      }),
      responseSchema: 'Staff',
      successDescription: 'Manager created',
      created: true,
    }),
  },
  '/managers/{id}/register': {
    post: op('post', ['Managers'], 'Register manager portal login', {
      operationId: 'managersRegister',
      description: [
        'Creates a manager portal user account linked to an existing event manager staff record.',
        'Super admin sets the login email (username) and password here.',
        'The manager then signs in via `POST /api/manager/auth/login` using the same email as `identifier` and the password set here.',
      ].join('\n'),
      parameters: [idParam('id', 'Manager staff ID (numeric or UUID)')],
      requestBody: jsonBody('RegisterManagerRequest', true, {
        email: 'manager@example.com',
        password: 'secret123',
      }),
      responseSchema: 'Staff',
      successDescription: 'Manager registered successfully',
      created: true,
    }),
  },
};

const clientPaths = {
  '/clients': {
    get: op('get', ['Clients'], 'List clients (dropdown)', {
      operationId: 'clientsList',
      description: [
        '**Create Event — Client Name dropdown**',
        '',
        'Call with `forSelect=true` to load all clients sorted by name (recommended for the dropdown).',
        'Optional `search` filters by client name, caterer name, or contact number.',
        '',
        '**Example:** `GET /clients?forSelect=true&search=testy`',
      ].join('\n'),
      parameters: paginationParams([
        {
          name: 'forSelect',
          in: 'query',
          required: false,
          schema: { type: 'string', enum: ['true', 'false'], default: 'true' },
          description: 'Set to `true` for dropdown list (`{ items: Client[] }`, no pagination)',
        },
      ]),
      responseSchema: 'ClientSelectList',
      successDescription: 'Client list',
    }),
    post: op('post', ['Clients'], 'Create client (quick-add)', {
      operationId: 'clientsCreate',
      description: [
        '**Create Event — Add Client (+) modal**',
        '',
        'Adds a new client to the database. Only `name` is required when using the quick-add modal.',
        'Other fields (`catererName`, `cityName`, `contactNo`, `reference`) are optional and can be filled on the event form later.',
        '',
        'Use the returned `id` as `clientId` when creating the event.',
      ].join('\n'),
      requestBody: jsonBody('CreateClientRequest', true, { name: 'testy' }),
      responseSchema: 'Client',
      successDescription: 'Client created',
      created: true,
    }),
  },
  '/clients/{id}': {
    get: op('get', ['Clients'], 'Get client by ID', {
      operationId: 'clientsGetById',
      description: 'Returns a single client record by numeric ID or UUID.',
      parameters: [idParam()],
      responseSchema: 'Client',
      successDescription: 'Client details',
    }),
  },
};

const functionNamePaths = {
  '/function-names': {
    get: op('get', ['Function Names'], 'List function names (dropdown)', {
      operationId: 'functionNamesList',
      description: [
        '**Create Event — Select Function dropdown**',
        '',
        'Call with `forSelect=true` to load all active function names sorted by `sortOrder` then name (recommended for the dropdown).',
        'Optional `search` filters by name.',
        '',
        '**Example:** `GET /function-names?forSelect=true`',
      ].join('\n'),
      parameters: paginationParams([
        {
          name: 'forSelect',
          in: 'query',
          required: false,
          schema: { type: 'string', enum: ['true', 'false'], default: 'true' },
          description: 'Set to `true` for dropdown list (`{ items: FunctionName[] }`, no pagination)',
        },
        { name: 'includeInactive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
      ]),
      responseSchema: 'FunctionNameSelectList',
      successDescription: 'Function name list',
    }),
    post: op('post', ['Function Names'], 'Add function name (quick-add)', {
      operationId: 'functionNamesCreate',
      description: [
        '**Create Event — Add Function (+) button**',
        '',
        'Adds a new function name to the database. Only `name` is required.',
        'Use the returned `name` when adding a function to an event.',
      ].join('\n'),
      requestBody: jsonBody('CreateFunctionNameRequest', true, { name: 'Reception' }),
      responseSchema: 'FunctionName',
      successDescription: 'Function name created',
      created: true,
    }),
  },
  '/function-names/{id}': {
    get: op('get', ['Function Names'], 'Get function name by ID', {
      operationId: 'functionNamesGetById',
      parameters: [idParam()],
      responseSchema: 'FunctionName',
      successDescription: 'Function name details',
    }),
    patch: op('patch', ['Function Names'], 'Update function name', {
      operationId: 'functionNamesUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('UpdateFunctionNameRequest'),
      responseSchema: 'FunctionName',
      successDescription: 'Function name updated',
    }),
    delete: op('delete', ['Function Names'], 'Delete function name', {
      operationId: 'functionNamesDelete',
      parameters: [idParam()],
      successDescription: 'Function name deleted',
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
        { name: 'role', in: 'query', schema: { type: 'string', enum: ['event_manager', 'waiter', 'other'] } },
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

const feedbackQuestionPaths = {
  '/feedback-questions': {
    get: op('get', ['Feedback Questionnaire'], 'List feedback questions', {
      operationId: 'feedbackQuestionsList',
      description: 'List admin-managed dynamic feedback questions. Filter by eventId for event-specific questions, or scope=global for global questions.',
      parameters: paginationParams([
        { name: 'eventId', in: 'query', schema: { type: 'string' }, description: 'Filter by event ID or UUID' },
        { name: 'scope', in: 'query', schema: { type: 'string', enum: ['global'] }, description: 'Return only global questions (no event)' },
        { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
      ]),
      responseSchema: 'PaginatedList',
    }),
    post: op('post', ['Feedback Questionnaire'], 'Create feedback question', {
      operationId: 'feedbackQuestionsCreate',
      requestBody: jsonBody('CreateFeedbackQuestionRequest'),
      responseSchema: 'FeedbackQuestion',
      successDescription: 'Question created',
    }),
  },
  '/feedback-questions/reorder': {
    patch: op('patch', ['Feedback Questionnaire'], 'Reorder feedback questions', {
      operationId: 'feedbackQuestionsReorder',
      requestBody: jsonBody('ReorderFeedbackQuestionsRequest'),
      successDescription: 'Questions reordered',
    }),
  },
  '/feedback-questions/bulk-delete': {
    post: op('post', ['Feedback Questionnaire'], 'Bulk delete feedback questions', {
      operationId: 'feedbackQuestionsBulkDelete',
      requestBody: bulkIdsBody(),
    }),
  },
  '/feedback-questions/{id}': {
    get: op('get', ['Feedback Questionnaire'], 'Get feedback question by ID', {
      operationId: 'feedbackQuestionsGetById',
      parameters: [idParam()],
      responseSchema: 'FeedbackQuestion',
    }),
    patch: op('patch', ['Feedback Questionnaire'], 'Update feedback question', {
      operationId: 'feedbackQuestionsUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('UpdateFeedbackQuestionRequest'),
      responseSchema: 'FeedbackQuestion',
    }),
    delete: op('delete', ['Feedback Questionnaire'], 'Delete feedback question', {
      operationId: 'feedbackQuestionsDelete',
      parameters: [idParam()],
    }),
  },
  '/public/feedback-questions': {
    get: op('get', ['Feedback Questionnaire'], 'Get active feedback questions (public)', {
      operationId: 'publicFeedbackQuestionsList',
      security: PUBLIC,
      description: 'Public endpoint for guest/consumer app. Returns active global + event-specific questions ordered by sortOrder.',
      parameters: [
        { name: 'eventId', in: 'query', required: true, schema: { type: 'string' }, description: 'Event ID or UUID' },
      ],
      responseSchema: 'FeedbackQuestionList',
    }),
  },
  '/public/events/{eventId}/feedback-questions': {
    get: op('get', ['Feedback Questionnaire'], 'Get active feedback questions for event (public)', {
      operationId: 'publicEventFeedbackQuestionsList',
      security: PUBLIC,
      parameters: [idParam('eventId')],
      responseSchema: 'FeedbackQuestionList',
    }),
  },
  '/public/feedback-submissions': {
    post: op('post', ['Feedback Questionnaire'], 'Submit feedback questionnaire responses (public)', {
      operationId: 'publicFeedbackSubmissionsCreate',
      security: PUBLIC,
      requestBody: jsonBody('SubmitFeedbackQuestionnaireRequest'),
      responseSchema: 'FeedbackSubmission',
      successDescription: 'Feedback submitted',
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
  '/uploads/videos': {
    post: {
      tags: ['Uploads'],
      summary: 'Upload video',
      operationId: 'uploadsVideo',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: { type: 'string', format: 'binary', description: 'MP4, MOV, WebM, M4V' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Video uploaded',
          content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/SuccessResponse' }, { properties: { data: { $ref: '#/components/schemas/UploadResponse' } } }] } } },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
};

const teamTypeParam = {
  name: 'teamType',
  in: 'path',
  required: true,
  schema: { type: 'string', enum: ['justTap', 'justSocial', 'photoVideo'] },
  description: 'Team allocation board (`justTap`, `justSocial`, or `photoVideo`)',
};

const staffIdParam = {
  name: 'staffId',
  in: 'path',
  required: true,
  schema: { $ref: '#/components/schemas/IdParam' },
  description: 'Manager staff ID (numeric or UUID)',
};

const teamAllocationPaths = {
  '/team-allocations/{teamType}': {
    get: op('get', ['Team Allocation'], 'List team allocation board', {
      operationId: 'teamAllocationsGet',
      description:
        'Returns event managers on the team allocation board for the given team type, including assignment pill labels per member.',
      parameters: [teamTypeParam],
      responseSchema: 'TeamAllocationSummary',
    }),
  },
  '/team-allocations/{teamType}/staff/{staffId}/report': {
    get: op('get', ['Team Allocation'], 'Manager report (manager details screen)', {
      operationId: 'teamAllocationStaffReport',
      description:
        'Returns the **Manager Report** screen payload for a manager staff member: profile, efficiency score, stats, **assignedTables** (table numbers assigned to this manager via the "Select tables to assign" screen), done/pending tasks, and activity timeline. Task metrics are filtered by team type.',
      parameters: [teamTypeParam, staffIdParam],
      responseSchema: 'ManagerStaffReport',
      successDescription: 'Manager report with assigned table list',
    }),
  },
  '/team-allocations/{teamType}/staff/{staffId}/tasks': {
    get: op('get', ['Team Allocation'], 'List assigned tasks for manager', {
      operationId: 'teamAllocationStaffTasks',
      description:
        'Returns all assigned operational tasks for this manager on the given team board, with **summary** counts (total, completed, pending). Use on the admin manager view screen to review task progress.',
      parameters: [teamTypeParam, staffIdParam],
      responseSchema: 'TeamAllocationStaffTasks',
      successDescription: 'Assigned tasks with completed/pending summary for manager',
    }),
  },
  '/team-allocations/{teamType}/staff/{staffId}/tasks/assign': {
    post: op('post', ['Team Allocation'], 'Assign tasks to manager from allocation board', {
      operationId: 'teamAllocationAssignTasks',
      parameters: [teamTypeParam, staffIdParam],
      requestBody: jsonBody('AssignTeamTasksRequest', true, {
        tasks: [{ title: 'Just Social', description: 'Promote on Instagram', due_date: '2026-07-10' }],
      }),
      responseSchema: 'TeamAllocationStaffTasks',
      successDescription: 'Tasks assigned; returns updated assigned task list for this manager',
    }),
  },
};

module.exports = {
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
};
