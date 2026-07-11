const { op, idParam, PUBLIC, AUTH, jsonBody } = require('../helpers');

const CLIENT_FLOW_TAG = 'Client Flow';

const clientFlowPaths = {
  '/client-flow/auth/signup': {
    post: op('post', [CLIENT_FLOW_TAG], 'Client sign up', {
      operationId: 'clientFlowAuthSignup',
      security: PUBLIC,
      description: 'Sign up for the **Client app**. Creates user account and client profile.',
      requestBody: jsonBody('RegisterClientRequest', true),
      responseSchema: 'LoginResponse',
      successStatus: 201,
      successDescription: 'Sign up successful',
    }),
  },
  '/client-flow/auth/login': {
    post: op('post', [CLIENT_FLOW_TAG], 'Client login', {
      operationId: 'clientFlowAuthLogin',
      security: PUBLIC,
      description: 'Login for the **Client app** with email or phone and password.',
      requestBody: jsonBody('LoginRequest', true),
      responseSchema: 'LoginResponse',
      successDescription: 'Login successful',
    }),
  },
  '/client-flow/auth/otp/send': {
    post: op('post', [CLIENT_FLOW_TAG], 'Send client email OTP', {
      operationId: 'clientFlowAuthOtpSend',
      security: PUBLIC,
      description: 'Send a 6-digit OTP to the client email for verification.',
      requestBody: jsonBody('ClientOtpEmailSendRequest', true),
      responseSchema: 'SuccessResponse',
      successDescription: 'OTP sent to email',
    }),
  },
  '/client-flow/auth/otp/verify': {
    post: op('post', [CLIENT_FLOW_TAG], 'Verify client email OTP', {
      operationId: 'clientFlowAuthOtpVerify',
      security: PUBLIC,
      description: 'Confirm the OTP sent to the client email.',
      requestBody: jsonBody('ClientOtpEmailVerifyRequest', true),
      responseSchema: 'ClientOtpEmailVerifyResponse',
      successDescription: 'Email verified',
    }),
  },
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
    get: op('get', [CLIENT_FLOW_TAG], 'List client inquiries', {
      operationId: 'clientFlowInquiriesList',
      security: AUTH,
      description:
        'Returns paginated service inquiries for the **logged-in client only**, filtered by `client_id`. Requires client JWT from `/client-flow/auth/login`.',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'converted'] } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'sortBy', in: 'query', schema: { type: 'string', example: 'created_at' } },
        { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
      ],
      responseSchema: 'PaginatedList',
    }),
    post: op('post', [CLIENT_FLOW_TAG], 'Submit service inquiry from client app', {
      operationId: 'clientFlowInquiryCreate',
      security: AUTH,
      description:
        'Submit a service inquiry for the **logged-in client**. Inquiry is always saved with the authenticated `client_id`. Requires client JWT.',
      requestSchema: 'CreateClientInquiryRequest',
      responseSchema: 'ClientInquiryCreateResponse',
      successStatus: 201,
    }),
  },
};

module.exports = clientFlowPaths;
