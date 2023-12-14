FROM node:21-alpine

# install dependencies from root
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# install dependencies from server
WORKDIR /app/server
COPY /server/package*.json ./
RUN npm ci --omit=dev

# install dependencies from client
WORKDIR /app/client
COPY /client/package*.json ./
RUN npm ci --omit=dev

# copy the remaining source files
WORKDIR /app
COPY . .

# build the production react app and move it into the server dir
WORKDIR /app/client
RUN npm run build
RUN rm -rf ../server/build
RUN mv ./build ../server

# move back into the root dir to start the app
WORKDIR /app
RUN rm -rf client/

CMD ["npm", "start"]