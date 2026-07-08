const {
  op, jsonBody, idParam, paginationParams, exportParams, importBody, bulkIdsBody, PUBLIC,
} = require('../helpers');

const eventIdParam = {
  name: 'eventId',
  in: 'path',
  required: true,
  schema: { $ref: '#/components/schemas/IdParam' },
  description: 'Event ID (numeric or UUID)',
};

const eventListParams = paginationParams([
  { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/EventStatus' } },
  { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
  { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
]);

const eventsPaths = {
  '/events/meta': {
    get: op('get', ['Events'], 'Event status metadata and filter options', { operationId: 'eventsMeta' }),
  },
  '/events/calendar': {
    get: op('get', ['Events'], 'Calendar view by month', {
      operationId: 'eventsCalendar',
      parameters: [
        { name: 'year', in: 'query', schema: { type: 'integer', example: 2026 } },
        { name: 'month', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 12, example: 8 } },
      ],
    }),
  },
  '/events/today': {
    get: op('get', ['Events'], "Today's events (includes assigned manager names)", {
      operationId: 'eventsToday',
      responseSchema: 'EventListItemsArray',
    }),
  },
  '/events/upcoming': {
    get: op('get', ['Events'], 'Upcoming events (includes assigned manager names)', {
      operationId: 'eventsUpcoming',
      responseSchema: 'EventListItemsArray',
    }),
  },
  '/events/export': {
    get: op('get', ['Events'], 'Export events', {
      operationId: 'eventsExport',
      parameters: exportParams(),
      extraResponses: {
        200: {
          description: 'CSV or JSON export',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } },
            'text/csv': { schema: { type: 'string' } },
          },
        },
      },
    }),
  },
  '/events': {
    get: op('get', ['Events'], 'List events (includes assigned manager names)', {
      operationId: 'eventsList',
      parameters: eventListParams,
      responseSchema: 'EventListResponse',
    }),
    post: op('post', ['Events'], 'Create event', {
      operationId: 'eventsCreate',
      requestBody: jsonBody('CreateEventRequest'),
      created: true,
      successDescription: 'Event created',
    }),
  },
  '/events/bulk-delete': {
    post: op('post', ['Events'], 'Bulk soft-delete events', {
      operationId: 'eventsBulkDelete',
      requestBody: bulkIdsBody(),
    }),
  },
  '/events/bulk-update': {
    patch: op('patch', ['Events'], 'Bulk update event status', {
      operationId: 'eventsBulkUpdate',
      requestBody: jsonBody('BulkUpdateEventsRequest', true, { ids: [1], status: 'confirmed' }),
    }),
  },
  '/events/{id}': {
    get: op('get', ['Events'], 'Get event by ID', {
      operationId: 'eventsGetById',
      parameters: [idParam()],
      responseSchema: 'EventDetail',
    }),
    patch: op('patch', ['Events'], 'Update event', {
      operationId: 'eventsUpdate',
      parameters: [idParam()],
      requestBody: jsonBody('CreateEventRequest'),
    }),
    delete: op('delete', ['Events'], 'Soft-delete event', {
      operationId: 'eventsDelete',
      parameters: [idParam()],
      successDescription: 'Event deleted',
    }),
  },
  '/events/{eventId}/tasks': {
    get: op('get', ['Events', 'Tasks'], 'List tasks for an event', {
      operationId: 'eventTasksList',
      parameters: [eventIdParam, ...paginationParams([{ name: 'category', in: 'query', schema: { type: 'string' } }])],
      responseSchema: 'PaginatedList',
    }),
  },
  '/events/{eventId}/tasks/assign': {
    post: op('post', ['Events', 'Tasks'], 'Assign tasks to event', {
      operationId: 'eventTasksAssign',
      parameters: [eventIdParam],
      requestBody: jsonBody('AssignTasksRequest'),
      successDescription: 'Tasks assigned',
    }),
  },
  '/events/{eventId}/assign-managers': {
    post: op('post', ['Events', 'Managers'], 'Assign event to manager(s)', {
      operationId: 'eventAssignManagers',
      description:
        'Assigns an event to one or more event managers. Updates `event_manager_allocations` and sets the primary `assigned_manager_id` to the first ID in the list. Use `GET /managers?forSelect=true` to populate the manager dropdown.',
      parameters: [eventIdParam],
      requestBody: jsonBody('AssignEventManagersRequest', true, { assignedManagerIds: [1, 2] }),
      successDescription: 'Event assigned to manager(s)',
      responseSchema: 'EventDetail',
    }),
  },
  '/events/{eventId}/functions': {
    post: op('post', ['Events'], 'Add event function', {
      operationId: 'eventFunctionAdd',
      parameters: [eventIdParam],
      requestBody: jsonBody('EventFunction', true, { name: 'Reception', venue: 'Main Hall', date: '2026-08-15' }),
      successDescription: 'Function added',
    }),
  },
  '/events/{eventId}/functions/{functionId}': {
    patch: op('patch', ['Events'], 'Update event function', {
      operationId: 'eventFunctionUpdate',
      parameters: [eventIdParam, { name: 'functionId', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: jsonBody('EventFunction'),
    }),
    delete: op('delete', ['Events'], 'Delete event function', {
      operationId: 'eventFunctionDelete',
      parameters: [eventIdParam, { name: 'functionId', in: 'path', required: true, schema: { type: 'integer' } }],
    }),
  },
  '/events/{eventId}/menu-planning': {
    get: op('get', ['Events', 'Menu'], 'Get menu planning for event', {
      operationId: 'eventMenuPlanningGet',
      parameters: [eventIdParam, { name: 'category', in: 'query', schema: { type: 'string' } }],
    }),
    put: op('put', ['Events', 'Menu'], 'Update menu selections for event', {
      operationId: 'eventMenuPlanningUpdate',
      parameters: [eventIdParam],
      requestBody: jsonBody('MenuPlanningRequest', true, { menuItemIds: [1, 2, 3] }),
    }),
  },
  '/events/{eventId}/tables': {
    get: op('get', ['Events', 'Tables'], 'Get table assignments', {
      operationId: 'eventTablesGet',
      parameters: [eventIdParam],
    }),
    put: op('put', ['Events', 'Tables'], 'Bulk save table assignments', {
      operationId: 'eventTablesBulkSave',
      parameters: [eventIdParam],
      requestBody: jsonBody('BulkTablesRequest'),
    }),
  },
  '/events/{eventId}/tables/{tableNumber}/assign': {
    post: op('post', ['Events', 'Tables'], 'Assign single table', {
      operationId: 'eventTableAssign',
      parameters: [
        eventIdParam,
        { name: 'tableNumber', in: 'path', required: true, schema: { type: 'integer', example: 5 } },
      ],
      requestBody: jsonBody('TableAssignment', true, { tableNumber: 5, allocationType: 'dining' }),
    }),
  },
  '/events/{eventId}/tables/{tableNumber}/assign-manager': {
    post: op('post', ['Events', 'Tables'], 'Assign manager to a table', {
      operationId: 'eventTableAssignManager',
      description:
        'Assigns a single event manager to the selected table — powers the **Assign Access** dialog on the Assign Tables screen. Use `allocationType: dining` for Table View and `captain` for Captain View. The manager must be allocated to the event.',
      parameters: [
        eventIdParam,
        { name: 'tableNumber', in: 'path', required: true, schema: { type: 'integer', example: 4 } },
      ],
      requestBody: jsonBody('AssignTableManagerRequest', true, {
        staffId: 3,
        allocationType: 'dining',
      }),
      successDescription: 'Manager assigned to table',
      responseSchema: 'TableAssignment',
    }),
  },
  '/events/{eventId}/tables/assign-manager': {
    post: op('post', ['Events', 'Tables'], 'Assign tables to a manager (bulk)', {
      operationId: 'eventTablesAssignManager',
      description:
        'Bulk-assigns one or more table numbers to a manager (staff) for an event. Prefer `POST /events/{eventId}/tables/{tableNumber}/assign-manager` for the single-table Assign Access dialog. Assigned tables appear in the Manager Report `assignedTables` list.',
      parameters: [eventIdParam],
      requestBody: jsonBody('AssignManagerTablesRequest', true, {
        staffId: 3,
        tableNumbers: [1, 2, 3],
        allocationType: 'dining',
      }),
      successDescription: 'Tables assigned to manager',
    }),
  },
  '/events/{eventId}/table-allocation': {
    post: op('post', ['Events', 'Tables'], 'Save dining/captain table allocation', {
      operationId: 'eventTableAllocation',
      parameters: [eventIdParam],
      requestBody: jsonBody('TableAllocationRequest', true, { diningTables: [1, 2, 3], captainTables: [10, 11] }),
    }),
  },
  '/events/{eventId}/orders/summary': {
    get: op('get', ['Events', 'Orders'], 'Order summary for event', {
      operationId: 'eventOrdersSummary',
      parameters: [eventIdParam],
    }),
  },
  '/events/{eventId}/orders/tables': {
    get: op('get', ['Events', 'Orders'], 'Orders grouped by table', {
      operationId: 'eventOrdersTables',
      parameters: [eventIdParam],
    }),
  },
  '/events/{eventId}/orders/tables/{tableNumber}': {
    get: op('get', ['Events', 'Orders'], 'Order detail for a table', {
      operationId: 'eventOrdersTableDetail',
      parameters: [
        eventIdParam,
        { name: 'tableNumber', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'category', in: 'query', schema: { type: 'string' } },
      ],
    }),
  },
  '/events/{eventId}/orders/report': {
    get: op('get', ['Events', 'Orders'], 'Export order report', {
      operationId: 'eventOrdersReport',
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
  '/events/{eventId}/feedback': {
    get: op('get', ['Events', 'Feedback'], 'List feedback for event', {
      operationId: 'eventFeedbackList',
      parameters: [
        eventIdParam,
        ...paginationParams([
          { name: 'stars', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 5 } },
          { name: 'sentiment', in: 'query', schema: { type: 'string', enum: ['HAPPY', 'NEUTRAL', 'UNHAPPY'] } },
        ]),
      ],
      responseSchema: 'PaginatedList',
    }),
  },
  '/events/{eventId}/feedback/summary': {
    get: op('get', ['Events', 'Feedback'], 'Feedback summary for event', {
      operationId: 'eventFeedbackSummary',
      parameters: [eventIdParam],
    }),
  },
  '/events/{eventId}/feedback/export': {
    get: op('get', ['Events', 'Feedback'], 'Export feedback for event', {
      operationId: 'eventFeedbackExport',
      parameters: [eventIdParam, ...exportParams().slice(2)],
    }),
  },
  '/events/{eventId}/feedback/questions': {
    get: op('get', ['Events', 'Feedback Questionnaire'], 'List feedback questions for event', {
      operationId: 'eventFeedbackQuestionsList',
      description: 'List admin-configured feedback questions scoped to an event.',
      parameters: [
        eventIdParam,
        ...paginationParams([
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ]),
      ],
      responseSchema: 'PaginatedList',
    }),
    post: op('post', ['Events', 'Feedback Questionnaire'], 'Create feedback question for event', {
      operationId: 'eventFeedbackQuestionsCreate',
      description: 'Create a feedback question for an event. Accepts `questionText` or `question` (alias). Defaults to rating type.',
      parameters: [eventIdParam],
      requestBody: jsonBody('CreateEventFeedbackQuestionRequest'),
      responseSchema: 'FeedbackQuestion',
      successDescription: 'Question created',
    }),
  },
  '/events/{eventId}/feedback/questions/{questionId}': {
    delete: op('delete', ['Events', 'Feedback Questionnaire'], 'Delete event feedback question', {
      operationId: 'eventFeedbackQuestionsDelete',
      parameters: [
        eventIdParam,
        { name: 'questionId', in: 'path', required: true, schema: { $ref: '#/components/schemas/IdParam' }, description: 'Question ID or UUID' },
      ],
    }),
  },
  '/events/{eventId}/feedback-questionnaire/submissions': {
    get: op('get', ['Events', 'Feedback Questionnaire'], 'List questionnaire submissions for event', {
      operationId: 'eventFeedbackQuestionnaireSubmissions',
      parameters: [eventIdParam, ...paginationParams()],
      responseSchema: 'PaginatedList',
    }),
  },
  '/events/{eventId}/billing': {
    get: op('get', ['Events', 'Billing'], 'Get billing & finances for event', {
      operationId: 'eventBillingGet',
      parameters: [eventIdParam],
      responseSchema: 'EventBilling',
    }),
  },
  '/events/{eventId}/billing/preview': {
    get: op('get', ['Events', 'Billing'], 'Get client-visible billing preview', {
      operationId: 'eventBillingClientPreview',
      parameters: [eventIdParam],
      responseSchema: 'EventBillingClientPreview',
      successDescription: 'Billing visible in client app when showToClient is enabled',
    }),
  },
  '/events/{eventId}/billing/save-preview': {
    put: op('put', ['Events', 'Billing'], 'Save billing and publish to client app preview', {
      operationId: 'eventBillingSavePreview',
      parameters: [eventIdParam],
      requestBody: jsonBody('SaveBillingPreviewRequest', true, {
        showToClient: true,
        functions: [
          {
            name: 'Sangeet',
            description: 'Evening sangeet function',
            date: '2026-07-06',
            startTime: '08:00 AM',
            pax: 0,
            extraAmount: 500,
            ratePerPlate: 500,
            amount: 500,
            charges: [{ description: 'Stage setup', amount: 0 }],
          },
        ],
        estimate: {
          cgstPercent: 0,
          cgstAmount: 0,
          sgstPercent: 0,
          sgstAmount: 0,
          discount: 0,
          roundOff: 0,
          grandTotal: 500,
        },
        advancePayments: [{ amount: 5000, paidAt: '2026-07-06T18:30:00.000Z', description: 'Bank Transfer' }],
        notes: 'Add notes here...',
      }),
      responseSchema: 'EventBilling',
      successDescription: 'Billing saved; visible in client app when showToClient is true',
    }),
  },
  '/events/{eventId}/manager-cost': {
    get: op('get', ['Events', 'Manager Cost'], 'Get manager cost breakdown', {
      operationId: 'eventManagerCostGet',
      parameters: [eventIdParam],
      responseSchema: 'EventManagerCost',
    }),
    put: op('put', ['Events', 'Manager Cost'], 'Save manager cost breakdown', {
      operationId: 'eventManagerCostSave',
      parameters: [eventIdParam],
      requestBody: jsonBody('SaveManagerCostRequest', true),
      responseSchema: 'EventManagerCost',
    }),
  },
};
