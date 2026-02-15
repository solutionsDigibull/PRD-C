# ============================================================
# BuLLMake PRD Generator — Multi-stage Docker Build
# Optimized for Coolify deployment on EC2
# ============================================================

# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files and install dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --include=dev

# Copy frontend source code
COPY frontend/ ./

# Build-time environment variables (Coolify will inject these)
ARG REACT_APP_API_URL=/api/ai
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_ANON_KEY=$REACT_APP_SUPABASE_ANON_KEY

# Build the React app
RUN npm run build

# Stage 2: Production image with backend + frontend build
FROM node:18-alpine AS production

WORKDIR /app

# Copy backend package files and install production dependencies only
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend source code
COPY backend/ ./backend/

# Copy the built frontend from Stage 1
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Health check — fetch actual response (not just headers) to confirm Express is serving
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null http://0.0.0.0:5000/api/health || exit 1

# Start the backend server (serves frontend build in production)
WORKDIR /app/backend
CMD ["node", "server.js"]
