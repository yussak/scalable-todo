FROM node:20-alpine as base

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

FROM base as dev
COPY . .
RUN yarn prisma generate
EXPOSE 3011
CMD ["yarn", "dev"]

FROM base as prod
COPY . .
RUN yarn prisma generate
RUN yarn build
EXPOSE 3011
CMD ["yarn", "start"]