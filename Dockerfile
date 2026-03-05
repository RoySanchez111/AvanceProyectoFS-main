FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --silent

COPY frontend/ ./
ENV VITE_API_URL=/api
RUN npm run build -- --outDir /app/public


FROM node:18-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --silent || npm install --omit=dev --silent

COPY server.js ./
COPY src/ ./src/

COPY --from=frontend-build /app/public ./public/

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]