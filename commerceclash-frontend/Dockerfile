# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_BASE_URL
ENV VITE_BASE_URL=${VITE_BASE_URL}

ARG VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}

RUN npm run build


# ---- Production Stage ----
FROM nginx:alpine

# Copy the built app from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config to handle React routing (SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Railway-compatible port
EXPOSE 80

CMD ["nginx", "-g", "daemon off; error_log /dev/stderr warn;"]