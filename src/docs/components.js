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
      enum: ['inquiry', 'confirmed', 'cancelled', 'r_menu', 'live', 'tentative'],
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
    JustTapInformation: {
      type: 'object',
      description: 'Create Event step 4 — Just Tap Information (replaces former Menu Package tab)',
      properties: {
        noOfTablets: { type: 'integer', example: 10 },
        noOfCaptains: { type: 'integer', example: 8 },
        assignedCaptainIds: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Captain staff IDs from GET /captains (forSelect=true)',
        },
        noOfManagers: { type: 'integer', example: 10 },
        assignedManagerIds: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Manager staff IDs from GET /managers (forSelect=true)',
        },
        rate: { type: 'number', example: 25000 },
      },
    },
    PhotographyVideography: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', example: true },
        name: { type: 'string', example: 'Studio Lens' },
        number: { type: 'string', example: '+917857476574' },
        city: { type: 'string', example: 'Ahmedabad' },
        description: { type: 'string', example: 'Cover all the angles' },
        rate: { type: 'number', example: 10000 },
      },
    },
    JustSocialInformation: {
      type: 'object',
      properties: {
        clientInstagramId: { type: 'string', example: '@saicaterersbaroda' },
        noOfFollowers: { type: 'integer', example: 830 },
        noOfFoodReels: { type: 'integer', example: 10 },
        noOfTestimonialReels: { type: 'integer', example: 20 },
      },
    },
    BrideGroomInformation: {
      type: 'object',
      properties: {
        brideName: { type: 'string' },
        brideInstagramId: { type: 'string' },
        groomName: { type: 'string' },
        groomInstagramId: { type: 'string' },
        imageUrls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs from POST /uploads/images',
        },
      },
    },
    EventPricing: {
      type: 'object',
      properties: {
        totalRate: { type: 'number', example: 35000 },
        discountRate: { type: 'number', example: 10, description: 'Discount percentage' },
        finalRate: { type: 'number', example: 31500 },
      },
    },
    CreateEventRequest: {
      type: 'object',
      required: ['venueName', 'cityName', 'startDate', 'endDate'],
      properties: {
        inquiryId: { $ref: '#/components/schemas/IdParam' },
        clientId: {
          $ref: '#/components/schemas/IdParam',
          description: 'Existing client ID from GET /clients. When omitted, clientName, catererName, clientMobile, and reference are required to create a new client.',
        },
        clientName: { type: 'string', example: 'Rajesh Kumar' },
        clientMobile: { type: 'string', example: '+919876543210' },
        catererName: { type: 'string', example: 'Sai Caterer' },
        reference: { type: 'string', example: 'Friend' },
        isHighPriority: { type: 'boolean', default: false, example: true },
        venueName: { type: 'string', example: 'Grand Palace' },
        cityName: { type: 'string', example: 'Mumbai' },
        inquiryDate: { type: 'string', format: 'date' },
        startDate: { type: 'string', format: 'date', example: '2026-08-15' },
        endDate: { type: 'string', format: 'date', example: '2026-08-16' },
        eventFunctionName: { type: 'string' },
        status: { $ref: '#/components/schemas/EventStatus' },
        packageId: { type: 'integer', nullable: true },
        assignedManagerId: { type: 'integer', nullable: true, description: 'Primary manager (first in assignedManagerIds)' },
        assignedManagerIds: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Deprecated: prefer justTapInformation.assignedManagerIds',
        },
        justTapInformation: { $ref: '#/components/schemas/JustTapInformation' },
        photographyVideography: { $ref: '#/components/schemas/PhotographyVideography' },
        justSocialInformation: { $ref: '#/components/schemas/JustSocialInformation' },
        brideGroomInformation: { $ref: '#/components/schemas/BrideGroomInformation' },
        pricing: { $ref: '#/components/schemas/EventPricing' },
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
    EventDetail: {
      allOf: [
        { $ref: '#/components/schemas/CreateEventRequest' },
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
            uuid: { type: 'string', format: 'uuid' },
            clientId: { type: 'integer', nullable: true },
            managerNames: {
              type: 'array',
              items: { type: 'string' },
              description: 'Names of all assigned managers',
            },
            managerName: {
              type: 'string',
              nullable: true,
              description: 'Comma-separated manager names (backward compatible)',
            },
            functions: { type: 'array', items: { $ref: '#/components/schemas/EventFunction' } },
          },
        },
      ],
    },
    Client: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Rajesh Kumar' },
        catererName: { type: 'string', example: 'Sai Caterer' },
        cityName: { type: 'string', example: 'Baroda' },
        contactNo: { type: 'string', example: '+918264737487' },
        reference: { type: 'string', example: 'Friend' },
        isHighPriority: { type: 'boolean', example: true },
      },
    },
    CreateCaptainRequest: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Amit Patel' },
        isActive: { type: 'boolean', default: true },
      },
    },
    CreateClientRequest: {
      type: 'object',
      required: ['name', 'catererName', 'cityName', 'contactNo', 'reference'],
      properties: {
        name: { type: 'string', example: 'Rajesh Kumar' },
        catererName: { type: 'string', example: 'Sai Caterer' },
        cityName: { type: 'string', example: 'Baroda' },
        contactNo: { type: 'string', example: '+918264737487' },
        reference: { type: 'string', example: 'Friend' },
        isHighPriority: { type: 'boolean', default: false },
      },
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
    PackageFeature: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Social Media Growth' },
        isActive: { type: 'boolean' },
        sortOrder: { type: 'integer' },
      },
    },
    ManagePackageTier: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Tap Boost' },
        slug: { type: 'string' },
        type: { type: 'string', enum: ['premium', 'silver', 'gold', 'custom'] },
        price: { type: 'number', nullable: true, example: 699 },
        priceLabel: { type: 'string', nullable: true, example: 'Rs. 699 / Event' },
        isMostPopular: { type: 'boolean' },
        isActive: { type: 'boolean' },
        sortOrder: { type: 'integer' },
        includedFeatureIds: { type: 'array', items: { type: 'integer' } },
      },
    },
    ManagePackagesResponse: {
      type: 'object',
      properties: {
        features: { type: 'array', items: { $ref: '#/components/schemas/PackageFeature' } },
        packages: { type: 'array', items: { $ref: '#/components/schemas/ManagePackageTier' } },
      },
    },
    CreatePackageFeatureRequest: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'VIP Support' },
        isActive: { type: 'boolean', default: true },
        sortOrder: { type: 'integer', minimum: 0 },
      },
    },
    CreateManagePackageRequest: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Tap Platinum' },
        price: { type: 'number', minimum: 0, example: 1999 },
        type: { type: 'string', enum: ['premium', 'silver', 'gold', 'custom'] },
        isMostPopular: { type: 'boolean' },
        sortOrder: { type: 'integer' },
        includedFeatureIds: { type: 'array', items: { type: 'integer' } },
      },
    },
    SavePackageSettingsRequest: {
      type: 'object',
      properties: {
        features: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'isActive'],
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              isActive: { type: 'boolean' },
              sortOrder: { type: 'integer' },
            },
          },
        },
        packages: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              price: { type: 'number' },
              isMostPopular: { type: 'boolean' },
              sortOrder: { type: 'integer' },
              includedFeatureIds: { type: 'array', items: { type: 'integer' } },
            },
          },
        },
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
    BillingFunctionCharge: {
      type: 'object',
      required: ['label', 'amount'],
      properties: {
        label: { type: 'string', example: 'Decoration' },
        amount: { type: 'number', example: 5000 },
      },
    },
    BillingFunction: {
      type: 'object',
      required: ['name'],
      properties: {
        eventFunctionId: { $ref: '#/components/schemas/IdParam', nullable: true },
        name: { type: 'string', example: 'Dinner' },
        date: { type: 'string', format: 'date', example: '2025-06-12' },
        startTime: { type: 'string', example: '08:00 PM' },
        pax: { type: 'integer', example: 850 },
        extraCharges: { type: 'number', example: 0 },
        ratePerPlate: { type: 'number', example: 1250 },
        amount: { type: 'number', example: 1062500 },
        charges: { type: 'array', items: { $ref: '#/components/schemas/BillingFunctionCharge' } },
      },
    },
    BillingEstimate: {
      type: 'object',
      properties: {
        cgstPercent: { type: 'number', example: 2.5 },
        cgstAmount: { type: 'number', example: 26860 },
        sgstPercent: { type: 'number', example: 2.5 },
        sgstAmount: { type: 'number', example: 26860 },
        discount: { type: 'number', example: 0 },
        roundOff: { type: 'number', example: -10 },
        grandTotal: { type: 'number', example: 1074410 },
      },
    },
    BillingPayment: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 500000 },
        paidAt: { type: 'string', format: 'date-time', nullable: true },
        description: { type: 'string', example: 'Bank Transfer' },
      },
    },
    SaveBillingPreviewRequest: {
      type: 'object',
      properties: {
        showToClient: { type: 'boolean', default: false, description: 'When true, billing is visible in the client app' },
        functions: { type: 'array', items: { $ref: '#/components/schemas/BillingFunction' } },
        estimate: { $ref: '#/components/schemas/BillingEstimate' },
        payments: { type: 'array', items: { $ref: '#/components/schemas/BillingPayment' } },
        notes: { type: 'string', example: 'Add notes here...' },
      },
    },
    EventBilling: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        eventId: { type: 'string' },
        clientId: { type: 'string', nullable: true },
        clientName: { type: 'string' },
        showToClient: { type: 'boolean' },
        functions: { type: 'array', items: { $ref: '#/components/schemas/BillingFunction' } },
        estimate: { $ref: '#/components/schemas/BillingEstimate' },
        payments: { type: 'array', items: { $ref: '#/components/schemas/BillingPayment' } },
        totalPaid: { type: 'number' },
        remainingPayment: { type: 'number' },
        notes: { type: 'string' },
        previewedAt: { type: 'string', format: 'date-time', nullable: true },
        updatedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    EventBillingClientPreview: {
      type: 'object',
      properties: {
        eventId: { type: 'string' },
        clientName: { type: 'string' },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        functions: { type: 'array', items: { $ref: '#/components/schemas/BillingFunction' } },
        estimate: { $ref: '#/components/schemas/BillingEstimate' },
        payments: { type: 'array', items: { $ref: '#/components/schemas/BillingPayment' } },
        totalPaid: { type: 'number' },
        remainingPayment: { type: 'number' },
        notes: { type: 'string' },
        previewedAt: { type: 'string', format: 'date-time', nullable: true },
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
