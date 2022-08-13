# Structure

This is a [MERN](https://www.mongodb.com/mern-stack) stack project and is split into a client side and server side. 
The client side consists of a react frontend. 
The server side consists of a Node, Express, MongoDB backend.

### Develpment

To install all dependencies for the project, you will need to run `npm install` within the root of the project as well as within `/client` and `/server`. Repeat when updates are made to dependency versions.

To connect to the database, you will need to have the database password as a `.env` variable. To do this, reach out to [@DomGarguilo](https://github.com/DomGarguilo) to get the password. Once you have the database password, make a copy of the `.env.example` file, renaming it to `.env` and paste the password in place of the `database_password` value in that file.

During development, you will have to start the server and client separately. Start the server first.

To start the server for development, run `npm run dev` in the root of the project. This starts `server.js` via [nodemon](https://nodemon.io/) which will autoreload when changes are made to that file. If nodemon ever causes issues, you can start the server normally via `node server/server.js` but will have to stop and restart if you make changes to `server.js` and want them to take affect.

To start the client, in a separate tab, run `npm start` from within `/client`. This will start the react app which will automatically reaload when changes are made.

For now, you will also have to manually change the server URL to localhost in [utils.js](https://github.com/DomGarguilo/LEDserver/blob/f2551469884eee1a8bd374dfb83145767c3b14d6/client/src/utils.js#L1-L2
). There is [a ticket tracking this issue](https://github.com/DomGarguilo/LEDserver/issues/46).
