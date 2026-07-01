const {
  op, jsonBody, idParam, paginationParams, exportParams, importBody, bulkIdsBody,
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
    get: op('get', ['Events'], "Today's events", { operationId: 'eventsToday' }),
  },
  '/events/upcoming': {
    get: op('get', ['Events'], 'Upcoming events', { operationId: 'eventsUpcoming' }),
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
    get: op('get', ['Events'], 'List events', {
      operationId: 'eventsList',
      parameters: eventListParams,
      responseSchema: 'PaginatedList',
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
};

module.exports = eventsPaths;
