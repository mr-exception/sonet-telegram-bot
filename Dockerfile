FROM node:15

WORKDIR /usr/src/app

COPY ./ /usr/src/app

RUN npm i

RUN npm run build

CMD ["node", "dist/index.js"]