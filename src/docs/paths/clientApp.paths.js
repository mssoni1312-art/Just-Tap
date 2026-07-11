const { op, jsonBody, idParam } = require('../helpers');

const clientAppPaths = {
  '/admin/our-events': {
    get: op('get', ['Super Admin Client Dashboard'], 'List Our Events categories', {
      operationId: 'ourEventsList',
      description:
        'Super Admin list of Our Events categories for Client Dashboard. Use `forSelect=true` for `{ items: [...] }`.',
      parameters: [
        { name: 'forSelect', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
        { name: 'includeInactive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'Our Events categories',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    properties: {
                      data: {
                        oneOf: [
                          { $ref: '#/components/schemas/ClientEventTitleList' },
                          { $ref: '#/components/schemas/ClientEventTitleSelectList' },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    }),
    post: op('post', ['Super Admin Client Dashboard'], 'Create Our Events category', {
      operationId: 'ourEventsCreate',
      description: 'Adds a global curated experience category shown in the client app.',
      requestBody: jsonBody('CreateClientEventTitleRequest', true),
      responseSchema: 'ClientEventTitle',
      created: true,
      successDescription: 'Our event title created',
    }),
  },
  '/admin/our-events/{id}': {
    delete: op('delete', ['Super Admin Client Dashboard'], 'Delete Our Events category', {
      operationId: 'ourEventsDelete',
      parameters: [idParam()],
      successDescription: 'Our event title deleted',
    }),
  },
  '/admin/reels': {
    get: op('get', ['Super Admin Client Dashboard'], 'List reels', {
      operationId: 'reelsList',
      description:
        'Paginated admin list of global reels shown in the client app. Filter by Our Events category or search name/venue.',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        {
          name: 'ourEventId',
          in: 'query',
          schema: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }] },
          description: 'Filter by Our Events category',
        },
        { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search name or venue' },
      ],
      responseSchema: 'PaginatedEventReelList',
    }),
    post: op('post', ['Super Admin Client Dashboard'], 'Upload reel/video', {
      operationId: 'reelsCreate',
      description: 'Saves a global reel with video file, our-event category, name, venue, and guest count for the client app.',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: { $ref: '#/components/schemas/CreateReelRequest' },
          },
        },
      },
      responseSchema: 'EventReel',
      created: true,
      successDescription: 'Reel saved',
    }),
  },
  '/admin/reels/{id}': {
    delete: op('delete', ['Super Admin Client Dashboard'], 'Delete reel', {
      operationId: 'reelsDelete',
      description: 'Soft-deletes a reel so it no longer appears in the client app feed.',
      parameters: [idParam()],
      successDescription: 'Reel deleted',
    }),
  },
  '/admin/discover-experiences': {
    get: op('get', ['Super Admin Client Dashboard'], 'List discover experiences', {
      operationId: 'discoverExperiencesList',
      description:
        'Paginated admin list for the Client Dashboard **Discover Experience** listing screen. Soft-deleted items are excluded.',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search description' },
      ],
      responseSchema: 'PaginatedDiscoverExperienceList',
    }),
    post: {
      tags: ['Super Admin Client Dashboard'],
      summary: 'Create Discover Experience or Testimonial',
      operationId: 'clientDashboardContentCreate',
      security: [{ bearerAuth: [] }],
      description:
        'Combined Super Admin create API. Set `contentType` to `discover_experience` or `testimonial`. Also available as `POST /discover-experiences`.',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: { $ref: '#/components/schemas/CreateClientDashboardContentRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    properties: {
                      data: {
                        oneOf: [
                          { $ref: '#/components/schemas/DiscoverExperience' },
                          { $ref: '#/components/schemas/Testimonial' },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        422: { $ref: '#/components/responses/ValidationError' },
      },
    },
  },
  '/discover-experiences': {
    post: {
      tags: ['Super Admin Client Dashboard'],
      summary: 'Create Discover Experience or Testimonial (alias)',
      operationId: 'clientDashboardContentCreateAlias',
      security: [{ bearerAuth: [] }],
      description: 'Alias of `POST /admin/discover-experiences` for Flutter clients.',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: { $ref: '#/components/schemas/CreateClientDashboardContentRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'Created',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    properties: {
                      data: {
                        oneOf: [
                          { $ref: '#/components/schemas/DiscoverExperience' },
                          { $ref: '#/components/schemas/Testimonial' },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        422: { $ref: '#/components/responses/ValidationError' },
      },
    },
  },
  '/admin/discover-experiences/{id}': {
    get: op('get', ['Super Admin Client Dashboard'], 'Get discover experience', {
      operationId: 'discoverExperiencesGet',
      parameters: [idParam()],
      responseSchema: 'DiscoverExperience',
    }),
    patch: {
      tags: ['Super Admin Client Dashboard'],
      summary: 'Update discover experience',
      operationId: 'discoverExperiencesUpdate',
      security: [{ bearerAuth: [] }],
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: { $ref: '#/components/schemas/UpdateDiscoverExperienceRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Discover experience updated',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { properties: { data: { $ref: '#/components/schemas/DiscoverExperience' } } },
                ],
              },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        422: { $ref: '#/components/responses/ValidationError' },
      },
    },
    delete: op('delete', ['Super Admin Client Dashboard'], 'Delete discover experience', {
      operationId: 'discoverExperiencesDelete',
      description:
        'Soft-deletes a discover experience so it no longer appears on Client Dashboard or client-flow feeds.',
      parameters: [idParam()],
      successDescription: 'Discover experience deleted',
    }),
  },
  '/admin/testimonials': {
    get: op('get', ['Super Admin Client Dashboard'], 'List testimonials', {
      operationId: 'testimonialsList',
      description:
        'Paginated admin list for the Client Dashboard **Testimonials** listing screen. Soft-deleted items are excluded.',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search name or description',
        },
      ],
      responseSchema: 'PaginatedTestimonialList',
    }),
  },
  '/admin/testimonials/{id}': {
    get: op('get', ['Super Admin Client Dashboard'], 'Get testimonial', {
      operationId: 'testimonialsGet',
      parameters: [idParam()],
      responseSchema: 'Testimonial',
    }),
    patch: {
      tags: ['Super Admin Client Dashboard'],
      summary: 'Update testimonial',
      operationId: 'testimonialsUpdate',
      security: [{ bearerAuth: [] }],
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: { $ref: '#/components/schemas/UpdateTestimonialRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Testimonial updated',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { properties: { data: { $ref: '#/components/schemas/Testimonial' } } },
                ],
              },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        422: { $ref: '#/components/responses/ValidationError' },
      },
    },
    delete: op('delete', ['Super Admin Client Dashboard'], 'Delete testimonial', {
      operationId: 'testimonialsDelete',
      description:
        'Soft-deletes a testimonial so it no longer appears on Client Dashboard or client-flow feeds.',
      parameters: [idParam()],
      successDescription: 'Testimonial deleted',
    }),
  },
};

module.exports = clientAppPaths;
