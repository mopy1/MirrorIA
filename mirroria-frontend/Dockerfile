# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# La API queda en el mismo origen vía el reverse proxy de nginx (ver
# nginx.conf) — VITE_API_URL es build-time, así que no hace falta saber el
# host/dominio final acá, solo el prefijo relativo.
ENV VITE_API_URL=/api/v1
RUN npm run build

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
