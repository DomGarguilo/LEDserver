import { Metadata } from '../Metadata';
import { FRAME_ID_LENGTH } from '../constants';
import { genFrameID } from '../utils';

const RED_LED: Uint8Array = new Uint8Array([0xFF, 0x00, 0x00]);
const GREEN_LED: Uint8Array = new Uint8Array([0x00, 0xFF, 0x00]);
const BLUE_LED: Uint8Array = new Uint8Array([0x00, 0x00, 0xFF]);
const YELLOW_LED: Uint8Array = new Uint8Array([0xFF, 0xFF, 0x00]);

// Function to repeat an LED pattern for the whole frame
function createFrame(ledColor: Uint8Array): Uint8Array {
  const frame = new Uint8Array(256 * 3); // 256 pixels * 3 RGB values per pixel
  for (let i = 0; i < frame.length; i += 3) {
    frame.set(ledColor, i);
  }
  return frame;
}

// Creating full-frame color patterns
const redFrame: Uint8Array = createFrame(RED_LED);
const greenFrame: Uint8Array = createFrame(GREEN_LED);
const blueFrame: Uint8Array = createFrame(BLUE_LED);
const yellowFrame: Uint8Array = createFrame(YELLOW_LED);

// Example data structure for animations
// Each animation is an array of frames, and each frame is an array of RGB values
const testAnimationData: { [key: string]: Uint8Array[] } = {
  // 4 frames
  'anim1': [
    redFrame,
    greenFrame,
    blueFrame,
    yellowFrame
  ],
  // 5 frames
  'anim2': [
    redFrame,
    greenFrame,
    redFrame,
    greenFrame,
    redFrame
  ],
  // 3 frames
  'anim3': [
    blueFrame,
    yellowFrame,
    blueFrame
  ]
};

const testMetadata: Metadata[] = [];

const anim1 = new Metadata('anim1', 500, 3, [genFrameID(FRAME_ID_LENGTH), genFrameID(FRAME_ID_LENGTH), genFrameID(FRAME_ID_LENGTH), genFrameID(FRAME_ID_LENGTH)]);
const anim2 = new Metadata('anim2', 300, 2, [genFrameID(FRAME_ID_LENGTH), genFrameID(FRAME_ID_LENGTH), genFrameID(FRAME_ID_LENGTH), genFrameID(FRAME_ID_LENGTH), genFrameID(FRAME_ID_LENGTH)]);
const anim3 = new Metadata('anim3', 200, 4, [genFrameID(FRAME_ID_LENGTH), genFrameID(FRAME_ID_LENGTH), genFrameID(FRAME_ID_LENGTH)]);

testMetadata.push(anim1);
testMetadata.push(anim2);
testMetadata.push(anim3);

export { testAnimationData, testMetadata };