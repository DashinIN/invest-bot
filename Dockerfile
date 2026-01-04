FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ postgresql-client

# Copy package files
COPY package*.json ./

# Install dependencies (include devDependencies so TypeScript is available for build)
RUN npm ci && npm install -g sequelize-cli

# Copy source and built files
COPY tsconfig.json ./
COPY .sequelizerc ./
COPY src ./src
COPY assets ./assets
COPY migrations ./migrations

# Build TypeScript, then remove devDependencies to keep image slim
RUN npm run build && npm prune --production

# Expose port (if needed for webhooks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start bot
CMD ["npm", "start"]
