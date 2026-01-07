FROM node:18-alpine

WORKDIR /app

# Copy package files from server directory
COPY server/package.json ./package.json

# Install dependencies
# Ensure we install devDependencies (needed for prisma CLI) by forcing development mode during install
ENV NODE_ENV=development
# Install OpenSSL for Prisma
RUN apk -U upgrade && apk add --no-cache openssl
RUN npm install --legacy-peer-deps

# Copy server code (which now includes prisma directory)
COPY server ./server

# Generate Prisma Client
RUN cd server && npx prisma generate

# Set production environment for runtime
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start server
# We use db push to sync schema (easier for initial setup than migrations)
CMD ["sh", "-c", "cd server && npx prisma db push && node index.js"]
