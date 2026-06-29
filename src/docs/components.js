const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT access token obtained from `POST /auth/login` or `POST /auth/otp/verify`. Send as: `Authorization: Bearer <access_token>`',
    },
  },
  parameters: {
    AuthorizationHeader: {
      name: 'Authorization',
      in: 'header',
      required: true,
      description: 'Bearer JWT access token',
      schema: { type: 'string' },
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  },
  schemas: {
    IdParam: {
      oneOf: [
        { type: 'integer', minimum: 1, example: 1 },
        { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        { type: 'string', pattern: '^\\d+$', example: '42' },
      ],
    },
    SuccessResponse: {
      type: 'object',
      required: ['success', 'message', 'data'],
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: { nullable: true },
      },
    },
    ErrorResponse: {
      type: 'object',
      required: ['success', 'message', 'errors'],
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed' },
        errors: {
          type: 'array',
          items: { type: 'string' },
          example: ['"clientName" is required'],
        },
      },
    },
    PaginationMeta: {
      type: 'object',
      properties: {
        page: { type: 'integer', example: 1 },
        limit: { type: 'integer', example: 20 },
        total: { type: 'integer', example: 150 },
        totalPages: { type: 'integer', example: 8 },
      },
    },
    PaginatedList: {
      type: 'object',
      properties: {
        items: { type: 'array', items: {} },
        pagination: { $ref: '#/components/schemas/PaginationMeta' },
      },
    },
    BulkIdsRequest: {
      type: 'object',
      required: ['ids'],
      properties: {
        ids: {
          type: 'array',
          minItems: 1,
          items: { $ref: '#/components/schemas/IdParam' },
          example: [1, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
        },
      },
    },
    ImportRecordsRequest: {
      type: 'object',
      properties: {
        records: {
          type: 'array',
          minItems: 1,
          items: { type: 'object' },
        },
      },
    },
    LoginRequest: {
      type: 'object',
      required: ['identifier', 'password'],
      properties: {
        identifier: { type: 'string', description: 'Email or phone', example: 'admin@justtap.com' },
        password: { type: 'string', minLength: 6, example: 'admin123' },
      },
    },
    LoginResponse: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'integer', example: 3600 },
        user: { $ref: '#/components/schemas/User' },
      },
    },
    RefreshTokenRequest: {
      type: 'object',
      required: ['refreshToken'],
      properties: { refreshToken: { type: 'string' } },
    },
    OtpSendRequest: {
      type: 'object',
      required: ['identifier'],
      properties: { identifier: { type: 'string', example: '+919876543210' } },
    },
    OtpVerifyRequest: {
      type: 'object',
      required: ['identifier', 'code'],
      properties: {
        identifier: { type: 'string' },
        code: { type: 'string', pattern: '^\\d{6}$', example: '123456' },
      },
    },
    ForgotPasswordRequest: {
      type: 'object',
      required: ['identifier'],
      properties: { identifier: { type: 'string' } },
    },
    ResetPasswordRequest: {
      type: 'object',
      required: ['token', 'newPassword', 'confirmPassword'],
      properties: {
        token: { type: 'string' },
        newPassword: { type: 'string', minLength: 6 },
        confirmPassword: { type: 'string' },
      },
    },
    ChangePasswordRequest: {
      type: 'object',
      required: ['currentPassword', 'newPassword', 'confirmPassword'],
      properties: {
        currentPassword: { type: 'string' },
        newPassword: { type: 'string', minLength: 6 },
        confirmPassword: { type: 'string' },
      },
    },
    User: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        uuid: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string', nullable: true },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string', enum: ['super_admin', 'admin', 'manager'] },
        avatarUrl: { type: 'string', nullable: true },
      },
    },
    UpdateProfileRequest: {
      type: 'object',
      properties: {
        firstName: { type: 'string', maxLength: 100 },
        lastName: { type: 'string', maxLength: 100 },
        handle: { type: 'string', maxLength: 100, nullable: true },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string', maxLength: 20, nullable: true },
      },
    },
    UpdatePreferencesRequest: {
      type: 'object',
      properties: {
        pushEnabled: { type: 'boolean' },
        emailAlertsEnabled: { type: 'boolean' },
        darkModeEnabled: { type: 'boolean' },
        onboardingCompleted: { type: 'boolean' },
      },
    },
    EventStatus: {
      type: 'string',
      enum: ['inquiry', 'confirmed', 'cancelled', 'r_menu', 'live'],
    },
    EventFunction: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        venue: { type: 'string', nullable: true },
        date: { type: 'string', format: 'date', nullable: true },
        startTime: { type: 'string', nullable: true },
        endTime: { type: 'string', nullable: true },
        pax: { type: 'integer', nullable: true },
        rate: { type: 'number', nullable: true },
      },
    },
    CreateEventRequest: {
      type: 'object',
      required: ['clientName', 'venueName', 'cityName', 'startDate', 'endDate'],
      properties: {
        inquiryId: { $ref: '#/components/schemas/IdParam' },
        clientName: { type: 'string', example: 'Rajesh Kumar' },
        clientMobile: { type: 'string', example: '+919876543210' },
        venueName: { type: 'string', example: 'Grand Palace' },
        cityName: { type: 'string', example: 'Mumbai' },
        inquiryDate: { type: 'string', format: 'date' },
        startDate: { type: 'string', format: 'date', example: '2026-08-15' },
        endDate: { type: 'string', format: 'date', example: '2026-08-16' },
        eventFunctionName: { type: 'string' },
        status: { $ref: '#/components/schemas/EventStatus' },
        packageId: { type: 'integer', nullable: true },
        assignedManagerId: { type: 'integer', nullable: true },
        functions: { type: 'array', items: { $ref: '#/components/schemas/EventFunction' } },
        menuItemIds: { type: 'array', items: { $ref: '#/components/schemas/IdParam' } },
      },
    },
    BulkUpdateEventsRequest: {
      allOf: [
        { $ref: '#/components/schemas/BulkIdsRequest' },
        {
          type: 'object',
          required: ['status'],
          properties: { status: { $ref: '#/components/schemas/EventStatus' } },
        },
      ],
    },
    Inquiry: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        uuid: { type: 'string', format: 'uuid' },
        refNumber: { type: 'string' },
        clientName: { type: 'string' },
        clientPhone: { type: 'string', nullable: true },
        eventDate: { type: 'string', format: 'date' },
        timeSlot: { type: 'string' },
        venue: { type: 'string' },
        functionName: { type: 'string' },
        packageName: { type: 'string' },
        capacity: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'converted'] },
      },
    },
    CreateInquiryRequest: {
      type: 'object',
      required: ['clientName', 'eventDate', 'timeSlot', 'venue', 'functionName', 'packageName', 'capacity'],
      properties: {
        refNumber: { type: 'string' },
        clientName: { type: 'string', example: 'Priya Sharma' },
        clientPhone: { type: 'string' },
        eventDate: { type: 'string', format: 'date', example: '2026-09-01' },
        timeSlot: { type: 'string', example: 'Evening' },
        venue: { type: 'string', example: 'Lake View Hall' },
        functionName: { type: 'string', example: 'Wedding Reception' },
        packageName: { type: 'string', example: 'Premium' },
        packageId: { type: 'integer', nullable: true },
        capacity: { type: 'string', example: '500' },
      },
    },
    BulkUpdateInquiriesRequest: {
      allOf: [
        { $ref: '#/components/schemas/BulkIdsRequest' },
        {
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string', enum: ['pending', 'converted'] } },
        },
      ],
    },
    MenuCategory: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
        sortOrder: { type: 'integer' },
        itemCount: { type: 'integer' },
      },
    },
    MenuItem: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        categoryId: { type: 'integer' },
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
        price: { type: 'number' },
        isVeg: { type: 'boolean' },
        imageUrl: { type: 'string', nullable: true },
        isBestSeller: { type: 'boolean' },
        isActive: { type: 'boolean' },
      },
    },
    CreateMenuCategoryRequest: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Starters' },
        description: { type: 'string' },
        sort_order: { type: 'integer', minimum: 0 },
      },
    },
    CreateMenuItemRequest: {
      type: 'object',
      required: ['category_id', 'name', 'price'],
      properties: {
        category_id: { type: 'integer', example: 1 },
        name: { type: 'string', example: 'Paneer Tikka' },
        description: { type: 'string' },
        price: { type: 'number', minimum: 0, example: 350 },
        is_veg: { type: 'boolean', default: true },
        image_url: { type: 'string', format: 'uri' },
        is_best_seller: { type: 'boolean' },
        is_active: { type: 'boolean' },
      },
    },
    Staff: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        role: { type: 'string', enum: ['event_manager', 'waiter', 'captain', 'other'] },
        isActive: { type: 'boolean' },
      },
    },
    CreateStaffRequest: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Amit Patel' },
        role: { type: 'string', enum: ['event_manager', 'waiter', 'captain', 'other'] },
        isActive: { type: 'boolean', default: true },
      },
    },
    BulkUpdateStaffRequest: {
      allOf: [
        { $ref: '#/components/schemas/BulkIdsRequest' },
        {
          type: 'object',
          properties: {
            isActive: { type: 'boolean' },
            role: { type: 'string', enum: ['event_manager', 'waiter', 'captain', 'other'] },
          },
        },
      ],
    },
    TaskTemplate: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
        category: { type: 'string', nullable: true },
        isActive: { type: 'boolean' },
      },
    },
    CreateTaskRequest: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Setup stage lighting' },
        description: { type: 'string' },
        category: { type: 'string', example: 'Setup' },
      },
    },
    AssignTasksRequest: {
      type: 'object',
      required: ['tasks'],
      properties: {
        tasks: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['title'],
            properties: {
              task_template_id: { $ref: '#/components/schemas/IdParam' },
              title: { type: 'string' },
              description: { type: 'string' },
              due_date: { type: 'string', format: 'date' },
            },
          },
        },
        assignedTo: { $ref: '#/components/schemas/IdParam' },
      },
    },
    FeedbackReplyRequest: {
      type: 'object',
      required: ['replyText'],
      properties: { replyText: { type: 'string', example: 'Thank you for your feedback!' } },
    },
    MenuPlanningRequest: {
      type: 'object',
      required: ['menuItemIds'],
      properties: {
        menuItemIds: {
          type: 'array',
          minItems: 1,
          items: { $ref: '#/components/schemas/IdParam' },
        },
      },
    },
    TableAssignment: {
      type: 'object',
      required: ['tableNumber', 'allocationType'],
      properties: {
        tableNumber: { type: 'integer' },
        allocationType: { type: 'string', enum: ['dining', 'captain'] },
        userCode: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        eventLabel: { type: 'string', nullable: true },
      },
    },
    BulkTablesRequest: {
      type: 'object',
      required: ['assignments'],
      properties: {
        assignments: {
          type: 'array',
          minItems: 1,
          items: { $ref: '#/components/schemas/TableAssignment' },
        },
      },
    },
    TableAllocationRequest: {
      type: 'object',
      properties: {
        diningTables: { type: 'array', items: { type: 'integer' } },
        captainTables: { type: 'array', items: { type: 'integer' } },
      },
    },
    ActivityLog: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        action: { type: 'string' },
        description: { type: 'string' },
        userId: { type: 'integer', nullable: true },
        eventId: { type: 'integer', nullable: true },
        metadata: { type: 'object', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    UploadResponse: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        filename: { type: 'string' },
        mimeType: { type: 'string' },
        size: { type: 'integer' },
      },
    },
  },
  responses: {
    BadRequest: {
      description: 'Bad request — malformed input or unsupported file type',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Invalid document type', errors: [] } } },
    },
    Unauthorized: {
      description: 'Missing or invalid JWT — include `Authorization: Bearer <token>` header',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Unauthorized', errors: [] } } },
    },
    Forbidden: {
      description: 'Authenticated but insufficient role (requires super_admin)',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Forbidden', errors: [] } } },
    },
    NotFound: {
      description: 'Resource not found',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Event not found', errors: [] } } },
    },
    Conflict: {
      description: 'Duplicate entry or conflicting state',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Duplicate entry', errors: ['ER_DUP_ENTRY'] } } },
    },
    ValidationError: {
      description: 'Joi validation failed (HTTP 422)',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          example: { success: false, message: 'Validation failed', errors: ['"clientName" is required', '"eventDate" must be a valid date'] },
        },
      },
    },
    TooManyRequests: {
      description: 'Rate limit exceeded',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Too many requests', errors: [] } } },
    },
    InternalServerError: {
      description: 'Unexpected server error',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' }, example: { success: false, message: 'Internal server error', errors: [] } } },
    },
    Created: {
      description: 'Resource created',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } },
    },
    NoContent: { description: 'Success with no response body' },
  },
};

module.exports = components;
