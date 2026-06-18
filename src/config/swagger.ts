import swaggerJsdoc from "swagger-jsdoc";
import env from "./env.ts"

/**
 * Swagger Configuration Options
 * Admiralty University of Nigeria — Event Management System API.
 */

const isProd = env.NODE_ENV === "production";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Adun EMS API",
      version: "1.0.0",
      description:
        "REST API for the Admiralty University of Nigeria Event Management System — campus events, bookings, and related operations.\n\nCSRF: `POST`, `PUT`, `PATCH`, and `DELETE` calls under `/api` require the `x-csrf-token` header returned from `GET /api/csrf-token`. `GET /health` and `/api-docs` are outside CSRF protection.",
    },
    servers: [
      {
        url: env.API_ORIGIN ?? "http://localhost:3000",
        description: isProd ? "Production server" : "Local development server",
      },
    ],
    tags: [
      { name: "Health", description: "Liveness and uptime" },
      { name: "Security", description: "CSRF token and auth" },
      { name: "Auth", description: "Registration, login, 2FA, password reset" },
      { name: "Users", description: "User profile and admin user management" },
      { name: "Events", description: "Create, update, list and manage events" },
      { name: "Enrollments", description: "Event enrollment and check-ins" },
      { name: "Venues", description: "Manage venues and capacity" },
      {
        name: "Organisations",
        description: "Organisations, faculties and departments",
      },
      { name: "Levels", description: "Student academic levels" },
      { name: "Admin", description: "Administrative reports and actions" },
      { name: "Files", description: "File uploads (thumbnails, images)" },
    ],
    components: {
      parameters: {
        CsrfHeader: {
          name: "x-csrf-token",
          in: "header",
          required: true,
          description:
            "CSRF token from GET /api/csrf-token. Send after cookies are stored for the session.",
          schema: { type: "string" },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
      schemas: {
        // Generic response wrappers
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: { type: ["object", "array", "string", "number", "null"] },
          },
        },
        ErrorMessage: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
        ValidationErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation Error" },
            errors: { type: "array", items: { type: "object" } },
          },
        },

        // User related
        PublicUser: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            first_name: { type: "string" },
            last_name: { type: "string" },
            email: { type: "string", format: "email" },
            role: {
              type: "string",
              enum: ["super-admin", "event-organiser", "staff", "student"],
            },
            email_verified: { type: "boolean" },
            is_active: { type: "boolean" },
            two_factor_enabled: { type: "boolean" },
            profile_picture_url: { type: "string", format: "uri" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },

        // Auth requests
        RegisterRequest: {
          type: "object",
          required: [
            "first_name",
            "last_name",
            "email",
            "password",
            "confirm_password",
          ],
          properties: {
            first_name: { type: "string" },
            last_name: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string" },
            confirm_password: { type: "string" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
            twoFactorToken: { type: "string" },
          },
        },
        AuthTokens: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/PublicUser" },
            accessToken: { type: "string" },
          },
        },

        // Auth: OTP / password reset
        OtpRequest: {
          type: "object",
          required: ["otp"],
          properties: {
            otp: {
              type: "string",
              minLength: 6,
              maxLength: 6,
              example: "482910",
              description: "6-digit one-time password",
            },
          },
        },
        EmailRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "student@adun.edu.ng",
            },
          },
        },
        VerifyResetPasswordRequest: {
          type: "object",
          required: ["email", "otp"],
          properties: {
            email: { type: "string", format: "email" },
            otp: {
              type: "string",
              minLength: 6,
              maxLength: 6,
              example: "193847",
            },
          },
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["password", "confirm_password"],
          properties: {
            password: {
              type: "string",
              minLength: 8,
              description: "New password",
            },
            confirm_password: {
              type: "string",
              minLength: 8,
              description: "Must match password",
            },
          },
        },

        // Event related
        Venue: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            location: { type: "string" },
            capacity: { type: "integer" },
          },
        },
        Event: {
          type: "object",
          properties: {
            id: { type: "integer" },
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            capacity: { type: "integer" },
            thumbnail: { type: "string", format: "uri" },
            duration: { type: "integer", description: "Minutes" },
            start_date: { type: "string", format: "date-time" },
            end_date: { type: "string", format: "date-time" },
            status: {
              type: "string",
              enum: ["pending", "approved", "rejected", "cancelled"],
            },
            audience_scope: {
              type: "string",
              enum: ["all", "custom"],
              description:
                "`all` allows every authenticated staff/student to discover and register. `custom` applies audienceRules.",
              example: "custom",
            },
            audienceRules: {
              type: "array",
              description:
                "Audience eligibility rules. Returned when event endpoints include audience metadata.",
              items: { $ref: "#/components/schemas/EventAudienceRule" },
            },
            fillPercentage: {
              type: "number",
              nullable: true,
              description:
                "Calculated percentage of non-cancelled enrollments against capacity.",
              example: 42.5,
            },
            venue: { $ref: "#/components/schemas/Venue" },
            organisation: { type: "object" },
          },
        },
        EventAudienceRule: {
          type: "object",
          description:
            "One audience rule. Nullable fields mean any value for that dimension. Multiple rules are OR'd together.",
          required: ["role"],
          properties: {
            id: { type: "integer", readOnly: true },
            event_id: { type: "integer", readOnly: true },
            role: {
              type: "string",
              enum: ["staff", "student"],
              description: "Target account role for this rule.",
              example: "student",
            },
            staff_type: {
              type: "string",
              nullable: true,
              enum: ["academic-staff", "non-academic-staff"],
              description:
                "Only used when role is `staff`. Null means all staff types.",
              example: null,
            },
            level_id: {
              type: "integer",
              nullable: true,
              description:
                "Only used when role is `student`. Null means all student levels.",
              example: 4,
            },
            gender: {
              type: "string",
              nullable: true,
              enum: ["male", "female", "other"],
              description: "Null means all genders.",
              example: "female",
            },
            level: {
              type: "object",
              nullable: true,
              readOnly: true,
              properties: {
                id: { type: "integer" },
                name: { type: "string", example: "400 Level" },
                code: { type: "string", example: "400" },
              },
            },
          },
        },
        EventAudienceRuleInput: {
          type: "object",
          description:
            "Audience rule submitted during event create/update. Nullable or omitted fields mean any value for that dimension.",
          required: ["role"],
          properties: {
            role: {
              type: "string",
              enum: ["staff", "student"],
              example: "staff",
            },
            staff_type: {
              type: "string",
              nullable: true,
              enum: ["academic-staff", "non-academic-staff"],
              description:
                "Only valid for staff rules. Omit/null for all staff.",
              example: "academic-staff",
            },
            level_id: {
              type: "integer",
              nullable: true,
              description:
                "Only valid for student rules. Omit/null for all levels.",
              example: null,
            },
            gender: {
              type: "string",
              nullable: true,
              enum: ["male", "female", "other"],
              description: "Omit/null for all genders.",
              example: null,
            },
          },
        },
        EventCreateRequest: {
          type: "object",
          required: [
            "title",
            "category",
            "description",
            "startDate",
            "startTime",
            "endDate",
            "endTime",
            "venue_id",
            "capacity",
            "thumbnail",
          ],
          properties: {
            title: { type: "string" },
            category: { type: "string" },
            description: { type: "string" },
            venue_id: { type: "integer" },
            capacity: { type: "integer" },
            startDate: { type: "string", format: "date", example: "2026-06-18" },
            startTime: { type: "string", example: "10:00" },
            endDate: { type: "string", format: "date", example: "2026-06-18" },
            endTime: { type: "string", example: "12:00" },
            audience_scope: {
              type: "string",
              enum: ["all", "custom"],
              default: "all",
            },
            audience_rules: {
              type: "array",
              description:
                "Required when audience_scope is `custom`. For multipart requests this is sent as a JSON string containing the array.",
              items: { $ref: "#/components/schemas/EventAudienceRuleInput" },
            },
            thumbnail: {
              type: "string",
              format: "binary",
            },
          },
        },
        EventUpdateRequest: {
          type: "object",
          description:
            "Partial event update payload. Updating audience_scope or audience_rules replaces the event's audience rule set.",
          properties: {
            eventTitle: { type: "string", deprecated: true },
            title: { type: "string" },
            category: { type: "string" },
            description: { type: "string" },
            selectedVenue: { type: "integer", deprecated: true },
            venue_id: { type: "integer" },
            capacity: { type: "integer" },
            startDate: { type: "string", format: "date" },
            startTime: { type: "string" },
            endDate: { type: "string", format: "date" },
            endTime: { type: "string" },
            audience_scope: {
              type: "string",
              enum: ["all", "custom"],
            },
            audience_rules: {
              type: "array",
              items: { $ref: "#/components/schemas/EventAudienceRuleInput" },
            },
          },
        },
        EventDashboardStats: {
          type: "object",
          properties: {
            total_events: { type: "integer" },
            pending_approval: { type: "integer" },
            approved_events: { type: "integer" },
            rejected_events: { type: "integer" },
            cancelled_events: { type: "integer" },
            upcoming_events: { type: "integer" },
            active_events: { type: "integer" },
            past_events: { type: "integer" },
            total_registrations: { type: "integer" },
            attended_registrations: { type: "integer" },
          },
        },

        // Enrollment
        Enrollment: {
          type: "object",
          properties: {
            id: { type: "integer" },
            event_id: { type: "integer" },
            user_id: { type: "integer" },
            status: {
              type: "string",
              enum: ["confirmed", "cancelled", "attended"],
            },
            qr_token: { type: "string" },
            qr_issued_at: { type: "string", format: "date-time" },
            check_in_time: { type: "string", format: "date-time" },
          },
        },

        // Organisation/faculty/department
        Organisation: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            faculty_id: { type: "integer", nullable: true },
            department_id: { type: "integer", nullable: true },
            faculty: { $ref: "#/components/schemas/Faculty" },
            department: { $ref: "#/components/schemas/Department" },
          },
        },
        OrganisationRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Student Affairs" },
            faculty_id: { type: "integer", nullable: true, example: null },
            department_id: { type: "integer", nullable: true, example: 3 },
          },
        },
        Faculty: {
          type: "object",
          properties: { id: { type: "integer" }, name: { type: "string" } },
        },
        Department: {
          type: "object",
          properties: { id: { type: "integer" }, name: { type: "string" } },
        },
        Level: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string", example: "400 Level" },
            code: { type: "string", example: "400" },
            category: {
              type: "string",
              enum: ["undergraduate", "postgraduate"],
              example: "undergraduate",
            },
          },
        },
        LevelRequest: {
          type: "object",
          required: ["name", "code", "category"],
          properties: {
            name: { type: "string", example: "400 Level" },
            code: { type: "string", example: "400" },
            category: {
              type: "string",
              enum: ["undergraduate", "postgraduate"],
              example: "undergraduate",
            },
          },
        },

        // Misc
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
          },
        },
      },
    },
  },
  apis: ["./src/**/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
