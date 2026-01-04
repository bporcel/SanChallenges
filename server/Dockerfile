FROM node:18-alpine

WORKDIR /app

# Copy package files from root (since server deps are in root package.json)
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production --legacy-peer-deps

# Copy server code
COPY server ./server

# Create data file if it doesn't exist (will be overwritten by volume if mounted)
RUN echo '{"challenges":[],"participants":[],"checks":[],"users":[]}' > server/data.json

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server/index.js"]
