# syntax=docker/dockerfile:1.6

FROM node:lts-slim AS builder
WORKDIR /app
COPY --link package.json .
COPY --link package-lock.json .
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc,required=true \
    --mount=type=cache,id=continuousc-frontend-node_modules,target=/app/node_modules \
    npm ci --color=always
COPY  --link . .

FROM builder AS test
RUN --mount=type=cache,id=continuousc-frontend-node_modules,target=/app/node_modules \
    npx vitest run --color --typecheck.enabled --coverage

FROM builder AS audit
RUN --mount=type=cache,id=continuousc-frontend-node_modules,target=/app/node_modules \
    npm audit --color=always

FROM builder AS build
RUN --mount=type=cache,id=continuousc-frontend-node_modules,target=/app/node_modules \
    npx tsc --pretty && npx vite build

FROM nginx:stable-alpine3.17-slim AS production
COPY --link nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN touch /var/run/nginx.pid
RUN chown -R nginx:nginx /var/run/nginx.pid /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d
USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

FROM gitea.contc/controlplane/techdocs-builder:0.0.7 AS docs
WORKDIR /app
RUN mkdir  -p /app/docs
COPY mkdocs.yml /app
COPY docs/* /app/docs
RUN npx @techdocs/cli generate --no-docker
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV AWS_REGION=us-west-2
RUN --mount=type=secret,id=minio_credentials,target=/root/.minio.env,required=true \
    export $(cat /root/.minio.env); \
    npx @techdocs/cli publish --publisher-type awsS3 --storage-name techdocs \
    --entity default/component/c9c-frontend --awsEndpoint https://minio.cortex --awsS3ForcePathStyle
