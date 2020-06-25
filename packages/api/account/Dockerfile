FROM node:alpine as builder
ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .

COPY packages/core/database/package.json ./packages/core/database/package.json
COPY packages/core/commons/package.json ./packages/core/commons/package.json
COPY packages/api/account/package.json ./packages/api/account/package.json
RUN yarn workspace @nobot-api/account install

FROM node:alpine
ENV NODE_ENV production
ENV CONFIG_PROFILE PROD

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .
COPY config/application.yml ./config/application.yml
COPY config/config-prod.yml ./config/config-prod.yml

COPY packages/core/database/package.json ./packages/core/database/package.json
COPY packages/core/commons/package.json ./packages/core/commons/package.json
COPY packages/api/account/package.json ./packages/api/account/package.json

COPY packages/core/database/lib ./packages/core/database/lib
COPY packages/core/commons/lib ./packages/core/commons/lib
COPY packages/api/account/lib ./packages/api/account/lib

COPY --from=builder /usr/src/app/node_modules ./node_modules

COPY --from=builder /usr/src/app/packages/core/database/node_modules ./packages/core/database/node_modules
COPY --from=builder /usr/src/app/packages/core/commons/node_modules ./packages/core/commons/node_modules
COPY --from=builder /usr/src/app/packages/api/account/node_modules ./packages/api/account/node_modules

WORKDIR /usr/src/app/packages/api/account

CMD ["npm", "run", "start"]
