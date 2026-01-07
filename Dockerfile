# Multi-stage build for optimized production image with Turbopack

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with cache mount for faster builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set build-time environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application with Turbopack
# Note: Environment variables should be passed at runtime for security
# Build-time env vars are only needed for static optimization
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy package.json for npm start command
COPY --from=builder /app/package.json ./package.json

# Set proper permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port (default 5000, can be overridden via PORT env var)
EXPOSE 5000

ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

# Start the application
# Use standalone server if available, otherwise fallback to npm start
CMD ["node", "server.js"]
