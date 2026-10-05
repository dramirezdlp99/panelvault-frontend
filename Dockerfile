# Imagen del frontend de PanelVault (Next.js en modo "standalone").
# Tres etapas: dependencias → compilación → ejecución. La imagen final solo lleva el
# servidor compilado, sin código fuente ni dependencias de desarrollo, y corre sin root.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_OUTPUT=standalone
# URL pública del sitio: se usa en los metadatos al compilar.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN addgroup -S -g 10001 panelvault && adduser -S -u 10001 -G panelvault panelvault
COPY --from=build --chown=panelvault:panelvault /app/public ./public
COPY --from=build --chown=panelvault:panelvault /app/.next/standalone ./
COPY --from=build --chown=panelvault:panelvault /app/.next/static ./.next/static
USER panelvault
EXPOSE 3000

# PANELVAULT_API_URL y PANELVAULT_GATEWAY_SECRET llegan como variables de entorno
# de la plataforma; nunca van dentro de la imagen.
CMD ["node", "server.js"]
