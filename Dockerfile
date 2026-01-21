FROM node:20-alpine
WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy server code
COPY server/ .

ENV NODE_ENV=production
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-5000}/api/health || exit 1

CMD ["node", "index.js"]
