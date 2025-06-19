# Install dependencies only when needed
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies based on package.json and lock file
COPY package.json package-lock.json* ./
RUN npm ci

# Build the application
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the application files
COPY . .

# Set environment variables (adjust as needed)
ENV SPEECH_KEY=9Coq1nWemkEjbPvQJG55cX8y2LwvOfElSzB68bWmJv4xRZ1eqpoVJQQJ99BEACqBBLyXJ3w3AAAYACOGR9Mx
ENV SPEECH_REGION=southeastasia

# Build the Next.js app
RUN npm run build

# Production image, copy built assets and run
FROM node:20-alpine AS runner

WORKDIR /app

ENV SPEECH_KEY=9Coq1nWemkEjbPvQJG55cX8y2LwvOfElSzB68bWmJv4xRZ1eqpoVJQQJ99BEACqBBLyXJ3w3AAAYACOGR9Mx
ENV SPEECH_REGION=southeastasia

# Install production dependencies only
COPY --from=deps /app/node_modules ./node_modules

# Copy built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose the port Next.js runs on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
