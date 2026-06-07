# ADUN-EMS Backend

Express, Sequelize, and PostgreSQL API for the Admiralty University Event Management System.

## Setup

```bash
npm install --package-lock=false --legacy-peer-deps
cp .env.example .env
npm run dev
```

Fill the database, Redis, mail, JWT/cookie, Cloudinary, and CORS values in `.env` before running the app.

## Checks

```bash
npm run build
npm test
```

`npm test` currently runs the TypeScript build as a smoke test.

## API Docs

- Scalar UI: `GET /api-docs`
- OpenAPI JSON: `GET /api-docs/openapi.json`
- Health check: `GET /health`

## Deployment Notes

- Set `NODE_ENV=production`.
- Configure `ALLOWED_ORIGINS` with the deployed frontend URL.
- Set `FRONTEND_URL` for mail links.
- Provide PostgreSQL credentials or `DB_URL`.
- Provide `UPSTASH_REDIS_URL`, Resend, and Cloudinary credentials.
- Run migrations and seeders before first production use.
