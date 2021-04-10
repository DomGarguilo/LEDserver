const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
var path = require('path')
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use('/favicon.ico', express.static(__dirname + 'public/images/favicon.ico')); // favicon setup

// Use these files as static files (meaning send these to the user as-is to their browser)
app.use(express.static(path.join(__dirname, 'public')));

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

// sends the animation json
app.get('/data', (req, res) => {
  console.log("GET data");
  res.json(getJsonData());
});

// listen at specified port
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

// receives image data from the server
app.post('/data', (req, res) => {
  var newjson = req.body;
  if (newjson.length > 0) {
    res.sendStatus(200);
    var filejson = getJsonData();
    var i;
    for (i = 0; i < newjson.length; i++) {
      filejson.animationList.push(newjson[i]);
    }
    writeToFile(__dirname + '/public/data/data.json', JSON.stringify(filejson));
  } else {
    res.sendStatus(200).send('length 0 json recieved');
  }

});

// update jsonData variable from file
function getJsonData() {
  console.log('reading json file');
  return JSON.parse(fs.readFileSync(__dirname + '/public/data/data.json', 'utf8'));
}

// write to file
function writeToFile(file, data) {
  fs.writeFile(file, data, (err) => {
    if (err) throw err;

    // success case, the file was saved
    console.log('File overwritten: ' + file);
  });
}