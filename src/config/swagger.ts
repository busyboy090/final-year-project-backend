import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import env from "./env.ts"
import { fileURLToPath } from "url";

/**
 * Swagger Configuration Options
 * Admiralty University of Nigeria — Event Management System API.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
            venue: { $ref: "#/components/schemas/Venue" },
            organisation: { type: "object" },
          },
        },
        EventCreateRequest: {
          type: "object",
          required: ["title", "category", "start_date", "end_date", "venue_id"],
          properties: {
            title: { type: "string" },
            category: { type: "string" },
            description: { type: "string" },
            venue_id: { type: "integer" },
            capacity: { type: "integer" },
            start_date: { type: "string", format: "date-time" },
            end_date: { type: "string", format: "date-time" },
            duration: { type: "integer" },
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
            address: { type: "string" },
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
  // In production (after tsc), scan compiled .js files in dist/.
  // In development, scan .ts source files directly.
  apis: [
    path.join(
      __dirname,
      isProd ? "../../dist/**/*.js" : "../**/*.ts"
    ),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;