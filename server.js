const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const { readFileSync, writeFileSync } = require('fs');
const path = require('path')
const bodyParser = require('body-parser');
const cors = require('cors')

const orderFilePath = __dirname + '/public/data/order.json';
const dataFilePath = __dirname + '/public/data/data.json'

let animationCache = readFromFile(dataFilePath);
let orderCache = readFromFile(orderFilePath);

app.use(cors())

// Use these files as static files (meaning send these to the user as-is to their browser)
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/favicon.ico', express.static(__dirname + 'public/images/favicon.ico')); // favicon setup


// listen at specified port
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

// landing page
app.get('/', (req, res) => {
  console.log('Handling GET request for "/". Sending index.html');
  res.sendFile(__dirname + '/index.html');
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

// receives image data from the server and inserts it into the data file
app.post('/data', (req, res) => {
  console.log('POST request recieved for "/data"');

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

  console.log("ORDERCACHE: "+ orderCache.order);
  orderCache.order.unshift(newjson.name);
  writeToFile(orderFilePath, JSON.stringify(orderCache));
  console.log("ORDERCACHE: "+ orderCache.order);

  //for (let i = 0; i < newjson.length; i++) {
  var originalLength = animationCache.animationList.length;
  animationCache.animationList.push(newjson);
  var newLength = animationCache.animationList.length;
  console.log('Animation count went from length ' + originalLength + ' to ' + newLength);
  //}

  // write data to animation-data file
  try {
    writeToFile(dataFilePath, JSON.stringify(animationCache));
  } catch (err) {
    res.sendStatus(501).end('Data verified but could not insert');
  }
  res.sendStatus(200).end('Succesfully inserted data');

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
  try {
    assertThat(input != null && input != undefined, 'given var is null');
    assertThat(input.name != undefined, 'name is undefined');
    assertThat(input.frameDuration != undefined, 'frame duration is undefined');
    assertThat(input.repeatCount != undefined, 'repeat count is undefined');
    assertThat(input.frames != undefined, 'frame list is undefined');
    var frameListLength = input.frames.length;
    assertThat(frameListLength > 0, 'frame list has no entries');
    for (let i = 0; i < frameListLength; i++) {
      assertThat(input.frames[i].length == 256, i + 'th entry length in color array frame list != 256');
    }
    return null;
  } catch (err) {
    return err;
  }
}

// testing
function assertThat(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}