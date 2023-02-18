FROM node:lts as deps-prod
WORKDIR /app
COPY **/package*.json /app/
RUN npm i --production

FROM deps-prod as deps-dev
RUN npm i --production=false

FROM deps-dev as build
RUN npm run build
ENTRYPOINT node packages/node/lib/cli.js
