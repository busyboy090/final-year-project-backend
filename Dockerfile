# Stage 1: build TypeScript (optional)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@8
RUN pnpm install --frozen-lockfile --production=false
COPY . .
RUN pnpm run build || true

# Stage 2: runtime
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@8
RUN pnpm install --frozen-lockfile --production

# Copy built code if available, otherwise copy src for ts-node dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Default command runs the app in dev mode (ts-node) if build wasn't produced
CMD ["pnpm", "run", "dev"]
