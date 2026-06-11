# Running the backend with Docker

Prerequisites: Docker and Docker Compose installed.

1. Copy .env.example to .env and set required values.

2. Start the stack:

   docker compose up --build

3. Run migrations (inside app container):

   docker compose exec app pnpm run build; docker compose exec app pnpm run migrate || true

4. Start worker (already defined as service `worker`).

Notes:

- The compose file includes Postgres and Redis for local development.
- Configure RESEND_API_KEY and CLOUDINARY credentials in .env if you want to test emails and uploads.
