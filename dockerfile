FROM node:20-alpine as base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY package.json ./
# install dependencies
RUN yarn install --no-lockfile

# Rebuild the source code only when needed
FROM base AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules 
COPY . .


ENV PORT 3002

EXPOSE 3002

CMD ["node", "app.js"]