FROM node:lts-slim as deps-prod
WORKDIR /app
COPY package*.json ./
RUN npm i --omit=dev

FROM deps-prod as deps-dev
WORKDIR /app
RUN npm i --include=dev

FROM deps-dev as build
WORKDIR /app
COPY . .
RUN npm run build
ENTRYPOINT node packages/node/lib/cli.js

FROM deps-prod as final
WORKDIR /app
COPY --from=build

