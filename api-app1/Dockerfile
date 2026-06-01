# --- Build stage ---
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# --- Run stage ---
FROM node:24-alpine

# Create non-root user and group
RUN addgroup -S appuser && adduser -S -G appuser appuser

WORKDIR /app

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY package.json ./
COPY index.js ./

# Ensure log directory is writable by the non-root user
RUN mkdir log && chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

CMD ["node", "index.js"]