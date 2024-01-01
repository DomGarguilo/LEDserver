const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const favicon = require('serve-favicon');
const connectToMongo = require('./db/connectToMongo');
const testData = require('./test/testData');
const animationOperations = require('./db/animationOperations');
const metadataOperations = require('./db/metadataOperations');

let animationCache = new Map(); // map of animationID + frameNumber to frame data
let metadataCache = [];

/**
 * 
 * MONGO DB STUFF
 * 
 */

const connectToDbAndInitCache = async () => {
  await connectToMongo().then(async () => {
    console.log('Initializing animation cache from database');

    const metadata = await metadataOperations.fetchMetadataArray();
    if (metadata.length === 0) {
      console.log('No metadata found in database. Inserting new test metadata array');
      await metadataOperations.replaceMetadataArray(testData.metadata);
      console.log('Inserting accompanying test animations');
      console.log('Animations: ' + testData.animations);
      for (let i = 0; i < testData.metadata.length; i++) {
        const currentMetadata = testData.metadata[i];
        for (let j = 0; j < currentMetadata.totalFrames; j++) {
          const frameData = testData.animations[currentMetadata.animationID][j];
          await animationOperations.insertFrame(currentMetadata.animationID, j, frameData);
          console.log(await animationOperations.fetchFrame(currentMetadata.animationID, j));
        }
      }
    } else {
      metadataCache = metadata;
    }

    // initialize animation cache based on metadata
    for (let i = 0; i < metadataCache.length; i++) {
      const currentMetadata = metadataCache[i];
      console.log('looking for animation ' + currentMetadata.animationID);
      for (let j = 0; j < currentMetadata.totalFrames; j++) {
        const frameData = await animationOperations.fetchFrame(currentMetadata.animationID, j);
        assertTrue(frameData !== 'undefined', 'Could not find animation for name: ' + currentMetadata.animationID + ' and frame number: ' + j);
        animationCache.set({ ID: currentMetadata.animationID, index: j }, frameData);
        console.log('Added frame ' + j + ' to animation ' + currentMetadata.animationID);
      }
    }
    console.log('Animation cache initialized.');
  });
}

// Updates animations documents or creates new ones
const updateAnimationsInMongo = async () => {
  animationCache.forEach(async (frameData, key) => {
    const animationID = key.ID;
    const frameNumber = key.index;
    await animationOperations.insertFrame(animationID, frameNumber, frameData);
  });
}

connectToDbAndInitCache();

/**
 * 
 * ROUTES AND EXPRESS SETUP
 * 
 */

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
  return;
});

// test get request, returns 'pong'
app.get('/ping', (req, res) => {
  console.log('Handling GET request for "/ping"');
  res.json('pong');
  return;
});

app.get('/metadata', (req, res) => {
  res.send(metadataCache);
});

// Endpoint to fetch a specific frame of an animation
app.get('/frameData/:animationId/:frameNumber', (req, res) => {
  console.log('Handling GET request for "/frameData"');
  console.log('animationId: ' + req.params.animationId);
  console.log('frameNumber: ' + req.params.frameNumber);
  const animationId = req.params.animationId;
  const frameNumber = parseInt(req.params.frameNumber);
  const animation = testData.animations[animationId];

  if (animation && frameNumber >= 0 && frameNumber < animation.length) {
    const frame = animation[frameNumber];
    const buffer = Buffer.from(frame);
    console.log('frame size: ' + buffer.length);
    res.contentType('application/octet-stream');
    res.send(buffer);
  } else {
    res.status(404).send('Animation or frame not found');
  }
});

// POST request to replace the state of animations
// this will update the order document
// this will also update the animation documents or create new ones if not exists
app.post('/data', (req, res) => {
  console.log('POST request recieved for "/data"');

  // verify body of post request is valid format
  const newAnimationState = req.body;
  const passed = verifyAnimationJson(newAnimationState);
  if (passed !== true) {
    console.error(passed);
    res.sendStatus(500);
    return;
  }

  console.log('Incoming data has passed inspection. First entry:');
  console.log('ID: ' + newAnimationState[0].animationID);
  console.log('Frame duration: ' + newAnimationState[0].frameDuration);
  console.log('Repeat count: ' + newAnimationState[0].repeatCount);
  console.log('Frame count: ' + newAnimationState[0].frames.length);

  animationCache.animationList = newAnimationState;

  // grab the current order of the animations
  const newOrder = [];
  for (let i = 0; i < animationCache.animationList.length; i++) {
    newOrder.push(animationCache.animationList[i].animationID);
  }
  metadataCache = newOrder;

  // update database
  metadataOperations.replaceMetadataArray(metadataCache).then(() => {
    updateAnimationsInMongo();
  }).catch(err => {
    console.error(err);
    res.sendStatus(501);
    return;
  });
  res.sendStatus(200);
  console.log('Sent to MongoDB with no errors');
  return;
});

/**
 * 
 * UTIL FUNCTIONS
 * 
 */

// verify that given input is correct format to be inserted into data json
// returns an error if incorrect or null if it is correct
function verifyAnimationJson(input) {
  input.forEach(animation => {
    try {
      assertTrue(animation != null && animation != undefined, 'given var is null');
      assertTrue(animation.animationID != undefined, 'name is undefined');
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
  return true;
}

// testing
function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}