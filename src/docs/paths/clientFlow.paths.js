const { op, idParam, PUBLIC } = require('../helpers');

const CLIENT_FLOW_TAG = 'Client Flow';

const clientFlowPaths = {
  '/client-flow/reels': {
    get: op('get', [CLIENT_FLOW_TAG], 'List reels for client app', {
      operationId: 'clientFlowReelsList',
      security: PUBLIC,
      description:
        'Public global browse feed for the **Client app Our Events** screen. Returns category chips and all uploaded reel cards. Use `ourEventId` to filter by category.',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        {
          name: 'ourEventId',
          in: 'query',
          schema: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }] },
          description: 'Filter by Our Events category (Corporate, Weddings, etc.)',
        },
        { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search title or venue' },
      ],
      responseSchema: 'ClientFlowReelsResponse',
    }),
  },
  '/client-flow/our-events': {
    get: op('get', [CLIENT_FLOW_TAG], 'List Our Events categories for client app', {
      operationId: 'clientFlowOurEventsList',
      security: PUBLIC,
      description:
        'Public endpoint for the **Client app** to show Our Events category chips/dropdown. No authentication required.',
      parameters: [
        { name: 'forSelect', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
        { name: 'includeInactive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responseSchema: 'ClientEventTitleSelectList',
    }),
  },
  '/client-flow/discover-experiences': {
    get: op('get', [CLIENT_FLOW_TAG], 'List discover experiences for client app', {
      operationId: 'clientFlowDiscoverExperiencesList',
      security: PUBLIC,
      description:
        'Public global list for the **Client app** Discover Experience section. Same pattern as `/client-flow/reels`. No authentication required.',
      responseSchema: 'DiscoverExperienceList',
    }),
  },
  '/client-flow/testimonials': {
    get: op('get', [CLIENT_FLOW_TAG], 'List testimonials for client app', {
      operationId: 'clientFlowTestimonialsList',
      security: PUBLIC,
      description:
        'Public global list for the **Client app** Testimonials section. No authentication required.',
      responseSchema: 'TestimonialList',
    }),
  },
  '/client-flow/client-dashboard': {
    get: op('get', [CLIENT_FLOW_TAG], 'Get client dashboard content', {
      operationId: 'clientFlowDashboardGet',
      security: PUBLIC,
      description:
        'Public global endpoint for the **Client app** to display discover experiences and testimonials. No authentication required.',
      responseSchema: 'PublicClientDashboardResponse',
    }),
  },
  '/client-flow/inquiries': {
    post: op('post', [CLIENT_FLOW_TAG], 'Submit service inquiry from client app', {
      operationId: 'clientFlowInquiryCreate',
      security: PUBLIC,
      description:
        'Public endpoint for the **Client app Service Request** form. Each submission includes one event day (`eventDay`). Day number is always stored as 1 on the server.',
      requestSchema: 'CreateClientInquiryRequest',
      responseSchema: 'ClientInquiryCreateResponse',
      successStatus: 201,
    }),
  },
};

module.exports = clientFlowPaths;
