FROM node:18-slim

WORKDIR /app

# Copy apenas package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm install --production --no-optional

# Copy source code
COPY src ./src

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=5s --timeout=2s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode) })"

# Start server
CMD ["node", "index.js"]
