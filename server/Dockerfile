FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY src ./src

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5001

# Start command
CMD ["node", "src/index.js"]
