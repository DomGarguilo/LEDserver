##
# Builder stage: install dependencies and produce compiled artifacts.
##
FROM node:24 AS builder

WORKDIR /app

# Root dependencies (keep dev deps for build tooling)
COPY package*.json ./
RUN npm ci

# Server dependencies (needs dev deps for TypeScript)
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci

# Client dependencies (needs dev deps for Vite)
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci

# Copy the full source tree and build once.
WORKDIR /app
COPY . .
RUN npm run build

##
# Production stage: only runtime deps plus built assets.
##
FROM node:24-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Root production dependencies.
COPY package*.json ./
RUN npm ci --omit=dev

# Server production dependencies.
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy build outputs and any runtime assets.
WORKDIR /app
COPY --from=builder /app/server/build ./server/build
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 5000
CMD ["npm", "start"]
