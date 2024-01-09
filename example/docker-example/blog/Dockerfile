FROM node:lts-buster-slim

WORKDIR /usr/app

COPY package.json /usr/app/package.json

RUN npm i

COPY . /usr/app

EXPOSE 3003

ENV PORT 3003

CMD ["npm", "start"]
