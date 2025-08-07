import express, { Request, Response } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import favicon from 'serve-favicon';
import * as fs from 'fs';
import multer from 'multer';
import { FRAME_ID_LENGTH } from './constants';
import { genFrameID, hashString } from './utils';

import connectToMongo from './db/connectToMongo';
import { testAnimationData, testMetadata } from './test/testData';
import { fetchFrame, insertFrame } from './db/animationOperations';
import { fetchMetadataArray, replaceMetadataArray } from './db/metadataOperations';
import { Frame } from "./Frame";
import { Metadata } from "./Metadata";
import { GoogleSheetsService, createGoogleSheetsService } from "./googleSheetsService";

const app = express();
const port = process.env.PORT || 5000;
const firmwareDirectory = path.join(__dirname, 'firmware');

const SHEETS_FETCH_INTERVAL_MS = 5 * 1000;
const HISTORY_FRAME_DURATION_MS = 500; // Duration for each historical frame
const CURRENT_FRAME_DURATION_MS = 2 * 60 * 1000; // 10 minutes for current frame

const HISTORY_ANIMATION_ID = 'sheets_history';
const CURRENT_ANIMATION_ID = 'sheets_current';

let animationCache: Set<Frame> = new Set();
let metadataCache: Metadata[] = [];
let metadataHash: string = '';

// Google Sheets integration
let sheetsService: GoogleSheetsService | null = null;
let fetchInterval: NodeJS.Timeout | null = null;
let lastFetchedData: string | null = null; // Hash of last fetched grid data

const updateMetadataCacheAndHash = async (metadata: Metadata[]) => {
  metadataCache = metadata;
  metadataHash = hashString(JSON.stringify(metadata));
}

/**
 * Updates the two-animation system with new Google Sheets data:
 * - History animation: all previous frames with short duration
 * - Current animation: latest frame with long duration
 */
const updateSheetAnimations = async () => {
  if (!sheetsService) {
    console.error('Google Sheets service not configured');
    return;
  }

  try {
    console.log('Fetching new frame from Google Sheets');

    // Fetch grid data first to check for changes
    const gridData = await sheetsService.fetchGridData();
    const gridHash = hashString(JSON.stringify(gridData));

    // Check if data has changed since last fetch
    if (lastFetchedData === gridHash) {
      console.log('Grid data unchanged, skipping animation update');
      return;
    }

    // Data has changed, update animations
    const frameID = genFrameID(FRAME_ID_LENGTH);
    const rgbData = sheetsService.convertGridToRGBData(gridData);
    const newFrame = new Frame(frameID, rgbData);

    // Find existing history and current animations
    let historyMetadata = metadataCache.find(m => m.animationID === HISTORY_ANIMATION_ID);
    let currentMetadata = metadataCache.find(m => m.animationID === CURRENT_ANIMATION_ID);

    // If there's an existing current frame, move it to history
    if (currentMetadata && currentMetadata.frameOrder.length > 0) {
      const currentFrameID = currentMetadata.frameOrder[0];

      // Create history animation if it doesn't exist
      if (!historyMetadata) {
        historyMetadata = new Metadata(
          HISTORY_ANIMATION_ID,
          HISTORY_FRAME_DURATION_MS,
          1,
          []
        );
        // Insert history animation at the beginning of the array to ensure it comes first
        metadataCache.unshift(historyMetadata);
      }

      // Move current frame to history (keeping same frame ID)
      historyMetadata.frameOrder.push(currentFrameID);

      // Copy frame data to history with same ID
      const frameToMove = Array.from(animationCache).find(f => f.frameID === currentFrameID);
      if (frameToMove) {
        const historyFrame = new Frame(currentFrameID, frameToMove.data);
        animationCache.add(historyFrame);
        await insertFrame(currentFrameID, frameToMove.data);
      }
    }

    // Create or update current animation with new frame
    if (currentMetadata) {
      currentMetadata.frameOrder = [frameID];
    } else {
      currentMetadata = new Metadata(
        CURRENT_ANIMATION_ID,
        CURRENT_FRAME_DURATION_MS,
        1,
        [frameID]
      );
      // Add current animation after history (or at the end if no history)
      const historyIndex = metadataCache.findIndex(m => m.animationID === HISTORY_ANIMATION_ID);
      if (historyIndex >= 0) {
        metadataCache.splice(historyIndex + 1, 0, currentMetadata);
      } else {
        metadataCache.push(currentMetadata);
      }
    }

    // Add new frame to cache and database
    animationCache.add(newFrame);
    await insertFrame(frameID, newFrame.data);

    // Update metadata in database
    await replaceMetadataArray(metadataCache);
    updateMetadataCacheAndHash(metadataCache);

    const historyCount = historyMetadata ? historyMetadata.frameOrder.length : 0;
    console.log(`Updated animations: ${historyCount} frames in history, 1 current frame`);

    // Update last fetched data hash
    lastFetchedData = gridHash;
  } catch (error) {
    console.error('Error updating sheet animations:', error);
  }
}

/**
 * Starts periodic fetching from Google Sheets
 */
const startPeriodicFetching = (intervalMs: number) => {
  if (fetchInterval) {
    clearInterval(fetchInterval);
  }

  fetchInterval = setInterval(async () => {
    await updateSheetAnimations();
  }, intervalMs);

  console.log(`Started periodic fetching every ${intervalMs}ms`);
}

/**
 * Stops periodic fetching
 */
const stopPeriodicFetching = () => {
  if (fetchInterval) {
    clearInterval(fetchInterval);
    fetchInterval = null;
    console.log('Stopped periodic fetching');
  }
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
        for (let j = 0; j < currentMetadata.frameOrder.length; j++) {
          const frameData = testAnimationData[currentMetadata.animationID][j];
          const frameID = currentMetadata.frameOrder[j]
          console.log(`Inserting frame with ID ${frameID} into animation ${currentMetadata.animationID}`);
          await insertFrame(frameID, frameData);
        }
      }
    } else {
      updateMetadataCacheAndHash(metadata);
    }

    // initialize animation cache based on metadata
    for (let i = 0; i < metadataCache.length; i++) {
      const currentMetadata = metadataCache[i];
      console.log('looking for animation ' + currentMetadata.animationID);
      for (let j = 0; j < currentMetadata.frameOrder.length; j++) {
        const currentFrameID = currentMetadata.frameOrder[j];
        const frameData = new Uint8Array(await fetchFrame(currentFrameID));
        animationCache.add(new Frame(currentFrameID, frameData));
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
    const frameData: Uint8Array = frame.data;
    await insertFrame(frameID, frameData);
  }
};


/**
 * Sets the initial deduplication hash only if the current sheet state 
 * already exists in the database. This prevents skipping the initial
 * import on fresh installs.
 */
const setInitialDeduplicationHash = async (testGrid: number[][]) => {
  if (!sheetsService) return;

  try {
    // Convert current sheet state to RGB data (same format as stored frames)
    const currentRgbData = sheetsService.convertGridToRGBData(testGrid);

    // Check if we have any existing sheet animations
    const currentMetadata = metadataCache.find(m => m.animationID === CURRENT_ANIMATION_ID);

    if (currentMetadata && currentMetadata.frameOrder.length > 0) {
      // Get the current frame from the database
      const currentFrameID = currentMetadata.frameOrder[0];
      const existingFrame = Array.from(animationCache).find(f => f.frameID === currentFrameID);

      if (existingFrame) {
        // Compare current sheet data with existing frame data
        const dataMatches = currentRgbData.every((value, index) => value === existingFrame.data[index]);

        if (dataMatches) {
          // Current sheet state matches database, safe to set dedup hash
          lastFetchedData = hashString(JSON.stringify(testGrid));
          console.log('Current sheet state matches database - deduplication enabled');
        } else {
          console.log('Current sheet state differs from database - will update on first fetch');
        }
      } else {
        console.log('Current frame not found in cache - will fetch on first run');
      }
    } else {
      console.log('No existing sheet animations found - will create on first fetch');
    }
  } catch (error) {
    console.error('Error checking initial sheet state:', error);
    // Don't set hash on error - safer to fetch than to skip
  }
};

// Initialize Google Sheets service if environment variables are set
const initializeGoogleSheets = async () => {
  const sheetsUrl = process.env.GOOGLE_SHEETS_URL;
  const sheetId = process.env.GOOGLE_SHEETS_SHEET_ID || '0';

  if (sheetsUrl) {
    try {
      sheetsService = createGoogleSheetsService(sheetsUrl, sheetId);
      console.log('Google Sheets service initialized from environment variables');

      // Test fetch immediately to catch configuration issues early
      console.log('Testing Google Sheets connection...');
      try {
        const testGrid = await sheetsService.fetchGridData();
        console.log('✅ Google Sheets connection successful!');
        console.log('Sample data from first row:', testGrid[0]?.slice(0, 5) || 'No data');

        // Only set dedup hash if current sheet state already exists in database
        await setInitialDeduplicationHash(testGrid);

        // Start periodic fetching automatically after successful test
        startPeriodicFetching(SHEETS_FETCH_INTERVAL_MS);
      } catch (testError) {
        console.error('❌ Google Sheets connection failed:', testError instanceof Error ? testError.message : testError);
        console.log('Periodic fetching will NOT be started due to connection failure');
      }
    } catch (error) {
      console.error('Failed to initialize Google Sheets service:', error);
    }
  }
};

/**
 * Cleans up corrupted sheet animations and ensures system integrity
 */
const cleanupCorruptedSheetAnimations = async () => {
  console.log('Checking for corrupted sheet animations...');

  let needsCleanup = false;
  const corruptedAnimations: string[] = [];
  const validSheetAnimations: string[] = [];

  // Check for sheet animations with missing frame data
  for (const metadata of metadataCache) {
    if (metadata.animationID === HISTORY_ANIMATION_ID || metadata.animationID === CURRENT_ANIMATION_ID) {
      let hasCorruptedFrames = false;

      for (const frameID of metadata.frameOrder) {
        const frameExists = Array.from(animationCache).some(f => f.frameID === frameID);
        if (!frameExists) {
          console.log(`Found corrupted animation: ${metadata.animationID} - frame ${frameID} missing`);
          hasCorruptedFrames = true;
          break;
        }
      }

      if (hasCorruptedFrames) {
        corruptedAnimations.push(metadata.animationID);
        needsCleanup = true;
      } else if (metadata.frameOrder.length > 0) {
        validSheetAnimations.push(metadata.animationID);
      }
    }
  }

  if (needsCleanup || validSheetAnimations.length === 0) {
    console.log('Cleaning up sheet animations...');

    // Remove ALL sheet animations to ensure clean state
    metadataCache = metadataCache.filter(m =>
      m.animationID !== HISTORY_ANIMATION_ID && m.animationID !== CURRENT_ANIMATION_ID
    );

    // Remove orphaned sheet frames from cache
    // Since frames no longer store animationID, we need to identify them by frameID
    const sheetFrameIDs = new Set<string>();
    for (const metadata of metadataCache) {
      if (metadata.animationID === HISTORY_ANIMATION_ID || metadata.animationID === CURRENT_ANIMATION_ID) {
        metadata.frameOrder.forEach(frameID => sheetFrameIDs.add(frameID));
      }
    }

    const framesToRemove = Array.from(animationCache).filter(f => sheetFrameIDs.has(f.frameID));
    framesToRemove.forEach(frame => animationCache.delete(frame));

    // Update database
    await replaceMetadataArray(metadataCache);
    updateMetadataCacheAndHash(metadataCache);

    console.log('Sheet animations cleaned up - will be recreated on next fetch');
  } else {
    console.log('Sheet animations are healthy');
  }
};

// Initialize database first, then Google Sheets
const initializeServer = async () => {
  await connectToDbAndInitCache();
  await cleanupCorruptedSheetAnimations();
  await initializeGoogleSheets();
};

initializeServer();

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
    const frame: Buffer = await fetchFrame(frameId);
    if (!frame) {
      console.error(`Could not find frame with ID ${frameId}`);
      return res.status(404).send('Frame not found.');
    }

    res.contentType('application/octet-stream');
    res.send(frame);

  } catch (error) {
    console.error('Error fetching frame:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Raw binary batch endpoint: returns concatenated RGB buffers for an animation in correct frame order
app.get('/framesRaw/:animationID', async (req: Request, res: Response) => {
  try {
    const animationID = req.params.animationID;
    // find metadata order for this animation
    const meta = metadataCache.find(m => m.animationID === animationID);
    if (!meta) {
      return res.status(404).send('Animation metadata not found');
    }

    // Fetch frames directly by frameID in the correct order
    const buffers = await Promise.all(
      meta.frameOrder.map(frameID => fetchFrame(frameID))
    );

    const combined = Buffer.concat(buffers);
    res.contentType('application/octet-stream');
    res.send(combined);
  } catch (error) {
    console.error('Error fetching raw frames batch:', error);
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

const upload = multer();

// POST request to replace the state of animations
// this will update the order document
// this will also update the animation documents or create new ones if not exists
app.post('/data', upload.any(), async (req, res) => {
  console.log('POST request received for "/data"');

  try {
    const metadataArray = JSON.parse(req.body.metadata);

    console.log('Received metadata:', metadataArray);

    // Verify the format of the received metadata
    if (!verifyAnimationJson(metadataArray)) {
      console.error('Invalid animation JSON format.');
      return res.status(500).send('Invalid animation JSON format.');
    }

    // Reconstruct the frames Map from received files
    const framesMap: Map<string, Uint8Array> = new Map();
    if (req.files) {
      for (const file of req.files as Express.Multer.File[]) {
        const frameData = new Uint8Array(file.buffer);
        framesMap.set(file.fieldname, frameData);
      }
    }
    console.log(`Received frames count: ${framesMap.size}`);

    const newAnimationData: Set<Frame> = new Set();
    for (const metadata of metadataArray) {
      console.log('Adding frames for animation:', metadata.animationID);
      for (const frameID of metadata.frameOrder) {
        const frameData: Uint8Array | undefined = framesMap.get(frameID);
        if (!frameData) {
          console.error('Frame data not found for frameID:', frameID);
          return res.status(500).send(`Frame data not found for frameID: ${frameID}`);
        }

        newAnimationData.add(new Frame(frameID, frameData));
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
    res.status(501).send('Error pushing data to mongo');
  }
});

// Google Sheets endpoints
app.post('/sheets/configure', (req: Request, res: Response) => {
  try {
    const { spreadsheetUrl, sheetId = '0' } = req.body;

    if (!spreadsheetUrl) {
      return res.status(400).json({ error: 'spreadsheetUrl is required' });
    }

    sheetsService = createGoogleSheetsService(spreadsheetUrl, sheetId);
    res.json({ message: 'Google Sheets service configured successfully' });
  } catch (error) {
    console.error('Error configuring Google Sheets service:', error);
    res.status(500).json({ error: 'Failed to configure Google Sheets service' });
  }
});

app.post('/sheets/start-fetching', (req: Request, res: Response) => {
  try {
    if (!sheetsService) {
      return res.status(400).json({ error: 'Google Sheets service not configured' });
    }

    startPeriodicFetching(SHEETS_FETCH_INTERVAL_MS);
    res.json({ message: `Started periodic fetching every ${SHEETS_FETCH_INTERVAL_MS}ms` });
  } catch (error) {
    console.error('Error starting periodic fetching:', error);
    res.status(500).json({ error: 'Failed to start periodic fetching' });
  }
});

app.post('/sheets/stop-fetching', (req: Request, res: Response) => {
  stopPeriodicFetching();
  res.json({ message: 'Stopped periodic fetching' });
});

app.post('/sheets/fetch-once', async (req: Request, res: Response) => {
  try {
    if (!sheetsService) {
      return res.status(400).json({ error: 'Google Sheets service not configured' });
    }

    await updateSheetAnimations();
    res.json({ message: 'Fetched and updated sheet animations' });
  } catch (error) {
    console.error('Error fetching frame:', error);
    res.status(500).json({ error: 'Failed to fetch frame' });
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