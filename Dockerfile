FROM node:12-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

ENV PATH /usr/src/app/node_modules/.bin:$PATH
ENV PORT=5000

COPY package.json /usr/src/app/package.json

# RUN npm install pm2 -g
RUN npm install --production

COPY . /usr/src/app

EXPOSE 5000

CMD [ "node", "worker.js"]
# CMD ["pm2-runtime", "process.yml"]