FROM node:16-alpine

WORKDIR /app

COPY . /app

RUN npm run postbuild

CMD ["npm", "start"]