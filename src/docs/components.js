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
    ClientSelectList: {
      type: 'object',
      description: 'Client list for Create Event dropdown. Returned by `GET /clients?forSelect=true` (no pagination).',
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/Client' },
        },
      },
      example: {
        items: [
          {
            id: 14,
            uuid: '9a9575d7-784f-11f1-945a-7a40d310aa11',
            name: 'testy',
            catererName: 'testy',
            clientAddress: null,
            cityName: '',
            contactNo: null,
            reference: '',
            isHighPriority: false,
            createdAt: '2026-07-05 08:57:51',
            updatedAt: '2026-07-05 08:57:51',
          },
        ],
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
        subVenueRemarks: { type: 'string', nullable: true },
        date: { type: 'string', format: 'date', nullable: true },
        startTime: { type: 'string', nullable: true },
        endTime: { type: 'string', nullable: true },
        startDateTime: { type: 'string', format: 'date-time', nullable: true },
        endDateTime: { type: 'string', format: 'date-time', nullable: true },
        pax: { type: 'integer', nullable: true },
        rate: { type: 'number', nullable: true },
      },
    },
    ManagerTabletMedia: {
      type: 'object',
      description: 'Create Event step 2 — Tablet / Photography / Videography',
      properties: {
        service: { type: 'string', example: 'Just Tap Tablet' },
        number: { type: 'integer', example: 10, description: 'Number of tablets' },
        clientAddress: { type: 'string', example: 'Grand Hyatt Hall' },
        hasPhotographyVideography: { type: 'boolean', default: false },
      },
    },
    ManagerBrideGroomInformation: {
      type: 'object',
      description: 'Create Event step 2 — Bride and Groom Information',
      properties: {
        brideName: { type: 'string' },
        brideInstagramId: { type: 'string' },
        groomName: { type: 'string' },
        groomInstagramId: { type: 'string' },
        foodNotes: { type: 'string' },
        eventRemarks: { type: 'string' },
        venueName: { type: 'string', description: 'Optional venue override' },
      },
    },
    CreateManagerEventRequest: {
      type: 'object',
      required: ['venueName', 'cityName', 'startDate', 'endDate'],
      description: 'Manager mobile app create-event wizard (4 steps)',
      properties: {
        inquiryId: { $ref: '#/components/schemas/IdParam' },
        clientId: {
          $ref: '#/components/schemas/IdParam',
          description: 'Existing client from GET /clients. When omitted, clientName, clientMobile, and reference are required.',
        },
        inquiryDate: { type: 'string', format: 'date', description: 'Step 1 — Inquiry Date' },
        status: { $ref: '#/components/schemas/EventStatus' },
        startDate: { type: 'string', format: 'date', description: 'Step 1 — Event Start Date' },
        endDate: { type: 'string', format: 'date', description: 'Step 1 — Event End Date' },
        eventFunctionName: { type: 'string', description: 'Step 1 — Event Function' },
        venueName: { type: 'string', description: 'Step 1 — Venue Name' },
        cityName: { type: 'string', description: 'Step 1 — City Name' },
        clientName: { type: 'string', description: 'Step 2 — Client Name' },
        clientAddress: { type: 'string', description: 'Step 2 — Client Address' },
        clientMobile: { type: 'string', description: 'Step 2 — Client Contact No' },
        reference: { type: 'string', description: 'Step 2 — Reference' },
        isHighPriority: { type: 'boolean', default: false, description: 'Step 2 — High Priority' },
        tabletMedia: { $ref: '#/components/schemas/ManagerTabletMedia' },
        brideGroomInformation: { $ref: '#/components/schemas/ManagerBrideGroomInformation' },
        functions: {
          type: 'array',
          description: 'Step 3/4 — Function Details',
          items: { $ref: '#/components/schemas/EventFunction' },
        },
      },
    },
    UpdateManagerAllTasksRequest: {
      type: 'object',
      description: 'Partial update for the manager All Tasks screen',
      properties: {
        actualArrivalTime: { type: 'string', example: '05:30:00', description: 'HH:mm:ss 24-hour format' },
        followersAchievedCount: { type: 'integer', minimum: 0, example: 22 },
        testimonialReelsAchievedCount: { type: 'integer', minimum: 0, example: 1 },
        activeSessionRecording: { type: 'boolean', example: true },
        numberOfVideoShoots: { type: 'integer', minimum: 0, example: 3 },
        mainEventHighlights: { type: 'boolean', example: true },
        photosCaptured: { type: 'integer', minimum: 0, example: 45 },
        amountCollected: { type: 'number', minimum: 0, example: 22000 },
      },
    },
    CompleteManagerAllTasksRequest: {
      type: 'object',
      description:
        'Optional body for Submit. Send amountCollected here to save and complete in one call, or save it earlier via PATCH /all-tasks.',
      properties: {
        amountCollected: { type: 'number', minimum: 0, example: 32300 },
      },
    },
    ManagerAllTaskAttachment: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        eventId: { type: 'integer' },
        fileUrl: { type: 'string', format: 'uri' },
        originalName: { type: 'string' },
        mimeType: { type: 'string' },
        sizeBytes: { type: 'integer' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    EventReel: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        eventId: { type: 'integer' },
        ourEventId: { type: 'integer', description: 'Selected Our Events title ID' },
        ourEventUuid: { type: 'string', format: 'uuid', nullable: true },
        ourEventName: { type: 'string', example: 'Reception', nullable: true },
        videoUrl: { type: 'string', format: 'uri' },
        name: { type: 'string', example: 'Wedding Highlights' },
        venueName: { type: 'string', example: 'Grand Ballroom' },
        guestCount: { type: 'integer', minimum: 1, example: 250 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    EventReelList: {
      type: 'array',
      items: { $ref: '#/components/schemas/EventReel' },
    },
    PaginatedEventReelList: {
      type: 'object',
      properties: {
        items: { $ref: '#/components/schemas/EventReelList' },
        pagination: { $ref: '#/components/schemas/PaginationMeta' },
      },
    },
    PublicEventReelsResponse: {
      type: 'object',
      properties: {
        eventId: { type: 'integer' },
        eventUuid: { type: 'string', format: 'uuid' },
        venueName: { type: 'string', nullable: true },
        reels: { $ref: '#/components/schemas/EventReelList' },
      },
    },
    ClientFlowEventCategory: {
      type: 'object',
      properties: {
        id: { type: 'integer', nullable: true, description: 'Null for All Setups' },
        uuid: { type: 'string', format: 'uuid', nullable: true },
        name: { type: 'string', example: 'Weddings' },
        sortOrder: { type: 'integer', example: 0 },
      },
    },
    ClientFlowReelsResponse: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: { $ref: '#/components/schemas/ClientFlowEventCategory' },
        },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/ClientFlowReelCard' },
        },
        pagination: { $ref: '#/components/schemas/PaginationMeta' },
      },
    },
    ClientFlowReelsByEventResponse: {
      type: 'object',
      properties: {
        eventId: { type: 'integer' },
        eventUuid: { type: 'string', format: 'uuid' },
        venueName: { type: 'string', nullable: true },
        cityName: { type: 'string', nullable: true },
        categories: {
          type: 'array',
          items: { $ref: '#/components/schemas/ClientFlowEventCategory' },
        },
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/ClientFlowReelCard' },
        },
      },
    },
    ClientFlowEventsResponse: {
      deprecated: true,
      description: 'Use ClientFlowReelsResponse',
      allOf: [{ $ref: '#/components/schemas/ClientFlowReelsResponse' }],
    },
    ClientFlowParentEventResponse: {
      deprecated: true,
      description: 'Use ClientFlowReelsByEventResponse',
      allOf: [{ $ref: '#/components/schemas/ClientFlowReelsByEventResponse' }],
    },
    ClientFlowEventCard: {
      deprecated: true,
      description: 'Use ClientFlowReelCard',
      allOf: [{ $ref: '#/components/schemas/ClientFlowReelCard' }],
    },
    ClientFlowReelCard: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        title: { type: 'string', example: 'Narmada Royal Soirée' },
        name: { type: 'string', example: 'Narmada Royal Soirée' },
        videoUrl: { type: 'string', format: 'uri' },
        venueName: { type: 'string', example: 'Ahmedabad' },
        guestCount: { type: 'integer', example: 500 },
        guestCountLabel: { type: 'string', example: '500+ Guests' },
        ourEventId: { type: 'integer', nullable: true },
        ourEventUuid: { type: 'string', format: 'uuid', nullable: true },
        ourEventName: { type: 'string', example: 'Weddings', nullable: true },
        providerName: { type: 'string', example: 'Ambrosia Catering' },
        catererName: { type: 'string', nullable: true },
        cityName: { type: 'string', example: 'Ahmedabad', nullable: true },
        eventId: { type: 'integer' },
        eventUuid: { type: 'string', format: 'uuid', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    CreateReelRequest: {
      type: 'object',
      required: ['ourEventId', 'name', 'venueName', 'guestCount', 'file'],
      properties: {
        ourEventId: {
          oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }],
          description: 'Selected Our Events category (from GET /our-events?forSelect=true)',
          example: 1,
        },
        file: { type: 'string', format: 'binary', description: 'Video file (MP4, MOV, WebM)' },
        name: { type: 'string', example: 'Wedding Highlights' },
        venueName: { type: 'string', example: 'Grand Ballroom' },
        guestCount: { type: 'integer', minimum: 1, example: 250 },
      },
    },
    UpdateReelRequest: {
      type: 'object',
      minProperties: 1,
      properties: {
        name: { type: 'string' },
        venueName: { type: 'string' },
        guestCount: { type: 'integer', minimum: 1 },
      },
    },
    DiscoverExperience: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        videoUrl: { type: 'string', format: 'uri' },
        description: { type: 'string' },
        sortOrder: { type: 'integer', minimum: 0 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    DiscoverExperienceList: {
      type: 'array',
      items: { $ref: '#/components/schemas/DiscoverExperience' },
    },
    CreateDiscoverExperienceRequest: {
      type: 'object',
      required: ['file', 'description'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Video file (MP4, MOV, WebM)' },
        description: { type: 'string', example: 'Experience our premium catering service' },
        sortOrder: { type: 'integer', minimum: 0, default: 0 },
      },
    },
    UpdateDiscoverExperienceRequest: {
      type: 'object',
      minProperties: 1,
      properties: {
        file: { type: 'string', format: 'binary', description: 'Optional replacement video' },
        description: { type: 'string' },
        sortOrder: { type: 'integer', minimum: 0 },
      },
    },
    Testimonial: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
        name: { type: 'string', example: 'Priya Sharma' },
        description: { type: 'string', example: 'Amazing food and service!' },
        videoUrl: { type: 'string', format: 'uri', nullable: true },
        sortOrder: { type: 'integer', minimum: 0 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    TestimonialList: {
      type: 'array',
      items: { $ref: '#/components/schemas/Testimonial' },
    },
    CreateTestimonialRequest: {
      type: 'object',
      required: ['rating', 'name', 'description'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Optional testimonial video' },
        rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
        name: { type: 'string', example: 'Priya Sharma' },
        description: { type: 'string', example: 'Amazing food and service!' },
        sortOrder: { type: 'integer', minimum: 0, default: 0 },
      },
    },
    UpdateTestimonialRequest: {
      type: 'object',
      minProperties: 1,
      properties: {
        file: { type: 'string', format: 'binary', description: 'Optional replacement video' },
        rating: { type: 'integer', minimum: 1, maximum: 5 },
        name: { type: 'string' },
        description: { type: 'string' },
        sortOrder: { type: 'integer', minimum: 0 },
      },
    },
    PublicClientDashboardResponse: {
      type: 'object',
      properties: {
        discoverExperiences: { $ref: '#/components/schemas/DiscoverExperienceList' },
        testimonials: { $ref: '#/components/schemas/TestimonialList' },
      },
    },
    ClientEventTitle: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        eventId: { type: 'integer' },
        name: { type: 'string', example: 'Reception' },
        sortOrder: { type: 'integer', minimum: 0, example: 0 },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    ClientEventTitleList: {
      type: 'array',
      items: { $ref: '#/components/schemas/ClientEventTitle' },
    },
    ClientEventTitleSelectList: {
      type: 'object',
      properties: {
        items: { $ref: '#/components/schemas/ClientEventTitleList' },
      },
    },
    CreateClientEventTitleRequest: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Reception' },
        sortOrder: { type: 'integer', minimum: 0, default: 0 },
        isActive: { type: 'boolean', default: true },
      },
    },
    PublicClientEventTitlesResponse: {
      type: 'object',
      properties: {
        eventId: { type: 'integer' },
        eventUuid: { type: 'string', format: 'uuid' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              uuid: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              sortOrder: { type: 'integer' },
            },
          },
        },
      },
    },
    ManagerAllTasksResponse: {
      type: 'object',
      properties: {
        eventId: { type: 'string' },
        eventUuid: { type: 'string', format: 'uuid' },
        status: { type: 'string', enum: ['in_progress', 'completed', 'abandoned'] },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string', nullable: true },
              type: {
                type: 'string',
                enum: ['time', 'count_progress', 'media_tracking', 'billing', 'attachments'],
              },
              target: { type: 'number', nullable: true },
              targetLabel: { type: 'string', nullable: true },
              reportingTime: { type: 'string', nullable: true, example: '05:00 AM' },
              actualArrivalTime: { type: 'string', nullable: true },
              achievedCount: { type: 'integer', nullable: true },
              progressPercentage: { type: 'integer', nullable: true },
              activeSessionRecordingStatus: { type: 'boolean', nullable: true },
              numberOfVideoShoots: { type: 'integer', nullable: true },
              mainEventHighlightsStatus: { type: 'boolean', nullable: true },
              photosCaptured: { type: 'integer', nullable: true },
              amountCollected: { type: 'number', nullable: true },
              acceptedTypes: { type: 'array', items: { type: 'string' }, nullable: true },
              maxFileSizeMb: { type: 'integer', nullable: true },
            },
          },
        },
        attachments: {
          type: 'array',
          items: { $ref: '#/components/schemas/ManagerAllTaskAttachment' },
        },
        completedAt: { type: 'string', format: 'date-time', nullable: true },
        abandonedAt: { type: 'string', format: 'date-time', nullable: true },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    JustTapInformation: {
      type: 'object',
      description: 'Create Event step 4 — Just Tap Information (replaces former Menu Package tab)',
      properties: {
        noOfTablets: { type: 'integer', example: 10 },
        noOfManagers: { type: 'integer', example: 10 },
        assignedManagerIds: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Manager staff IDs from GET /managers (forSelect=true). Captain is the same role — use manager endpoints only.',
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
    EventListItem: {
      type: 'object',
      description: 'Event summary returned in list, today, and upcoming responses.',
      properties: {
        id: { type: 'string' },
        uuid: { type: 'string', format: 'uuid' },
        clientName: { type: 'string' },
        venueName: { type: 'string' },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        status: { $ref: '#/components/schemas/EventStatus' },
        managerName: {
          type: 'string',
          nullable: true,
          description: 'Comma-separated names of all assigned managers',
        },
        managerNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'Names of all assigned managers',
        },
        assignedManagerIds: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Staff IDs of all assigned managers',
        },
        assignedManagerId: {
          type: 'integer',
          nullable: true,
          description: 'Primary manager (first in assignedManagerIds)',
        },
      },
    },
    EventListResponse: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/EventListItem' } },
        pagination: { $ref: '#/components/schemas/PaginationMeta' },
      },
    },
    EventListItemsArray: {
      type: 'array',
      items: { $ref: '#/components/schemas/EventListItem' },
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
        id: { type: 'integer', example: 14 },
        uuid: { type: 'string', format: 'uuid', example: '9a9575d7-784f-11f1-945a-7a40d310aa11' },
        name: { type: 'string', example: 'testy', description: 'Display name in Create Event client dropdown' },
        catererName: { type: 'string', example: 'testy', nullable: true },
        clientAddress: { type: 'string', nullable: true },
        cityName: { type: 'string', example: '', nullable: true },
        contactNo: { type: 'string', example: '+919811122233', nullable: true },
        reference: { type: 'string', example: '', nullable: true },
        isHighPriority: { type: 'boolean', example: false },
        createdAt: { type: 'string', example: '2026-07-05 08:57:51' },
        updatedAt: { type: 'string', example: '2026-07-05 08:57:51' },
      },
    },
    FunctionName: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        uuid: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Mehendi Ceremony' },
        sortOrder: { type: 'integer', example: 2 },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    FunctionNameSelectList: {
      type: 'object',
      description: 'Function name list for Create Event dropdown. Returned by `GET /function-names?forSelect=true`.',
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/FunctionName' },
        },
      },
      example: {
        items: [
          { id: 1, uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Breakfast', sortOrder: 1, isActive: true },
          { id: 2, uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', name: 'Mehendi Ceremony', sortOrder: 2, isActive: true },
          { id: 3, uuid: 'c3d4e5f6-a7b8-9012-cdef-123456789012', name: 'Sangeet', sortOrder: 3, isActive: true },
        ],
      },
    },
    CreateFunctionNameRequest: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Reception' },
        sortOrder: { type: 'integer', minimum: 0, default: 0 },
        isActive: { type: 'boolean', default: true },
      },
    },
    UpdateFunctionNameRequest: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Wedding Reception' },
        sortOrder: { type: 'integer', minimum: 0 },
        isActive: { type: 'boolean' },
      },
    },
    CreateManagerRequest: {
      type: 'object',
      required: ['memberName'],
      properties: {
        memberName: { type: 'string', example: 'Julian Reed', description: 'Display name for the new manager' },
        name: { type: 'string', example: 'Julian Reed', description: 'Alias for memberName' },
        designation: { type: 'string', example: 'Content Strategist', nullable: true },
        isActive: { type: 'boolean', default: true },
        email: { type: 'string', format: 'email', description: 'Optional portal login email (registers manager when password is also sent)' },
        username: { type: 'string', format: 'email', description: 'Alias for email' },
        password: { type: 'string', minLength: 6, description: 'Optional portal login password' },
      },
      example: {
        memberName: 'Julian Reed',
        designation: 'Content Strategist',
      },
    },
    RegisterManagerRequest: {
      type: 'object',
      required: ['password'],
      description:
        'Set manager portal login credentials. Use `email` (or `username` as alias) plus `password`. Manager logs in at POST /api/manager/auth/login with identifier=email.',
      properties: {
        email: { type: 'string', format: 'email', example: 'manager@example.com', description: 'Login email / username' },
        username: { type: 'string', format: 'email', example: 'manager@example.com', description: 'Alias for email' },
        password: { type: 'string', minLength: 6, example: 'secret123' },
      },
      example: {
        email: 'manager@example.com',
        password: 'secret123',
      },
    },
    CreateClientRequest: {
      type: 'object',
      required: ['name'],
      description: 'Quick-add from Create Event uses name only; other fields can be filled later on the event form.',
      properties: {
        name: { type: 'string', example: 'testy' },
        catererName: { type: 'string', example: 'Sai Caterer', nullable: true },
        cityName: { type: 'string', example: 'Baroda', nullable: true },
        contactNo: { type: 'string', example: '+918264737487', nullable: true },
        reference: { type: 'string', example: 'Friend', nullable: true },
        isHighPriority: { type: 'boolean', default: false },
      },
      example: { name: 'testy' },
    },
    Inquiry: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        uuid: { type: 'string', format: 'uuid' },
        refNumber: { type: 'string' },
        clientName: { type: 'string' },
        clientPhone: { type: 'string', nullable: true },
        dateType: { type: 'string', enum: ['single', 'multiple'] },
        eventDate: { type: 'string', format: 'date', nullable: true },
        timeSlot: { type: 'string', nullable: true },
        venue: { type: 'string', nullable: true },
        functionName: { type: 'string', nullable: true },
        packageName: { type: 'string', nullable: true },
        capacity: { type: 'string', nullable: true },
        totalEstimate: { type: 'number', nullable: true },
        source: { type: 'string', enum: ['admin', 'client'] },
        selectedDaysCount: { type: 'integer' },
        eventDays: {
          type: 'array',
          items: { $ref: '#/components/schemas/InquiryDay' },
        },
        status: { type: 'string', enum: ['pending', 'converted'] },
      },
    },
    InquiryDay: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        dayNumber: { type: 'integer' },
        date: { type: 'string', format: 'date' },
        venueName: { type: 'string' },
        functionName: { type: 'string' },
        city: { type: 'string' },
        tabletsCount: { type: 'integer' },
        timeSlot: { type: 'string' },
      },
    },
    CreateClientInquiryRequest: {
      type: 'object',
      required: ['companyName', 'contactNumber', 'dateType', 'eventDay'],
      properties: {
        companyName: { type: 'string', example: 'Grand Events Pvt Ltd' },
        contactNumber: { type: 'string', example: '+919876543210' },
        dateType: { type: 'string', enum: ['single', 'multiple'], example: 'multiple' },
        totalEstimate: { type: 'number', example: 4850 },
        eventDay: {
          type: 'object',
          required: ['date', 'venueName', 'functionName', 'city', 'tabletsCount', 'timeSlot'],
          properties: {
            date: { type: 'string', format: 'date', example: '2024-10-24' },
            venueName: { type: 'string', example: 'The Grand Amber Ballroom' },
            functionName: { type: 'string', example: 'Welcome Reception' },
            city: { type: 'string', example: 'Mumbai' },
            tabletsCount: { type: 'integer', example: 12 },
            timeSlot: { type: 'string', example: 'Morning' },
          },
        },
      },
    },
    ClientInquiryCreateResponse: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        uuid: { type: 'string', format: 'uuid' },
        refNumber: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'converted'] },
        dateType: { type: 'string', enum: ['single', 'multiple'] },
        selectedDaysCount: { type: 'integer' },
        totalEstimate: { type: 'number', nullable: true },
        message: { type: 'string' },
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
        id: { type: 'string', example: '1' },
        uuid: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'Starters' },
        description: { type: 'string', nullable: true },
        slogan: { type: 'string', nullable: true, example: 'स्टारters' },
        imageUrl: { type: 'string', nullable: true, example: 'http://localhost:3000/uploads/images/abc.jpg' },
        sortOrder: { type: 'integer' },
        itemCount: { type: 'integer' },
      },
    },
    PaginatedMenuCategoryList: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/MenuCategory' } },
        pagination: { $ref: '#/components/schemas/PaginationMeta' },
      },
    },
    MenuSubCategory: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '2' },
        uuid: { type: 'string', format: 'uuid' },
        name: { type: 'string', example: 'North Indian' },
        categoryId: { type: 'integer', example: 1 },
        category: { type: 'string', example: 'Starters' },
        sortOrder: { type: 'integer' },
      },
    },
    PaginatedMenuSubCategoryList: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/MenuSubCategory' } },
        pagination: { $ref: '#/components/schemas/PaginationMeta' },
      },
    },
    MenuItem: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '9' },
        uuid: { type: 'string', format: 'uuid' },
        categoryId: { type: 'integer', example: 1 },
        subcategoryId: { type: 'integer', nullable: true, example: 2 },
        subcategory: { type: 'string', nullable: true, example: 'North Indian' },
        name: { type: 'string', example: 'Paneer Tikka' },
        description: { type: 'string', nullable: true },
        slogan: { type: 'string', nullable: true, example: 'पनीर टिक्का' },
        price: { type: 'string', example: '350.00' },
        isVeg: { type: 'boolean' },
        imageUrl: { type: 'string', nullable: true, example: 'http://localhost:3000/uploads/images/item.jpg' },
        isBestSeller: { type: 'boolean' },
        isActive: { type: 'boolean' },
      },
    },
    PaginatedMenuItemList: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/MenuItem' } },
        pagination: { $ref: '#/components/schemas/PaginationMeta' },
      },
    },
    CreateMenuCategoryRequest: {
      type: 'object',
      description: 'Menu Item Category form — provide `name_english` or `name`. Upload photo first via POST /uploads/images.',
      properties: {
        name: { type: 'string', example: 'Starters' },
        name_english: { type: 'string', example: 'Starters' },
        description: { type: 'string' },
        slogan: { type: 'string', example: 'स्टारters', description: 'Hindi name or tagline (Slogan field in UI)' },
        image_url: { type: 'string', format: 'uri', example: 'http://localhost:3000/uploads/images/category.jpg' },
        sort_order: { type: 'integer', minimum: 0 },
      },
      example: {
        name_english: 'Starters',
        slogan: 'स्टारters',
        image_url: 'http://localhost:3000/uploads/images/category.jpg',
      },
    },
    CreateMenuSubCategoryRequest: {
      type: 'object',
      description: 'Menu Sub Item Category form — name only, linked to a parent category.',
      required: ['category_id'],
      properties: {
        category_id: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }], example: 1 },
        name: { type: 'string', example: 'North Indian' },
        name_english: { type: 'string', example: 'North Indian' },
        sort_order: { type: 'integer', minimum: 0 },
      },
      example: {
        category_id: 1,
        name_english: 'North Indian',
      },
    },
    CreateMenuItemRequest: {
      type: 'object',
      description: 'Add new item form — select category and subcategory from dropdowns or create them inline first.',
      required: ['category_id'],
      properties: {
        category_id: { type: 'integer', example: 1, description: 'Menu Item Category (dropdown)' },
        subcategory_id: {
          oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }],
          nullable: true,
          example: 2,
          description: 'Menu Item Sub Category (dropdown)',
        },
        name: { type: 'string', example: 'Paneer Tikka' },
        name_english: { type: 'string', example: 'Paneer Tikka' },
        description: { type: 'string' },
        slogan: { type: 'string', example: 'पनीर टिक्का', description: 'Hindi name or tagline (Slogan field in UI)' },
        price: { type: 'number', minimum: 0, example: 0, default: 0 },
        is_veg: { type: 'boolean', default: true },
        image_url: { type: 'string', format: 'uri', example: 'http://localhost:3000/uploads/images/item.jpg' },
        is_best_seller: { type: 'boolean' },
        is_active: { type: 'boolean' },
      },
      example: {
        name_english: 'Paneer Tikka',
        slogan: 'पनीर टिक्का',
        category_id: 1,
        subcategory_id: 2,
        image_url: 'http://localhost:3000/uploads/images/item.jpg',
        price: 0,
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
        role: { type: 'string', enum: ['event_manager', 'waiter', 'other'] },
        designation: { type: 'string', nullable: true },
        isActive: { type: 'boolean' },
        userId: { type: 'integer', nullable: true, description: 'Linked portal user ID when registered' },
        email: { type: 'string', format: 'email', nullable: true, description: 'Portal login email when registered' },
        isRegistered: { type: 'boolean', description: 'True when manager has portal login credentials' },
      },
    },
    CreateStaffRequest: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Amit Patel' },
        role: { type: 'string', enum: ['event_manager', 'waiter', 'other'] },
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
            role: { type: 'string', enum: ['event_manager', 'waiter', 'other'] },
          },
        },
      ],
    },
    TeamAllocationMember: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Staff ID' },
        name: { type: 'string' },
        role: { type: 'string' },
        badge: { type: 'string', example: 'LEAD' },
        assignments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Assignment pill labels shown on the allocation board',
        },
        statusLabel: { type: 'string', example: 'CURRENTLY ACTIVE' },
        statusKey: { type: 'string', example: 'active' },
      },
    },
    TeamAllocationSummary: {
      type: 'object',
      properties: {
        totalStaff: { type: 'integer' },
        activeTasks: { type: 'integer' },
        todayAdded: { type: 'integer' },
        members: {
          type: 'array',
          items: { $ref: '#/components/schemas/TeamAllocationMember' },
        },
      },
    },
    ManagerStaffReportTask: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        time: { type: 'string', example: '07:21' },
        isLocked: { type: 'boolean' },
      },
    },
    ManagerStaffReport: {
      type: 'object',
      properties: {
        manager: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string', example: 'Event Manager' },
            isActive: { type: 'boolean' },
          },
        },
        efficiencyScore: { type: 'number', example: 0 },
        assignedTables: {
          type: 'array',
          items: { type: 'string' },
          description: 'Assigned table pill labels on the Manager Report screen (table numbers assigned to this manager)',
          example: ['Table 1', 'Table 2', 'Table 3'],
        },
        stats: {
          type: 'object',
          properties: {
            interactions: { type: 'integer' },
            filesCaptured: { type: 'integer' },
            activeTimeLabel: { type: 'string', example: '60m' },
            tasksCompletedLabel: { type: 'string', example: '0/3' },
          },
        },
        doneTasks: {
          type: 'array',
          items: { $ref: '#/components/schemas/ManagerStaffReportTask' },
        },
        pendingTasks: {
          type: 'array',
          items: { $ref: '#/components/schemas/ManagerStaffReportTask' },
        },
        activityTimeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'integer' },
            },
          },
        },
      },
    },
    TeamAllocationStaffSubTask: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Event task ID' },
        task_template_id: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }], nullable: true },
        title: { type: 'string' },
        description: { type: 'string', nullable: true },
        due_date: { type: 'string', format: 'date', nullable: true },
        status: {
          type: 'string',
          enum: ['pending', 'assigned', 'in_progress', 'completed', 'overdue'],
        },
      },
    },
    TeamAllocationStaffTask: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Event task ID' },
        task_template_id: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }], nullable: true },
        name: { type: 'string', description: 'Assigned task title' },
        description: { type: 'string', nullable: true },
        due_date: { type: 'string', format: 'date', nullable: true },
        status: {
          type: 'string',
          enum: ['pending', 'assigned', 'in_progress', 'completed', 'overdue'],
        },
        isAssigned: {
          type: 'boolean',
          description: 'Always true in this list — only assigned operational tasks are returned',
        },
        isCompleted: {
          type: 'boolean',
          description: 'True when the manager has marked this task completed',
        },
        updatedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    TeamAllocationStaffTasks: {
      type: 'object',
      properties: {
        staff: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' },
          },
        },
        summary: {
          type: 'object',
          description: 'Assigned task progress for admin manager view',
          properties: {
            total: { type: 'integer', description: 'Total assigned tasks on this team board' },
            completed: { type: 'integer', description: 'Tasks with status completed' },
            pending: { type: 'integer', description: 'Tasks not yet completed' },
            tasksCompletedLabel: { type: 'string', example: '2/5' },
          },
        },
        tasks: {
          type: 'array',
          items: { $ref: '#/components/schemas/TeamAllocationStaffTask' },
        },
      },
    },
    AssignTeamTasksRequest: {
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
              task_template_id: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }], nullable: true },
              title: { type: 'string' },
              description: { type: 'string', nullable: true },
              due_date: { type: 'string', format: 'date-time', nullable: true },
            },
          },
        },
        assignedTo: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }], nullable: true },
      },
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
    EventTaskAssignment: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        uuid: { type: 'string', format: 'uuid' },
        eventId: { type: 'integer' },
        eventUuid: { type: 'string', format: 'uuid', nullable: true },
        eventClientName: { type: 'string', nullable: true },
        eventVenue: { type: 'string', nullable: true },
        taskTemplateId: { type: 'integer', nullable: true },
        title: { type: 'string' },
        description: { type: 'string', nullable: true },
        status: { type: 'string', enum: ['pending', 'assigned', 'in_progress', 'completed', 'overdue'] },
        assignedTo: { oneOf: [{ type: 'integer' }, { type: 'string' }], nullable: true, description: 'Manager staff ID' },
        assigneeName: { type: 'string', nullable: true, description: 'Manager name' },
        dueDate: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
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
    FeedbackQuestion: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        uuid: { type: 'string', format: 'uuid' },
        questionText: { type: 'string', example: 'How was the food quality?' },
        questionType: { type: 'string', enum: ['rating', 'text', 'single_choice', 'multiple_choice', 'yes_no'] },
        options: { type: 'array', items: { type: 'string' }, nullable: true, example: ['Excellent', 'Good', 'Average', 'Poor'] },
        isRequired: { type: 'boolean' },
        sortOrder: { type: 'integer' },
        isActive: { type: 'boolean' },
        eventId: { type: 'string', nullable: true, description: 'Null for global questions' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    FeedbackQuestionList: {
      type: 'array',
      items: { $ref: '#/components/schemas/FeedbackQuestion' },
    },
    CreateFeedbackQuestionRequest: {
      type: 'object',
      required: ['questionText', 'questionType'],
      properties: {
        questionText: { type: 'string', example: 'How was the service?' },
        questionType: { type: 'string', enum: ['rating', 'text', 'single_choice', 'multiple_choice', 'yes_no'] },
        options: { type: 'array', items: { type: 'string' }, example: ['Yes', 'No'] },
        isRequired: { type: 'boolean', default: true },
        sortOrder: { type: 'integer', default: 0 },
        isActive: { type: 'boolean', default: true },
        eventId: { type: 'string', nullable: true, description: 'Omit or null for global questions' },
      },
    },
    CreateEventFeedbackQuestionRequest: {
      type: 'object',
      properties: {
        questionText: { type: 'string', example: 'How was Food?' },
        question: { type: 'string', example: 'Service Speed', description: 'Alias for questionText' },
        questionType: { type: 'string', enum: ['rating', 'text', 'single_choice', 'multiple_choice', 'yes_no'], default: 'rating' },
        options: { type: 'array', items: { type: 'string' }, example: ['Yes', 'No'] },
        isRequired: { type: 'boolean', default: true },
        sortOrder: { type: 'integer' },
        isActive: { type: 'boolean', default: true },
        audience: { type: 'string', enum: ['guest_catering', 'client_service'], description: 'Optional audience tag for guest/client feedback flows' },
      },
    },
    UpdateFeedbackQuestionRequest: {
      type: 'object',
      properties: {
        questionText: { type: 'string' },
        questionType: { type: 'string', enum: ['rating', 'text', 'single_choice', 'multiple_choice', 'yes_no'] },
        options: { type: 'array', items: { type: 'string' } },
        isRequired: { type: 'boolean' },
        sortOrder: { type: 'integer' },
        isActive: { type: 'boolean' },
        eventId: { type: 'string', nullable: true },
      },
    },
    ReorderFeedbackQuestionsRequest: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['id', 'sortOrder'],
            properties: {
              id: { $ref: '#/components/schemas/IdParam' },
              sortOrder: { type: 'integer', minimum: 0 },
            },
          },
        },
      },
    },
    SubmitFeedbackQuestionnaireRequest: {
      type: 'object',
      required: ['eventId', 'answers'],
      properties: {
        eventId: { $ref: '#/components/schemas/IdParam' },
        clientName: { type: 'string', example: 'John Doe' },
        tableNo: { type: 'string', example: 'T-12' },
        answers: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['questionId'],
            properties: {
              questionId: { $ref: '#/components/schemas/IdParam' },
              answerText: { type: 'string', example: 'Excellent' },
              answerRating: { type: 'number', minimum: 1, maximum: 5, example: 4.5 },
              answerOptions: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
    FeedbackSubmission: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        uuid: { type: 'string', format: 'uuid' },
        eventId: { type: 'string' },
        clientName: { type: 'string', nullable: true },
        tableNo: { type: 'string', nullable: true },
        responses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              questionId: { type: 'string' },
              answerText: { type: 'string', nullable: true },
              answerRating: { type: 'number', nullable: true },
              answerOptions: { type: 'array', items: { type: 'string' }, nullable: true },
            },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
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
      properties: {
        label: { type: 'string', example: 'Decoration', description: 'Charge label (alias: description)' },
        description: { type: 'string', example: 'Decoration', description: 'Alias for label' },
        amount: { type: 'number', example: 5000 },
      },
    },
    BillingFunction: {
      type: 'object',
      required: ['name'],
      properties: {
        eventFunctionId: { $ref: '#/components/schemas/IdParam', nullable: true },
        name: { type: 'string', example: 'Dinner' },
        description: { type: 'string', example: 'Main reception dinner', description: 'Function-level description' },
        date: { type: 'string', format: 'date', example: '2025-06-12' },
        startTime: { type: 'string', example: '08:00 PM' },
        pax: { type: 'integer', example: 850 },
        extraCharges: { type: 'number', example: 0, description: 'Extra amount for this function' },
        extraAmount: { type: 'number', example: 0, description: 'Alias for extraCharges' },
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
        description: { type: 'string', example: 'Bank Transfer', description: 'Payment method or note' },
      },
    },
    SaveBillingPreviewRequest: {
      type: 'object',
      properties: {
        showToClient: { type: 'boolean', default: false, description: 'When true, billing is visible in the client app' },
        functions: { type: 'array', items: { $ref: '#/components/schemas/BillingFunction' } },
        estimate: { $ref: '#/components/schemas/BillingEstimate' },
        payments: {
          type: 'array',
          items: { $ref: '#/components/schemas/BillingPayment' },
          description: 'Advance payment entries (alias: advancePayments)',
        },
        advancePayments: {
          type: 'array',
          items: { $ref: '#/components/schemas/BillingPayment' },
          description: 'Advance payment list (alias for payments)',
        },
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
        advancePayments: {
          type: 'array',
          items: { $ref: '#/components/schemas/BillingPayment' },
          description: 'Advance payment list (same as payments)',
        },
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
        advancePayments: {
          type: 'array',
          items: { $ref: '#/components/schemas/BillingPayment' },
          description: 'Advance payment list (same as payments)',
        },
        totalPaid: { type: 'number' },
        remainingPayment: { type: 'number' },
        notes: { type: 'string' },
        previewedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    SaveManagerCostRequest: {
      type: 'object',
      properties: {
        clientCost: { type: 'number', minimum: 0, nullable: true, example: 3500 },
        tabletCost: { type: 'number', minimum: 0, nullable: true },
        transportationCost: { type: 'number', minimum: 0, nullable: true },
        assignManagerCost: { type: 'number', minimum: 0, nullable: true },
        photographyVideographyCost: { type: 'number', minimum: 0, nullable: true },
        otherCharges: { type: 'number', minimum: 0, nullable: true },
      },
    },
    EventManagerCost: {
      type: 'object',
      properties: {
        id: { type: 'string', nullable: true },
        eventId: { type: 'string' },
        eventDetails: { type: 'string', description: 'Read-only event label (client name)' },
        clientCost: { type: 'number', nullable: true, example: 3500 },
        tabletCost: { type: 'number', nullable: true },
        transportationCost: { type: 'number', nullable: true },
        assignManagerCost: { type: 'number', nullable: true },
        photographyVideographyCost: { type: 'number', nullable: true },
        otherCharges: { type: 'number', nullable: true },
        totalCost: { type: 'number', example: 3500 },
        filled: { type: 'boolean', description: 'True when cost data has been saved at least once' },
        updatedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    ManagerEvaluateIncomeTask: {
      type: 'object',
      required: ['id', 'name', 'status', 'statusLabel', 'eventId', 'income'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string', example: 'testing123' },
        status: { type: 'string', example: 'pending' },
        statusLabel: { type: 'string', enum: ['Pending Task', 'Complete Task'] },
        eventId: { type: 'string' },
        income: { type: 'number', minimum: 0, example: 0 },
      },
    },
    ManagerEvaluateIncomeResponse: {
      type: 'object',
      required: ['manager', 'summary', 'income'],
      properties: {
        manager: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'priyang' },
          },
        },
        summary: {
          type: 'object',
          required: ['totalTasks', 'pendingTasks', 'completedTasks'],
          properties: {
            totalTasks: { type: 'integer', minimum: 0, example: 0 },
            pendingTasks: { type: 'integer', minimum: 0, example: 0 },
            completedTasks: { type: 'integer', minimum: 0, example: 0 },
          },
        },
        income: {
          type: 'object',
          required: ['tasks', 'totalIncome'],
          properties: {
            tasks: {
              type: 'array',
              items: { $ref: '#/components/schemas/ManagerEvaluateIncomeTask' },
            },
            totalIncome: { type: 'number', minimum: 0, example: 90000 },
          },
        },
      },
    },
    TableAssignment: {
      type: 'object',
      required: ['tableNumber', 'allocationType'],
      properties: {
        tableNumber: { type: 'integer' },
        allocationType: { type: 'string', enum: ['dining', 'captain'] },
        staffId: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }], nullable: true, description: 'Manager staff assigned to this table' },
        staffName: { type: 'string', nullable: true, description: 'Assigned manager name (read-only)' },
        userCode: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        eventLabel: { type: 'string', nullable: true },
        isAssigned: { type: 'boolean', description: 'True when a manager or user code is set (read-only)' },
      },
    },
    AssignTableManagerRequest: {
      type: 'object',
      required: ['staffId'],
      properties: {
        staffId: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }], description: 'Event manager to assign to the selected table' },
        allocationType: { type: 'string', enum: ['dining', 'captain'], default: 'dining', description: 'Use `dining` for Table View, `captain` for Captain View' },
      },
    },
    AssignManagerTablesRequest: {
      type: 'object',
      required: ['staffId', 'tableNumbers'],
      properties: {
        staffId: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }], description: 'Manager staff ID (numeric or UUID)' },
        tableNumbers: { type: 'array', minItems: 1, items: { type: 'integer', minimum: 1 }, example: [1, 2, 3] },
        allocationType: { type: 'string', enum: ['dining', 'captain'], default: 'dining' },
      },
    },
    AssignEventManagersRequest: {
      type: 'object',
      required: ['assignedManagerIds'],
      properties: {
        assignedManagerIds: {
          type: 'array',
          minItems: 1,
          maxItems: 50,
          items: { oneOf: [{ type: 'integer' }, { type: 'string', format: 'uuid' }] },
          description: 'Event manager staff IDs from GET /managers?forSelect=true. First ID becomes the primary assigned manager.',
          example: [1, 2],
        },
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
    ReportIdRequest: {
      type: 'object',
      required: ['reportId'],
      properties: {
        reportId: { $ref: '#/components/schemas/IdParam' },
      },
    },
    CreateReportRequest: {
      type: 'object',
      required: ['eventId'],
      properties: {
        eventId: { $ref: '#/components/schemas/IdParam' },
        packageId: { $ref: '#/components/schemas/IdParam', nullable: true },
        templateId: { $ref: '#/components/schemas/IdParam', nullable: true },
        includeMenuInTemplate: { type: 'boolean', default: true },
        layoutPosition: { type: 'string', enum: ['top', 'background', 'side'], nullable: true },
      },
      example: {
        eventId: 1,
        packageId: 2,
        includeMenuInTemplate: true,
        layoutPosition: 'top',
      },
    },
    SelectReportTemplateRequest: {
      type: 'object',
      required: ['reportId', 'templateId'],
      properties: {
        reportId: { $ref: '#/components/schemas/IdParam' },
        templateId: { $ref: '#/components/schemas/IdParam' },
      },
    },
    ReportColorValue: {
      type: 'object',
      required: ['hex'],
      properties: {
        hex: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', example: '#D4AF37' },
        opacity: { type: 'number', minimum: 0, maximum: 100, default: 100 },
      },
    },
    UpdateReportThemeRequest: {
      type: 'object',
      required: ['reportId', 'colors'],
      properties: {
        reportId: { $ref: '#/components/schemas/IdParam' },
        colors: {
          type: 'object',
          additionalProperties: { $ref: '#/components/schemas/ReportColorValue' },
          example: {
            primary: { hex: '#A9A9A9', opacity: 100 },
            secondary: { hex: '#D4AF37', opacity: 100 },
          },
        },
      },
    },
    UpdateReportTypographyRequest: {
      type: 'object',
      required: ['reportId'],
      properties: {
        reportId: { $ref: '#/components/schemas/IdParam' },
        fontPairing: { type: 'string', enum: ['playfair_inter', 'space_grotesk_mono', 'fraunces_inter'] },
        sizeScaling: { type: 'number', minimum: 50, maximum: 200, example: 100 },
      },
    },
    UpdateReportGridRequest: {
      type: 'object',
      required: ['reportId'],
      properties: {
        reportId: { $ref: '#/components/schemas/IdParam' },
        preset: { type: 'string', enum: ['compact', 'default', 'spacious'] },
        customIntensity: { type: 'number', minimum: 0, maximum: 100, example: 70 },
      },
    },
    UpdateReportPhotoFilterRequest: {
      type: 'object',
      required: ['reportId'],
      properties: {
        reportId: { $ref: '#/components/schemas/IdParam' },
        preset: { type: 'string', enum: ['none', 'vintage_gold', 'high_contrast', 'warm', 'cool', 'sepia'] },
        intensity: { type: 'number', minimum: 0, maximum: 100, example: 80 },
      },
    },
    UpdateReportClientDetailsRequest: {
      type: 'object',
      properties: {
        reportId: { $ref: '#/components/schemas/IdParam', description: 'Report ID (numeric or UUID). Provide reportId or eventId.' },
        eventId: { $ref: '#/components/schemas/IdParam', description: 'Event ID (numeric or UUID). Provide reportId or eventId.' },
        clientName: { type: 'string', example: 'Rajesh Kumar' },
        clientMobile: { type: 'string', nullable: true, example: '9876543210' },
        brideName: { type: 'string', nullable: true, example: 'Priya' },
        groomName: { type: 'string', nullable: true, example: 'Amit' },
        eventStartDate: { type: 'string', format: 'date', example: '2026-12-15' },
        functionName: { type: 'string', nullable: true, example: 'Wedding Reception' },
        venueName: { type: 'string', example: 'Grand Ballroom' },
        cityName: { type: 'string', example: 'Mumbai' },
      },
      oneOf: [
        { required: ['reportId'] },
        { required: ['eventId'] },
      ],
    },
    SaveReportDraftRequest: {
      type: 'object',
      required: ['reportId'],
      properties: {
        reportId: { $ref: '#/components/schemas/IdParam' },
        packageId: { $ref: '#/components/schemas/IdParam', nullable: true },
        includeMenuInTemplate: { type: 'boolean' },
        layoutPosition: { type: 'string', enum: ['top', 'background', 'side'], nullable: true },
      },
    },
    ShareReportRequest: {
      type: 'object',
      required: ['reportId'],
      properties: {
        reportId: { $ref: '#/components/schemas/IdParam' },
        notes: { type: 'string', maxLength: 500, nullable: true },
        expiresAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    ReportMeta: {
      type: 'object',
      properties: {
        templateCategories: { type: 'array', items: { type: 'string' } },
        fontPairings: { type: 'array', items: { type: 'string' } },
        gridPresets: { type: 'array', items: { type: 'string' } },
        photoFilterPresets: { type: 'array', items: { type: 'string' } },
        layoutPositions: { type: 'array', items: { type: 'string' } },
        statuses: { type: 'array', items: { type: 'string' } },
      },
    },
    ReportTemplate: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        uuid: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        slug: { type: 'string' },
        category: { type: 'string', enum: ['luxury', 'minimal', 'classic', 'custom'] },
        description: { type: 'string', nullable: true },
        previewUrl: { type: 'string', format: 'uri', nullable: true },
        thumbnailUrl: { type: 'string', format: 'uri', nullable: true },
        isActive: { type: 'boolean' },
        sortOrder: { type: 'integer' },
      },
    },
    ReportPhoto: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        imageUrl: { type: 'string', format: 'uri' },
        sortOrder: { type: 'integer' },
      },
    },
    ReportDetail: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        uuid: { type: 'string', format: 'uuid' },
        eventId: { type: 'string' },
        eventUuid: { type: 'string', format: 'uuid' },
        clientName: { type: 'string' },
        brideName: { type: 'string', nullable: true },
        groomName: { type: 'string', nullable: true },
        eventStartDate: { type: 'string', format: 'date' },
        venueName: { type: 'string' },
        cityName: { type: 'string' },
        template: { $ref: '#/components/schemas/ReportTemplate', nullable: true },
        package: { type: 'object', nullable: true },
        status: { type: 'string', enum: ['draft', 'published', 'shared'] },
        includeMenuInTemplate: { type: 'boolean' },
        layoutPosition: { type: 'string', enum: ['top', 'background', 'side'], nullable: true },
        brideGroomPhotoUrl: { type: 'string', format: 'uri', nullable: true },
        clientLogoUrl: { type: 'string', format: 'uri', nullable: true },
        typography: { type: 'object' },
        grid: { type: 'object' },
        photoFilter: { type: 'object' },
        theme: { type: 'object' },
        photos: { type: 'array', items: { $ref: '#/components/schemas/ReportPhoto' } },
        publishedAt: { type: 'string', format: 'date-time', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    ReportPhotoUploadResponse: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        url: { type: 'string', format: 'uri' },
        originalName: { type: 'string' },
        reportId: { type: 'string' },
        setAsBrideGroomPhoto: { type: 'boolean' },
      },
    },
    ReportClientLogoUploadResponse: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        url: { type: 'string', format: 'uri' },
        originalName: { type: 'string' },
        reportId: { type: 'string' },
        clientLogoUrl: { type: 'string', format: 'uri' },
      },
    },
    ReportPhotoDeleteResponse: {
      type: 'object',
      properties: {
        photoId: { type: 'string' },
        reportId: { type: 'string' },
        deleted: { type: 'boolean', example: true },
      },
    },
    ReportShareResponse: {
      type: 'object',
      properties: {
        reportId: { type: 'string' },
        shareToken: { type: 'string' },
        shareUrl: { type: 'string', format: 'uri' },
        sharedAt: { type: 'string', format: 'date-time' },
        expiresAt: { type: 'string', format: 'date-time', nullable: true },
        notes: { type: 'string', nullable: true },
      },
    },
    ReportPdfGenerateResponse: {
      type: 'object',
      properties: {
        pdfUrl: { type: 'string', format: 'uri', example: 'https://api.example.com/uploads/reports/report-1-abc.pdf' },
        pdfId: { type: 'string' },
        pageCount: { type: 'integer', example: 4 },
        fileSizeBytes: { type: 'integer', example: 245760 },
        templateSlug: { type: 'string', example: 'royal-noir' },
        generatedAt: { type: 'string', format: 'date-time' },
      },
    },
    ReportPdfDownloadResponse: {
      type: 'object',
      properties: {
        pdfUrl: { type: 'string', format: 'uri' },
        pdf: { $ref: '#/components/schemas/ReportPdfRecord' },
      },
    },
    ReportPdfDeleteResponse: {
      type: 'object',
      properties: {
        reportId: { type: 'string' },
        deleted: { type: 'boolean', example: true },
      },
    },
    ReportPdfRecord: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        uuid: { type: 'string', format: 'uuid' },
        reportId: { type: 'string' },
        pdfUrl: { type: 'string', format: 'uri' },
        storedName: { type: 'string' },
        fileSizeBytes: { type: 'integer', nullable: true },
        pageCount: { type: 'integer', nullable: true },
        templateSlug: { type: 'string', nullable: true },
        generatedBy: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
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
