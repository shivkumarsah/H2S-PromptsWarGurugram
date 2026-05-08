# TravelAI — Optimized Dockerfile for Cloud Run
# Single-stage build (simpler, more reliable)

FROM node:20-alpine

WORKDIR /app

# Install dependencies first (for layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Expose Cloud Run port
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]
