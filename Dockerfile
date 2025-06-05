FROM node:22-alpine

# install dependencies from root
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# install dependencies from server
WORKDIR /app/server
COPY /server/package*.json ./
RUN npm ci

# install dependencies from client
WORKDIR /app/client
COPY /client/package*.json ./
RUN npm ci --omit=dev

# copy the remaining source files
WORKDIR /app
COPY . .

# build the server and client
RUN npm run build

# remove the client source files, keep only the build
RUN rm -rf client/src

CMD ["npm", "start"]