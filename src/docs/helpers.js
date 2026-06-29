const AUTH = [{ bearerAuth: [] }];
const PUBLIC = [];

const schemaRef = (name) => ({ $ref: `#/components/schemas/${name}` });
const responseRef = (name) => ({ $ref: `#/components/responses/${name}` });

const stdErrors = (extra = {}) => ({
  400: responseRef('BadRequest'),
  401: responseRef('Unauthorized'),
  403: responseRef('Forbidden'),
  404: responseRef('NotFound'),
  409: responseRef('Conflict'),
  422: responseRef('ValidationError'),
  429: responseRef('TooManyRequests'),
  500: responseRef('InternalServerError'),
  ...extra,
});

const jsonSuccess = (description, schemaName = 'SuccessResponse', status = 200) => ({
  [status]: {
    description,
    content: {
      'application/json': {
        schema: schemaName === 'SuccessResponse'
          ? schemaRef('SuccessResponse')
          : {
              allOf: [schemaRef('SuccessResponse'), { properties: { data: schemaRef(schemaName) } }],
            },
      },
    },
  },
});

const jsonBody = (schemaName, required = true, example = undefined) => ({
  required,
  content: {
    'application/json': {
      schema: schemaRef(schemaName),
      ...(example ? { example } : {}),
    },
  },
});

const idParam = (name = 'id', description = 'Record ID (numeric or UUID)') => ({
  name,
  in: 'path',
  required: true,
  schema: { $ref: '#/components/schemas/IdParam' },
  description,
  example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
});

const paginationParams = (extra = []) => [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 }, description: 'Page number' },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 500, default: 20 }, description: 'Items per page' },
  { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Full-text search term' },
  { name: 'sortBy', in: 'query', schema: { type: 'string' }, description: 'Sort column' },
  { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
  ...extra,
];

const exportParams = () => [
  ...paginationParams(),
  { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'], default: 'json' } },
  { name: 'download', in: 'query', schema: { type: 'boolean', default: false }, description: 'Force file download' },
];

const importBody = () => ({
  required: true,
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        properties: {
          file: { type: 'string', format: 'binary', description: 'CSV or JSON file' },
        },
      },
    },
    'application/json': {
      schema: schemaRef('ImportRecordsRequest'),
      example: { records: [{ clientName: 'Sample', eventDate: '2026-07-01' }] },
    },
  },
});

const bulkIdsBody = () => jsonBody('BulkIdsRequest', true, { ids: ['1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'] });

const op = (method, tags, summary, options = {}) => {
  const successStatus = options.created ? 201 : 200;
  const responses = {
    ...jsonSuccess(
      options.successDescription || 'Operation successful',
      options.responseSchema,
      successStatus
    ),
    ...stdErrors(options.errorOverrides),
    ...(options.extraResponses || {}),
  };

  if (options.created) {
    responses[201] = responses[201] || { $ref: '#/components/responses/Created' };
  }

  return {
    tags,
    summary,
    description: options.description || '',
    operationId: options.operationId || `${method}${tags[0]}${summary.replace(/\s+/g, '')}`,
    security: options.security !== undefined ? options.security : AUTH,
    parameters: options.parameters || [],
    requestBody: options.requestBody,
    responses,
  };
};

module.exports = {
  AUTH,
  PUBLIC,
  schemaRef,
  responseRef,
  stdErrors,
  jsonSuccess,
  jsonBody,
  idParam,
  paginationParams,
  exportParams,
  importBody,
  bulkIdsBody,
  op,
};
