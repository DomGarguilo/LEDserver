import express, { Request, Response } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import favicon from 'serve-favicon';
import * as fs from 'fs';
import { FRAME_ID_LENGTH } from './constants';
import { genFrameID, hashString } from './utils';

import connectToMongo from './db/connectToMongo';
import { testAnimationData, testMetadata } from './test/testData';
import { fetchFrame, insertFrame } from './db/animationOperations';
import { fetchMetadataArray, replaceMetadataArray } from './db/metadataOperations';
import { Frame } from "./Frame";
import { Metadata } from "./Metadata";

const app = express();
const port = process.env.PORT || 5000;
const firmwareDirectory = path.join(__dirname, 'firmware');

let animationCache: Set<Frame> = new Set();
let metadataCache: Metadata[] = [];
let metadataHash: string = '';

const updateMetadataCacheAndHash = async (metadata: Metadata[]) => {
  metadataCache = metadata;
  metadataHash = hashString(JSON.stringify(metadata));
}

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
      console.log(testMetadata);

      // Insert metadata into the database
      await replaceMetadataArray(testMetadata);

      // Fetch the metadata from the database again to get the inserted IDs
      updateMetadataCacheAndHash(await fetchMetadataArray());
      console.log('Metadata inserted into database:');
      console.log(metadataCache);

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
      updateMetadataCacheAndHash(metadata);
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
    await insertFrame(animationID, frameID, frameData);
  }
};


connectToDbAndInitCache();

/**
 * 
 * ROUTES AND EXPRESS SETUP
 * 
 */

app.use(cors());
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

const clientBuildPath: string = path.join(__dirname, '../../client/build');
const faviconPath: string = path.join(clientBuildPath, 'favicon.ico');

// Serve static files from the React app build directory
app.use(express.static(clientBuildPath));

// Use favicon if it exists
// at a different path for development vs production
if (fs.existsSync(faviconPath)) {
  app.use(favicon(faviconPath));
}

// listen at specified port
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

// landing page
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// test get request, returns 'pong'
app.get('/ping', (req: Request, res: Response) => {
  console.log('Handling GET request for "/ping"');
  res.json('pong');
  return;
});

app.get('/metadata', (req: Request, res: Response) => {
  console.log('Handling GET request for "/metadata"');
  // check that each frame ID in the metadataCache is the correct length
  metadataCache.forEach(metadata => {
    metadata.frameOrder.forEach(frameID => {
      assertTrue(frameID.length === FRAME_ID_LENGTH, 'Frame ID ' + frameID + ' is not the correct length');
    });
  });
  const data = {
    metadata: metadataCache,
    hash: metadataHash
  };
  res.json(data);
});

app.get('/metadata/hash/:hash', (req: Request, res: Response) => {
  console.log('Handling GET request for "/metadata/hash"');
  const hash = req.params.hash;
  const data = {
    hashesMatch: hash === metadataHash
  };
  res.json(data);
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

/**
 * Function to get the version from the name of the first firmware file found. Looks in the firmware directory.
 */
const getFirmwareVersionFromFilename = (): string | null => {
  try {
    const files = fs.readdirSync(firmwareDirectory);

    if (files.length === 0) {
      console.warn('No firmware files found.');
      return null;
    }

    if (files.length > 1) {
      console.warn('More than one firmware file found. Using the first one.');
    }

    const firstFile = files[0];
    const match = firstFile.match(/^firmware_(\d+\.\d+\.\d+)\.bin$/);
    return match ? match[1] : null;
  } catch (err) {
    console.warn('Could not read firmware directory:', err);
    return null;
  }
}

app.get('/firmware/:clientVersion', (req, res) => {
  const clientVersion = req.params.clientVersion;
  const currentFirmwareVersion = getFirmwareVersionFromFilename();

  if (!currentFirmwareVersion) {
    res.status(501).json({ error: 'No firmware version available' });
    return;
  }

  if (clientVersion === currentFirmwareVersion) {
    console.log('Firmware is up to date');
    res.status(204).end(); // 204 No Content, firmware is up to date
  } else {
    console.log(`Firmware is out of date. Client version: ${clientVersion}, Current version: ${currentFirmwareVersion}`);
    const firmwarePath = path.join(firmwareDirectory, `firmware_${currentFirmwareVersion}.bin`);

    fs.stat(firmwarePath, (err, stats) => {
      if (err) {
        console.error('Error reading firmware file:', err);
        res.status(502).json({ error: 'Error reading firmware file' });
      } else {
        res.status(200);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename=${path.basename(firmwarePath)}`);
        fs.createReadStream(firmwarePath).pipe(res);
      }
    });
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

// POST request to replace the state of animations
// this will update the order document
// this will also update the animation documents or create new ones if not exists
app.post('/data', async (req, res) => {
  console.log('POST request received for "/data"');

  try {
    // Reconstruct the frames Map from received array of [key, value] pairs
    const framesMap = new Map(req.body.frames);
    const metadataArray = req.body.metadata;

    console.log(`Received frames count: ${framesMap.size}`);
    console.log('Received metadata:', metadataArray);

    // Verify the format of the received metadata
    const verificationResult = verifyAnimationJson(metadataArray);
    if (verificationResult !== true) {
      console.error(verificationResult);
      return res.status(500).send('Invalid animation JSON format.');
    }

    const newAnimationData: Set<Frame> = new Set();
    for (const metadata of metadataArray) {
      console.log('Adding frames for animation:', metadata.animationID);
      for (const frameID of metadata.frameOrder) {
        const frameObject = framesMap.get(frameID) as { [key: string]: number } | undefined;
        if (!frameObject) {
          console.error('Frame data not found for frameID:', frameID);
          return res.status(500).send(`Frame data not found for frameID: ${frameID}`);
        }

        const frameData = objectToArray(frameObject);
        newAnimationData.add(new Frame(frameID, metadata.animationID, frameData));
      }
    }

    // Update metadata cache and hash, then push to MongoDB
    updateMetadataCacheAndHash(metadataArray);
    animationCache = newAnimationData;

    await Promise.all([
      replaceMetadataArray(metadataCache),
      pushAnimationCacheToMongo()
    ]);
    console.log('Sent to MongoDB with no errors');
    res.sendStatus(200);
  } catch (err) {
    console.error('Error processing request:', err);
    res.sendStatus(501).send('Error pushing data to mongo');
  }
});

// Catch-all handler for any request that doesn't match the above
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

/**
 * 
 * UTIL FUNCTIONS
 * 
 */

// verify that given input is correct format to be inserted into data json
// returns an error if incorrect or null if it is correct
function verifyAnimationJson(input: Metadata[]) {
  input.forEach(animation => {
    try {
      assertTrue(animation != null && animation != undefined, 'given var is null');
      assertTrue(animation.animationID != undefined, 'name is undefined');
      assertTrue(animation.frameDuration != undefined, 'frame duration is undefined');
      assertTrue(animation.repeatCount != undefined, 'repeat count is undefined');
      assertTrue(animation.frameOrder != undefined, 'frame list is undefined');
      const frameListLength = animation.frameOrder.length;
      assertTrue(frameListLength > 0, 'frame list has no entries');
      for (let i = 0; i < frameListLength; i++) {
        assertTrue(animation.frameOrder[i].length === 256 * 3, i + 'the entry length in color array frame list != 256*3');
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