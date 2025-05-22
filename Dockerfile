FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Создаем директорию public, если она отсутствует
RUN mkdir -p /app/public

# Build the Next.js application
RUN pnpm build

# Stage 2: Serve the Next.js application
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml for production dependencies
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Создаем директорию public в runner stage для дополнительной надежности
RUN mkdir -p /app/public

# Copy the built Next.js application from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expose port 3000 (default for Next.js)
EXPOSE 3000

# Set the command to start the Next.js production server
CMD ["pnpm", "start"]
