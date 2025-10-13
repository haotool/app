# Multi-stage Dockerfile for RateWise

# Build stage
FROM node:24-alpine AS builder

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.10.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/ratewise/package.json ./apps/ratewise/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build:ratewise

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/apps/ratewise/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user for security  
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /usr/share/nginx/html /var/cache/nginx /var/run /var/log/nginx

# Expose port
EXPOSE 8080

# Health check (check from outside the container using curl from host)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD test -f /usr/share/nginx/html/index.html || exit 1

# Use non-root user
USER nodejs

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
