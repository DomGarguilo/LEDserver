import { Frame } from "./Frame";
import { Metadata } from "./Metadata";
import { v4 as uuidv4 } from 'uuid';

import express, { Request, Response } from 'express';
const app = express();
const port = process.env.PORT || 5000;
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import favicon from 'serve-favicon';

import connectToMongo from './db/connectToMongo';
import { testAnimationData, testMetadata } from './test/testData';
import { fetchFrame, insertFrame } from './db/animationOperations';
import { fetchMetadataArray, replaceMetadataArray } from './db/metadataOperations';

let animationCache: Set<Frame> = new Set();
let metadataCache: Metadata[] = [];

/**
 * 
 * MONGO DB STUFF
 * 
 */

const connectToDbAndInitCache = async () => {
  await connectToMongo().then(async () => {
    console.log('Initializing animation cache from database');

    const metadata = await fetchMetadataArray();
    if (metadata.length === 0) {
      console.log('No metadata found in database. Inserting new test metadata array:');

      // Insert metadata into the database
      await replaceMetadataArray(testMetadata);

      // Fetch the metadata from the database again to get the inserted IDs
      metadataCache = await fetchMetadataArray();
      console.log('Metadata inserted into database:');

      console.log('Inserting accompanying test animations');
      for (let i = 0; i < metadataCache.length; i++) {
        const currentMetadata = metadataCache[i];
        console.log(`Inserting animation ${currentMetadata.animationID}`);
        for (let j = 0; j < currentMetadata.totalFrames; j++) {
          const frameData = testAnimationData[currentMetadata.animationID][j];
          const frameID = currentMetadata.frameOrder[j]
          console.log(`Inserting frame with ID ${frameID} into animation ${currentMetadata.animationID}`);
          await insertFrame(currentMetadata.animationID, frameID, frameData);
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
        const currentFrameID = currentMetadata.frameOrder[j];
        const frameData = await fetchFrame(currentFrameID);
        assertTrue(frameData !== null, 'Could not find animation for name: ' + currentMetadata.animationID + ' and frame number: ' + j);
        animationCache.add(new Frame(currentFrameID, currentMetadata.animationID, frameData));
        console.log('Added frame ' + j + ' to animation ' + currentMetadata.animationID);
      }
    }
    console.log('Animation cache initialized.');
  });
}

// Insert all frames in animation cache into mongo
const pushAnimationCacheToMongo = async () => {
  for (const frame of animationCache) {
    const frameID: string = frame.frameID;
    const animationID: string = frame.animationID;
    const frameData: Uint8Array = frame.data;
    try {
      await insertFrame(animationID, frameID, frameData);
    } catch (error) {
      console.error(`Error inserting frame ${frameID} for animation ${animationID}:`, error);
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
app.get('/', (req: Request, res: Response) => {
  console.log('Handling GET request for "/". Sending index.html');
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
  return;
});

// test get request, returns 'pong'
app.get('/ping', (req: Request, res: Response) => {
  console.log('Handling GET request for "/ping"');
  res.json('pong');
  return;
});

app.get('/metadata', (req: Request, res: Response) => {
  console.log('Handling GET request for "/metadata"');
  res.send(metadataCache);
});

// Endpoint to fetch a specific frame of an animation
app.get('/frameData/:frameId', async (req: Request, res: Response) => {
  const frameId = req.params.frameId;
  if (!frameId) {
    return res.status(400).send('Frame ID is required.');
  }

  try {
    // Fetch the frame data using the frame ID
    const frame = await fetchFrame(frameId);
    if (!frame) {
      console.error(`Could not find frame with ID ${frameId}`);
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

function objectToArray(frameObject: { [key: string]: number }): Uint8Array {
  const arrayLength = Object.keys(frameObject).length;

  assertTrue(arrayLength === 256 * 3, 'Invalid frame length. Expected 256*3.');

  const frameArray = Object.keys(frameObject).map((key) => {
    const value = frameObject[key];
    if (typeof value !== 'number' || value < 0 || value > 255) {
      throw new Error(`Invalid value at key ${key}. Expected a number between 0 and 255.`);
    }
    return value;
  });

  return new Uint8Array(frameArray);
}

interface AnimationState {
  animationID: string;
  frameDuration: number;
  repeatCount: number;
  frames: { [key: string]: number }[];
}

// POST request to replace the state of animations
// this will update the order document
// this will also update the animation documents or create new ones if not exists
app.post('/data', async (req, res) => {
  console.log('POST request received for "/data"');

  // verify body of post request is valid format
  const newAnimationState: AnimationState[] = req.body;
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
  const newMetadata: Metadata[] = [];
  const newAnimationData: Set<Frame> = new Set();
  for (let i = 0; i < newAnimationState.length; i++) {
    const currentAnimation = newAnimationState[i];
    const animationID = currentAnimation.animationID;
    const frameOrder: string[] = [];
    for (let j = 0; j < currentAnimation.frames.length; j++) {
      const frameObject: { [key: string]: number } = currentAnimation.frames[j];
      const frameArray = objectToArray(frameObject);
      // need to send the frame ID from the client to here
      const frameID = uuidv4();
      frameOrder.push(frameID);
      newAnimationData.add(new Frame(frameID, animationID, frameArray));
    }
    const current = new Metadata(animationID, currentAnimation.frameDuration, currentAnimation.repeatCount, currentAnimation.frames.length, frameOrder);
    newMetadata.push(current);
  }
  metadataCache = newMetadata;
  animationCache = newAnimationData;

  try {
    // update database with new metadata and animations
    await Promise.all([
      replaceMetadataArray(metadataCache),
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
function verifyAnimationJson(input: AnimationState[]) {
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

function assertTrue(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}