FROM node:lts as deps-prod
WORKDIR /app
COPY **/package*.json /app/
RUN npm i --omit=dev

FROM deps-prod as deps-dev
WORKDIR /app
RUN npm i --include=dev

FROM deps-dev as build
WORKDIR /app
RUN npm run build
ENTRYPOINT node packages/node/lib/cli.js
