# This stage gets only package*.json files
FROM node:20-slim as node-files
WORKDIR /app
COPY . .
RUN find . -not -name "package*.json" -type f -delete
RUN find . -type d -delete || exit 0

# Using lts here because there's not difference with lts-slim when installing with apt-get
FROM node:20 as deps-prod
WORKDIR /app
RUN apt-get update
RUN apt-get install build-essential libcairo2-dev libpango1.0-dev librsvg2-dev -y
COPY --from=node-files /app ./
RUN npm i --omit=dev

# Build stage with dev dependencies
FROM deps-prod as build
WORKDIR /app
RUN npm i --include=dev
COPY . .
RUN npm run build

# Final stage, build up app
FROM node:20-slim as final
WORKDIR /app
RUN apt-get update
RUN apt-get install libcairo2 libpango1.0 librsvg2-dev -y
COPY --from=deps-prod /app/node_modules ./node_modules/
COPY --from=build /app/packages ./packages
ENTRYPOINT ["node", "packages/node/lib/cli.js"]

