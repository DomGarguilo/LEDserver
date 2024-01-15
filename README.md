# LED matrix server

This is the server side of the LED matrix project. This web app allows you to create, delete and reorganize the set of animations. The LED matix will use the API in this project to pull the updated set of animations for display.

## Quickstart

To start both the web app and database, run `docker compose up` from within the root of the project.


## Develpment

### Structure

This is a [MERN](https://www.mongodb.com/mern-stack) stack project and is split into a client side and server side. 
The client side consists of a react frontend. 
The server side consists of a Node, Express, MongoDB backend.

### Dependencies

To install all dependencies for the project, you will need to run `npm install` within the root of the project as well as within `/client` and `/server`. Repeat these steps when updates are made or new dependencies are added.

### Starting the app in development mode

Before starting the web app, you will need to have mongoDB running somewhere the web app can connect to. I suggest running the generic mongo docker image via `docker run -d -p 27017:27017 mongo`.

To start both the client and server, you can run `npm run dev` from the root of the project. This will start the server via nodemon and also start the development server for the react app.