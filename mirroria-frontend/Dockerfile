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
# Default = nginx.conf (HTTP plano, sin dominio ni certificados) para que
# levantar esto en una laptop de desarrollo funcione tal cual. La VM real
# pasa `--build-arg NGINX_CONF=nginx.prod.conf` (ver docker-compose.prod.yml).
ARG NGINX_CONF=nginx.conf
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
