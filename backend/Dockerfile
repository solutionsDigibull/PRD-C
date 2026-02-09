FROM node:18-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files first for better layer caching
COPY backend/package.json backend/package-lock.json* ./

# Install production dependencies only (skips nodemon)
RUN npm ci --production

# Copy backend source code
COPY backend/server.js ./server.js
COPY backend/routes/ ./routes/

# Switch to non-root user
USER appuser

EXPOSE 5000

CMD ["node", "server.js"]
