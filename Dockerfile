FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./
COPY . .

RUN npm install --production

RUN groupmod -g 996 node && usermod -u 996 -g 996 node
USER node

CMD [ "npm", "start" ]