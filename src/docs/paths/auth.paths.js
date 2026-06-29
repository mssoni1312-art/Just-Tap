const {
  AUTH, PUBLIC, op, jsonBody, idParam, paginationParams, exportParams, importBody, bulkIdsBody,
} = require('../helpers');

const authPaths = {
  '/auth/login': {
    post: op('post', ['Auth'], 'Login with email or phone', {
      operationId: 'authLogin',
      security: PUBLIC,
      description: 'Authenticate with identifier (email/phone) and password. Returns JWT access and refresh tokens.',
      requestBody: jsonBody('LoginRequest', true, { identifier: 'admin@justtap.com', password: 'admin123' }),
      responseSchema: 'LoginResponse',
      successDescription: 'Login successful — use `accessToken` in Authorization header',
    }),
  },
  '/auth/logout': {
    post: op('post', ['Auth'], 'Logout and revoke refresh token', {
      operationId: 'authLogout',
      requestBody: jsonBody('RefreshTokenRequest'),
      successDescription: 'Logged out successfully',
    }),
  },
  '/auth/token/refresh': {
    post: op('post', ['Auth'], 'Refresh access token', {
      operationId: 'authRefresh',
      security: PUBLIC,
      requestBody: jsonBody('RefreshTokenRequest'),
      responseSchema: 'LoginResponse',
      successDescription: 'New access token issued',
    }),
  },
  '/auth/otp/send': {
    post: op('post', ['Auth'], 'Send OTP', {
      operationId: 'authOtpSend',
      security: PUBLIC,
      requestBody: jsonBody('OtpSendRequest', true, { identifier: '+919876543210' }),
      successDescription: 'OTP sent',
    }),
  },
  '/auth/otp/verify': {
    post: op('post', ['Auth'], 'Verify OTP and login', {
      operationId: 'authOtpVerify',
      security: PUBLIC,
      requestBody: jsonBody('OtpVerifyRequest', true, { identifier: '+919876543210', code: '123456' }),
      responseSchema: 'LoginResponse',
      successDescription: 'OTP verified — returns tokens',
    }),
  },
  '/auth/password/forgot': {
    post: op('post', ['Auth'], 'Request password reset', {
      operationId: 'authForgotPassword',
      security: PUBLIC,
      requestBody: jsonBody('ForgotPasswordRequest'),
      successDescription: 'Reset link/token sent if account exists',
    }),
  },
  '/auth/password/reset': {
    post: op('post', ['Auth'], 'Reset password with token', {
      operationId: 'authResetPassword',
      security: PUBLIC,
      requestBody: jsonBody('ResetPasswordRequest'),
      successDescription: 'Password reset successful',
    }),
  },
  '/auth/password/change': {
    post: op('post', ['Auth'], 'Change password (authenticated)', {
      operationId: 'authChangePassword',
      requestBody: jsonBody('ChangePasswordRequest'),
      successDescription: 'Password changed',
    }),
  },
  '/auth/me': {
    get: op('get', ['Auth'], 'Get current authenticated user', {
      operationId: 'authGetMe',
      responseSchema: 'User',
      successDescription: 'Current user profile',
    }),
  },
};

const mePaths = {
  '/me': {
    get: op('get', ['Profile'], 'Get profile', {
      operationId: 'profileGet',
      responseSchema: 'User',
    }),
    patch: op('patch', ['Profile'], 'Update profile', {
      operationId: 'profileUpdate',
      requestBody: jsonBody('UpdateProfileRequest', true, { firstName: 'Admin', lastName: 'User' }),
      responseSchema: 'User',
    }),
  },
  '/me/preferences': {
    patch: op('patch', ['Profile'], 'Update notification and UI preferences', {
      operationId: 'profilePreferences',
      requestBody: jsonBody('UpdatePreferencesRequest', true, { pushEnabled: true, darkModeEnabled: false }),
    }),
  },
  '/me/avatar': {
    post: {
      tags: ['Profile'],
      summary: 'Upload profile avatar',
      operationId: 'profileAvatar',
      security: AUTH,
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['avatar'],
              properties: {
                avatar: { type: 'string', format: 'binary', description: 'JPEG, PNG, WebP, or GIF (max 5 MB)' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Avatar uploaded', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        422: { $ref: '#/components/responses/ValidationError' },
      },
    },
  },
};

const dashboardPaths = {
  '/dashboard/home': {
    get: op('get', ['Dashboard'], 'Home screen dashboard data', {
      operationId: 'dashboardHome',
      description: 'Aggregated stats: today events, pending inquiries, task summary, recent activity.',
      successDescription: 'Dashboard home data',
    }),
  },
};

module.exports = { authPaths, mePaths, dashboardPaths };
