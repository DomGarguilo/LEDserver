const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const favicon = require('serve-favicon');

const orderFilePath = path.join(__dirname, 'data', 'order.json');
const dataFilePath = path.join(__dirname, 'data', 'data.json');

let animationCache = readFromFile(dataFilePath);
let orderCache = readFromFile(orderFilePath);

app.use(cors());

// Use these files as static files (meaning send these to the user as-is to their browser)
app.use('/', express.static(path.join(__dirname, 'build')));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(favicon(path.join(__dirname, 'build', 'favicon.ico')));

// listen at specified port
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

// landing page
app.get('/', (req, res) => {
  console.log('Handling GET request for "/". Sending index.html');
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// test get request, returns 'pong'
app.get('/ping', (req, res) => {
  console.log('Handling GET request for "/ping"');
  res.json('pong');
});

// GET request for the animation-data json
app.get('/data', (req, res) => {
  console.log('Handling GET request for "/data"');
  res.json(animationCache);
});

// GET request for order of animations
app.get('/order', (req, res) => {
  console.log('Handling GET request for "/order"');
  res.json(orderCache);
})

// POST request to replace the state of animations
app.post('/data', (req, res) => {
  console.log('POST request recieved for "/data"');

  // verify body of post request is valid format
  const newAnimationState = req.body;
  const passed = verifyAnimationJson(newAnimationState);
  if (passed != null) {
    res.sendStatus(500).end('Recieved data has incorrect format and was not inserted');
    throw new Error(passed);
  }

  console.log('Incoming data has passed inspection. First entry:');
  console.log('ID: ' + newAnimationState[0].name);
  console.log('Frame duration: ' + newAnimationState[0].frameDuration);
  console.log('Repeat count: ' + newAnimationState[0].repeatCount);
  console.log('Frame count: ' + newAnimationState[0].frames.length);

  // update cache
  animationCache.animationList = newAnimationState;

  // write data to animation-data file
  try {
    writeToFile(dataFilePath, JSON.stringify(animationCache));
  } catch (err) {
    res.sendStatus(501).end('New data has been verified but not written to file');
  }
  res.sendStatus(200).end('Succesfully updated animation state');

});

app.post('/order', (req, res) => {
  var data = req.body;
  orderCache.order = data;
  writeToFile(orderFilePath, JSON.stringify(data));
});

// write to file
function writeToFile(file, data) {
  writeFileSync(file, data, (err) => {
    if (err) throw err;

    // success case, the file was saved
    console.log('File overwritten: ' + file);
  });
}

function readFromFile(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

// verify that given input is correct format to be inserted into data json
// returns an error if incorrect or null if it is correct
function verifyAnimationJson(input) {
  input.forEach(animation => {
    try {
      assertTrue(animation != null && animation != undefined, 'given var is null');
      assertTrue(animation.name != undefined, 'name is undefined');
      assertTrue(animation.frameDuration != undefined, 'frame duration is undefined');
      assertTrue(animation.repeatCount != undefined, 'repeat count is undefined');
      assertTrue(animation.frames != undefined, 'frame list is undefined');
      const frameListLength = animation.frames.length;
      assertTrue(frameListLength > 0, 'frame list has no entries');
      for (let i = 0; i < frameListLength; i++) {
        assertTrue(animation.frames[i].length === 256, i + 'th entry length in color array frame list != 256');
      }
    } catch (err) {
      return err;
    }
  });
  return null;
}

// testing
function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}