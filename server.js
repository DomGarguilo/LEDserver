// I'm just going to write out a few of these so you understand how express works.
// there is a ton of information about it online and its really easy to use.

// Turning this js script into an express app
//const { json } = require('express');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
var path = require('path')


// Use these files as static files (meaning send these to the user as-is to their browser)
//app.use(express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// favicon setup
app.use('/favicon.ico', express.static(__dirname + 'public/images/favicon.ico'));

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

//const myFile = require('/public/data/data.json');

app.get('/data', (req, res) => {
  console.log("GET data");
  res.json(getJsonData());
});

// listen at specified port
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

//update jsonData variable from file
function getJsonData() {
  console.log('reading json file');
  return JSON.parse(fs.readFileSync(__dirname + '/public/data/data.json', 'utf8'));
}