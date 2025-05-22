FROM node:18-alpine

WORKDIR /app

# Add additional dependencies
RUN apk add --no-cache libc6-compat

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
