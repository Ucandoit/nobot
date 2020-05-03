FROM node:alpine

WORKDIR /usr/src/app

RUN npm i -g lerna

COPY package.json yarn.lock lerna.json ./
COPY tsconfig.base.json ./
COPY packages/core/database ./packages/core/database
COPY packages/tools/token-manager ./packages/tools/token-manager
RUN lerna bootstrap

CMD [ "npm", "run", "--prefix", "packages/tools/token-manager", "dev" ]
