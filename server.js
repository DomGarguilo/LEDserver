// I'm just going to write out a few of these so you understand how express works.
// there is a ton of information about it online and its really easy to use.

// Turning this js script into an express app
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Use these files as static files (meaning send these to the user as-is to their browser)
app.use(express.static(__dirname + '/public'));

// when the user makes a get request to '/' (meaning http://{website}/ -- but in our case, http://localhost:3000/)
// send them the file `FILENAME`
app.get('/', (req, res) => {
  console.log("Loading index");
  res.sendFile(__dirname + '/index.html');
});


// try it with a different suffix! go to http://localhost:3000/ping
app.get('/ping', (req, res) => {
  console.log("Incoming GET request");
  res.json('pong');
});

app.get('/data', (req, res) => {
  console.log("GET data");
  res.sendFile(__dirname + '/public/data/data.json');
});

// listen at specified port
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});