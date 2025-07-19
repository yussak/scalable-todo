FROM node:20-alpine as base

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

FROM base as dev
COPY . .
EXPOSE 3010
CMD ["yarn", "dev"]

FROM base as prod
COPY . .
RUN yarn build
EXPOSE 3010
CMD ["yarn", "start"]