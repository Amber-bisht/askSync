# Use the official Node.js 18 image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Copy env.example as .env for build (with placeholder values)
RUN cp env.example .env

# Set build-time environment variables (these can be overridden at runtime)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port 3001
EXPOSE 3001

# Set environment variable for port
ENV PORT=3001

# Start the application
CMD ["npm", "start", "--", "-p", "3001"]
