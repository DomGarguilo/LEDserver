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
  console.log('POST request recieved');

  // verify body of post request is valid format
  var newjson = req.body;
  var passed = verifyAnimationJson(newjson);
  if (passed != null) {
    res.sendStatus(500).end('Recieved data has incorrect format and was not inserted');
    throw new Error(passed);
  }

  console.log('Incoming data has passed inspection. New entry details:');
  console.log('ID: ' + newjson.name);
  console.log('Frame duration: ' + newjson.frameDuration);
  console.log('Repeat count: ' + newjson.repeatCount);
  console.log('Frame count: ' + newjson.frames.length);

  // retrieve animation json from file
  var jsonFromFile = getJsonData();

  //for (let i = 0; i < newjson.length; i++) {
  console.log(jsonFromFile.animationList.length);
  jsonFromFile.animationList.push(newjson);
  console.log(jsonFromFile.animationList.length);
  //}

  try {
    writeToFile(__dirname + '/public/data/data.json', JSON.stringify(jsonFromFile));
  } catch (err) {
    res.sendStatus(501).end('Data verified but could not insert');
  }
  res.sendStatus(200).end('Succesfully inserted data');

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

// verify that given input is correct format to be inserted into data json
// returns an error if incorrect or null if it is correct
function verifyAnimationJson(input) {
  try {
    assert(input == null && input != undefined, 'given var is null');
    assert(input.name != undefined, 'name is undefined');
    assert(input.frameDuration != undefined, 'frame duration is undefined');
    assert(input.repeatCount != undefined, 'repeat count is undefined');
    assert(input.frames != undefined, 'frame list is undefined');
    var frameListLength = input.frames.length;
    assert(frameListLength > 0, 'frame list has no entries');
    for (let i = 0; i < frameListLength; i++) {
      assert(input.frames[i].length == 256, i + 'th entry length in color array frame list != 256');
    }
    return null;
  } catch (err) {
    return err;
  }
}

// testing
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}