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

// Insert all frames in animation cache into mongo
const pushAnimationCacheToMongo = async () => {
  for (let [key, frameData] of animationCache.entries()) {
    const animationID = key.ID;
    const frameNumber = key.index;
    try {
      await animationOperations.insertFrame(animationID, frameNumber, frameData);
    } catch (error) {
      console.error(`Error inserting frame ${frameNumber} for animation ${animationID}:`, error);
    }
  }
};


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
app.get('/frameData/:animationId/:frameNumber', async (req, res) => {
  const animationId = req.params.animationId;
  if (!animationId) {
    return res.status(400).send('Animation ID is required.');
  }

  const frameNumber = parseInt(req.params.frameNumber);
  if (isNaN(frameNumber)) {
    return res.status(400).send('Frame number must be a valid number.');
  }

  try {
    const animationMetadata = metadataCache.find(metadata => metadata.animationID === animationId);
    if (!animationMetadata) {
      console.error(`Animation ID ${animationId} not found.`);
      return res.status(404).send('Animation ID not found.');
    }

    if (frameNumber < 0 || frameNumber >= animationMetadata.totalFrames) {
      console.error(`Frame number ${frameNumber} is out of range for animation ${animationId}.`);
      return res.status(400).send('Frame number is out of range.');
    }

    const frame = await animationOperations.fetchFrame(animationId, frameNumber);
    if (!frame) {
      console.error(`Could not find frame ${frameNumber} for animation ${animationId}`);
      return res.status(404).send('Frame not found.');
    }

    const buffer = Buffer.from(frame);
    res.contentType('application/octet-stream');
    res.send(buffer);

  } catch (error) {
    console.error('Error fetching frame:', error);
    res.status(500).send('Internal Server Error');
  }
});

function objectToArray(frameObject) {
  const arrayLength = Object.keys(frameObject).length / 3; // Assuming each pixel has R, G, B
  let frameArray = [];

  for (let i = 0; i < arrayLength; i++) {
    frameArray.push(frameObject[String(i * 3)]);
    frameArray.push(frameObject[String(i * 3 + 1)]);
    frameArray.push(frameObject[String(i * 3 + 2)]);
  }

  return frameArray;
}

// POST request to replace the state of animations
// this will update the order document
// this will also update the animation documents or create new ones if not exists
app.post('/data', async (req, res) => {
  console.log('POST request received for "/data"');

  // verify body of post request is valid format
  const newAnimationState = req.body;
  const passed = verifyAnimationJson(newAnimationState);
  if (passed !== true) {
    console.error(passed);
    res.sendStatus(500);
    return;
  }

  console.log(`Incoming data has passed inspection. Received ${newAnimationState.length} animations.`);
  console.log('First animation:');
  console.log('ID: ' + newAnimationState[0].animationID);
  console.log('Frame duration: ' + newAnimationState[0].frameDuration);
  console.log('Repeat count: ' + newAnimationState[0].repeatCount);
  console.log('Frame count: ' + newAnimationState[0].frames.length);

  // grab the current order of the animations
  const newMetadata = [];
  const newAnimationData = new Map();
  for (let i = 0; i < newAnimationState.length; i++) {
    const currentAnimation = newAnimationState[i];
    const animationID = currentAnimation.animationID;
    const current = {
      animationID: animationID,
      frameDuration: currentAnimation.frameDuration,
      repeatCount: currentAnimation.repeatCount,
      totalFrames: currentAnimation.frames.length
    }
    newMetadata.push(current);
    for (let j = 0; j < currentAnimation.frames.length; j++) {
      const frameObject = currentAnimation.frames[j]; // The object you're showing
      const frameArray = objectToArray(frameObject); // Convert it to an array
      newAnimationData.set({ ID: animationID, index: j }, frameArray);
    }
  }
  metadataCache = newMetadata;
  animationCache = newAnimationData;

  try {
    // update database with new metadata and animations
    await Promise.all([
      metadataOperations.replaceMetadataArray(metadataCache),
      pushAnimationCacheToMongo()
    ]);
    console.log('Sent to MongoDB with no errors');
    res.sendStatus(200);
  } catch (err) {
    console.error('Error pushing data to mongo:', err);
    res.sendStatus(501);
  }
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