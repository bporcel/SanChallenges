FROM node:18-alpine

WORKDIR /app

# Copy package files from root
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy server code and prisma schema
COPY server ./server
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start server
# We use db push to sync schema (easier for initial setup than migrations)
CMD ["sh", "-c", "npx prisma db push && node server/index.js"]
