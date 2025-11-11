# UMA AEye Monitoring System - Multi-stage Docker build
# Supports both Next.js application and go2rtc streaming server

FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat curl wget

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 3000 1984 8554 8555
CMD ["npm", "run", "dev:full"]

# Build stage
FROM base AS builder
RUN npm ci
COPY . .

# Build Next.js application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install system dependencies for go2rtc
RUN apk add --no-cache libc6-compat curl

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy go2rtc binary and configuration
COPY --from=builder /app/go2rtc ./go2rtc
COPY --from=builder /app/go2rtc.yaml ./go2rtc.yaml
COPY --from=builder /app/start-servers.sh ./start-servers.sh

# Make binaries executable
RUN chmod +x ./go2rtc ./start-servers.sh

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose ports
EXPOSE 3000 1984 8554 8555

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start both services
CMD ["./start-servers.sh"]
