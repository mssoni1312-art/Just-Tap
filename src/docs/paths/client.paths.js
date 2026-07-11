const { AUTH, PUBLIC, op, jsonBody } = require('../helpers');

const CLIENT_TAG = 'Client';
const CLIENT_AUTH_TAG = 'Client Auth';
const CLIENT_INQUIRIES_TAG = 'Client Inquiries';

const clientPortalPaths = {
  '/': {
    get: op('get', [CLIENT_TAG], 'Client API info', {
      operationId: 'clientApiInfo',
      security: PUBLIC,
      description: 'Returns version, base prefix, and available client API routes.',
      responseSchema: 'SuccessResponse',
    }),
  },
  '/auth/register': {
    post: op('post', [CLIENT_TAG, CLIENT_AUTH_TAG], 'Client register', {
      operationId: 'clientAuthRegister',
      security: PUBLIC,
      description: 'Self-registration for the **Client app**. Alias: `POST /auth/signup`.',
      requestBody: jsonBody('RegisterClientRequest', true, {
        email: 'client@example.com',
        password: 'client123',
        name: 'Acme Events',
        phone: '+919876543210',
        cityName: 'Mumbai',
      }),
      responseSchema: 'LoginResponse',
      successStatus: 201,
      successDescription: 'Registration successful',
    }),
  },
  '/auth/signup': {
    post: op('post', [CLIENT_TAG, CLIENT_AUTH_TAG], 'Client sign up', {
      operationId: 'clientAuthSignup',
      security: PUBLIC,
      description: 'Sign up for the **Client app**. Same as `POST /auth/register`.',
      requestBody: jsonBody('RegisterClientRequest', true, {
        email: 'client@example.com',
        password: 'client123',
        name: 'Acme Events',
        phone: '+919876543210',
        cityName: 'Mumbai',
      }),
      responseSchema: 'LoginResponse',
      successStatus: 201,
      successDescription: 'Sign up successful',
    }),
  },
  '/auth/login': {
    post: op('post', [CLIENT_TAG, CLIENT_AUTH_TAG], 'Client login', {
      operationId: 'clientAuthLogin',
      security: PUBLIC,
      description: 'Login for the **Client app** with email or phone and password.',
      requestBody: jsonBody('LoginRequest', true, {
        identifier: 'client@example.com',
        password: 'client123',
      }),
      responseSchema: 'LoginResponse',
      successDescription: 'Login successful',
    }),
  },
  '/auth/otp/send': {
    post: op('post', [CLIENT_TAG, CLIENT_AUTH_TAG], 'Send email OTP', {
      operationId: 'clientAuthOtpSend',
      security: PUBLIC,
      description: 'Send a 6-digit OTP to the client email for verification or OTP login.',
      requestBody: jsonBody('ClientOtpEmailSendRequest', true),
      responseSchema: 'SuccessResponse',
      successDescription: 'OTP sent to email',
    }),
  },
  '/auth/otp/verify': {
    post: op('post', [CLIENT_TAG, CLIENT_AUTH_TAG], 'Verify email OTP', {
      operationId: 'clientAuthOtpVerify',
      security: PUBLIC,
      description:
        'Confirm the OTP sent to email. Returns tokens if a client account exists; otherwise returns `emailVerified: true` for signup flow.',
      requestBody: jsonBody('ClientOtpEmailVerifyRequest', true),
      responseSchema: 'ClientOtpEmailVerifyResponse',
      successDescription: 'Email verified',
    }),
  },
  '/inquiries': {
    get: op('get', [CLIENT_TAG, CLIENT_INQUIRIES_TAG], 'List client inquiries', {
      operationId: 'clientInquiriesList',
      description:
        'Returns paginated service inquiries for the authenticated client. Filtered strictly by `client_id`.',
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
    post: op('post', [CLIENT_TAG, CLIENT_INQUIRIES_TAG], 'Create client inquiry', {
      operationId: 'clientInquiriesCreate',
      description:
        'Submit a service inquiry for the logged-in client. Saved with authenticated `client_id`.',
      requestBody: jsonBody('CreateClientInquiryRequest', true),
      responseSchema: 'ClientInquiryCreateResponse',
      successStatus: 201,
    }),
  },
};

module.exports = clientPortalPaths;
