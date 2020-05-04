FROM node:alpine as builder
ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .

COPY packages/core/database/package.json ./packages/core/database/package.json
COPY packages/tools/token-manager/package.json ./packages/tools/token-manager/package.json
RUN yarn workspace @nobot-tools/token-manager install

FROM node:alpine
ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .

COPY packages/core/database/package.json ./packages/core/database/package.json
COPY packages/tools/token-manager/package.json ./packages/tools/token-manager/package.json

COPY packages/core/database/lib ./packages/core/database/lib
COPY packages/tools/token-manager/lib ./packages/tools/token-manager/lib

COPY --from=builder /usr/src/app/node_modules ./node_modules

COPY --from=builder /usr/src/app/packages/core/database/node_modules ./packages/core/database/node_modules
COPY --from=builder /usr/src/app/packages/tools/token-manager/node_modules ./packages/tools/token-manager/node_modules

WORKDIR /usr/src/app/packages/tools/token-manager

CMD ["npm", "run", "start"]
