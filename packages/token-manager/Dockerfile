FROM node:alpine

WORKDIR /usr/src/app

RUN npm i -g lerna

COPY package.json yarn.lock lerna.json ./
RUN yarn
COPY tsconfig.base.json ./
COPY packages/token-manager ./packages/token-manager
RUN lerna bootstrap

CMD [ "npm", "run", "--prefix", "packages/token-manager", "dev" ]
