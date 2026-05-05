import swaggerJsdoc from "swagger-jsdoc";

/**
 * Swagger Configuration Options
 * Admiralty University of Nigeria — Event Management System API.
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Admiralty University of Nigeria — Event Management System API",
      version: "1.0.0",
      description:
        "REST API for the **Admiralty University of Nigeria Event Management System** — campus events, bookings, and related operations.\n\n**CSRF:** `POST`, `PUT`, `PATCH`, and `DELETE` calls under `/api` require a CSRF cookie (set automatically) and the `x-csrf-token` header from `GET /api/csrf-token`. `GET /health` and `/api-docs` are outside CSRF protection.",
    },
    servers: [
      {
        url: "/",
        description: "Same-origin server (paths include `/api` where applicable)",
      },
    ],
    tags: [
      { name: "Health", description: "Liveness and uptime" },
      { name: "Security", description: "CSRF token for mutating requests" },
      { name: "Auth", description: "Registration and login" },
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
      schemas: {
        PublicUser: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            first_name: { type: "string" },
            last_name: { type: "string" },
            email: { type: "string", format: "email" },
            role: {
              type: "string",
              enum: ["administrator", "organiser", "user"],
            },
            is_active: { type: "boolean" },
            two_factor_enabled: {
              type: "boolean",
              description: "Present on register responses; login user object matches DB scope.",
            },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        AuthTokens: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/PublicUser" },
            accessToken: {
              type: "string",
              description: "JWT access token (use as Bearer token for protected routes).",
            },
          },
        },
        ValidationErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation Error" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        ErrorMessage: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
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
    },
  },
  apis: ["./src/index.ts", "./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;