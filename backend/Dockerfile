FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 5000

# Script to run migrations and start server
CMD ["sh", "-c", "npx prisma db push && node server.js"]
