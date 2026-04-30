# Build Stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application with standalone output
RUN npm run build

# Production Stage
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary files from builder
# .next/standalone includes the minimal node_modules and server.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy package.json for reference
COPY --from=builder /app/package.json ./

# Make scripts directory and copy env script
RUN mkdir -p /app/scripts
COPY --from=builder /app/scripts/env.sh /app/scripts/env.sh
RUN chmod +x /app/scripts/env.sh

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port 3000 (default Next.js port)
EXPOSE 3000

# Start with script execution then Next.js server
CMD ["/bin/sh", "-c", "/app/scripts/env.sh /app/env-config.js && node server.js"]
