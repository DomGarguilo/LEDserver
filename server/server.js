const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const favicon = require('serve-favicon');
const mongo = require('./mongo');
const animationSchema = require('./schemas/animation-schema');
const orderSchema = require('./schemas/order-schema');

// might be able to make this just an array to avoid calling .animationList
let animationCache = { animationList: [] };
let orderCache = [];

/**
 * 
 * MONGO DB STUFF
 * 
 */

// This initializes the animation and order cache from MongoDB
const connectToMongoDB = async () => {
  await mongo().then(async mongoose => {
    try {
      console.log('Initializing animation cache from database');

      // get order array
      const orderData = await orderSchema.find({}, { _id: 0 });
      const order = orderData[0].order;
      orderCache = order;

      // get all animation data an insert it in the order specified by the order array
      for (let i = 0; i < orderCache.length; i++) {
        const currentName = orderCache[i];
        console.log('looking for ' + currentName)
        const animation = await animationSchema.find({ name: currentName }, { _id: 0 });
        assertTrue(animation !== 'undefined', 'Could not find animation for name: ' + currentName);
        assertTrue(verifyAnimationJson([animation]), 'New animation bad format: ' + animation);
        animationCache.animationList.push(animation[0]);
      }
      assertTrue(orderCache.length === animationCache.animationList.length);
    } finally {
      mongoose.connection.close();
    }
  });
}

// Updates the order document with what is currently in order cache
const updateOrderInMongo = async () => {
  await mongo().then(async mongoose => {
    try {
      console.log('Updating order');

      await orderSchema.updateOne({}, {
        order: orderCache
      });
    } finally {
      mongoose.connection.close;
    }
  });
}

// Updates animations documents or creates new ones
const updateAnimationsInMongo = async () => {
  await mongo().then(async mongoose => {
    try {
      console.log('Updating or adding animations');
      const options = { upsert: true, new: true, setDefaultsOnInsert: true };

      const animationList = animationCache.animationList;
      assertTrue(verifyAnimationJson(animationList), 'Animation list has bad format. Not interting into DB: ' + animationList);

      for (let i = 0; i < animationList.length; i++) {
        const currentAnimation = animationList[i];
        let query = { name: currentAnimation.name };
        let update = {
          frameDuration: currentAnimation.frameDuration,
          repeatCount: currentAnimation.repeatCount,
          frames: currentAnimation.frames
        };
        await animationSchema.findOneAndUpdate(query, update, options);
      }
    } finally {
      mongoose.connection.close;
    }
  });
}

connectToMongoDB();

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

// GET request for the animation-data json
app.get('/data', (req, res) => {
  console.log('Handling GET request for "/data"');
  res.json(animationCache);
  return;
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
  console.log('ID: ' + newAnimationState[0].name);
  console.log('Frame duration: ' + newAnimationState[0].frameDuration);
  console.log('Repeat count: ' + newAnimationState[0].repeatCount);
  console.log('Frame count: ' + newAnimationState[0].frames.length);

  animationCache.animationList = newAnimationState;

  // grab the current order of the animations
  const newOrder = [];
  for (let i = 0; i < animationCache.animationList.length; i++) {
    newOrder.push(animationCache.animationList[i].name);
  }
  orderCache = newOrder;

  // update database
  try {
    updateOrderInMongo();
    updateAnimationsInMongo();
  } catch (err) {
    console.error(err);
    res.sendStatus(501);
    return;
  }
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
  return true;
}

// testing
function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}