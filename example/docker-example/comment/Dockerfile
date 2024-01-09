FROM node:lts-buster-slim

WORKDIR /usr/app

COPY package.json /usr/app/package.json

RUN npm i

COPY . /usr/app

EXPOSE 3002

ENV PORT 3002

CMD ["npm", "start"]
