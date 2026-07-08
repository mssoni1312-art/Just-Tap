const { op, jsonBody, idParam, PUBLIC } = require('../helpers');

const clientAppPaths = {
  '/our-events': {
    get: op('get', ['Client App'], 'List Our Events categories', {
      operationId: 'ourEventsList',
      security: PUBLIC,
      description:
        'Public global list of Our Events categories for dropdown/chips. Use `forSelect=true` for `{ items: [...] }`.',
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
    post: op('post', ['Client App'], 'Create Our Events category', {
      operationId: 'ourEventsCreate',
      description: 'Adds a global curated experience category shown in the client app.',
      requestBody: jsonBody('CreateClientEventTitleRequest', true),
      responseSchema: 'ClientEventTitle',
      created: true,
      successDescription: 'Our event title created',
    }),
  },
  '/our-events/{id}': {
    delete: op('delete', ['Client App'], 'Delete Our Events category', {
      operationId: 'ourEventsDelete',
      parameters: [idParam()],
      successDescription: 'Our event title deleted',
    }),
  },
  '/reels': {
    post: op('post', ['Client App'], 'Upload reel/video', {
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
  '/discover-experiences': {
    get: op('get', ['Client App'], 'List discover experiences', {
      operationId: 'discoverExperiencesList',
      description: 'Global promotional videos shown in the client app Discover section.',
      responseSchema: 'DiscoverExperienceList',
    }),
    post: {
      tags: ['Client App'],
      summary: 'Create discover experience',
      operationId: 'discoverExperiencesCreate',
      security: [{ bearerAuth: [] }],
      description: 'Upload a video and description for the client app Discover Experience section.',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: { $ref: '#/components/schemas/CreateDiscoverExperienceRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'Discover experience created',
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
        422: { $ref: '#/components/responses/ValidationError' },
      },
    },
  },
  '/discover-experiences/{id}': {
    get: op('get', ['Client App'], 'Get discover experience', {
      operationId: 'discoverExperiencesGet',
      parameters: [idParam()],
      responseSchema: 'DiscoverExperience',
    }),
    patch: {
      tags: ['Client App'],
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
    delete: op('delete', ['Client App'], 'Delete discover experience', {
      operationId: 'discoverExperiencesDelete',
      parameters: [idParam()],
    }),
  },
  '/testimonials': {
    get: op('get', ['Client App'], 'List testimonials', {
      operationId: 'testimonialsList',
      description: 'Global testimonials shown in the client app.',
      responseSchema: 'TestimonialList',
    }),
    post: {
      tags: ['Client App'],
      summary: 'Create testimonial',
      operationId: 'testimonialsCreate',
      security: [{ bearerAuth: [] }],
      description: 'Add a testimonial with rating, name, description, and optional video.',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: { $ref: '#/components/schemas/CreateTestimonialRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'Testimonial created',
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
        422: { $ref: '#/components/responses/ValidationError' },
      },
    },
  },
  '/testimonials/{id}': {
    get: op('get', ['Client App'], 'Get testimonial', {
      operationId: 'testimonialsGet',
      parameters: [idParam()],
      responseSchema: 'Testimonial',
    }),
    patch: {
      tags: ['Client App'],
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
    delete: op('delete', ['Client App'], 'Delete testimonial', {
      operationId: 'testimonialsDelete',
      parameters: [idParam()],
    }),
  },
};

module.exports = clientAppPaths;
