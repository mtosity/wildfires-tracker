# Multi-stage Dockerfile for AWS ECS/EC2 deployment
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build:server

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/db ./db

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S firetracker -u 1001

# Change ownership
RUN chown -R firetracker:nodejs /app
USER firetracker

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/wildfires/stats || exit 1

# Start the application
CMD ["npm", "start"]