const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const { readFileSync, writeFileSync } = require('fs');
const path = require('path')
const bodyParser = require('body-parser');


// Use these files as static files (meaning send these to the user as-is to their browser)
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/favicon.ico', express.static(__dirname + 'public/images/favicon.ico')); // favicon setup


// listen at specified port
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

// when the user makes a get request to '/' (meaning http://{website}/ -- but in our case, http://localhost:3000/)
// send them the file `FILENAME`
app.get('/', (req, res) => {
  console.log('Loading index');
  res.sendFile(__dirname + '/index.html');
});

// try it with a different suffix! go to http://localhost:3000/ping
app.get('/ping', (req, res) => {
  console.log('Incoming GET request');
  res.json('pong');
});

// GET request for the animation-data json
app.get('/data', (req, res) => {
  console.log('GET request for /data');
  res.json(getJsonData());
});

// receives image data from the server and inserts it into the data file
app.post('/data', (req, res) => {
  console.log('POST');
  var newjson = verifyAnimationJson(req);
  //var newjson = req.body;
  console.log(newjson.length);
  if (newjson.length > 0) {
    res.sendStatus(200);
    var filejson = getJsonData();
    let i;
    for (i = 0; i < newjson.length; i++) {
      filejson.animationList.push(newjson[i]);
    }
    writeToFile(__dirname + '/public/data/data.json', JSON.stringify(filejson));
  } else {
    console.log('errpr');
    res.sendStatus(200).end('length 0 json recieved');
  }

});

// update jsonData variable from file
function getJsonData() {
  console.log('reading from data.json file');
  return JSON.parse(readFileSync(__dirname + '/public/data/data.json', 'utf8'));
}

// write to file
function writeToFile(file, data) {
  writeFileSync(file, data, (err) => {
    if (err) throw err;

    // success case, the file was saved
    console.log('File overwritten: ' + file);
  });
}

function verifyAnimationJson(input) {
  assert(input != null, 'input is null');
  input = input.body;
  console.log(input);
  //input = JSON.parse(input);
  assert(input.name != undefined, 'name is undefined');
  assert(input.frameDuration != undefined, 'name is undefined');
  assert(input.repeatCount != undefined, 'name is undefined');
  assert(input.frames != undefined, 'name is undefined');
  assert(input.frames.length > 0, 'name is undefined');
  return input;
}

// testing
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}