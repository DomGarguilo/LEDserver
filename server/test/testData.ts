import { v4 as uuidv4 } from 'uuid';

const RED_LED: Uint8Array = new Uint8Array([0xFF, 0x00, 0x00]);
const GREEN_LED: Uint8Array = new Uint8Array([0x00, 0xFF, 0x00]);
const BLUE_LED: Uint8Array = new Uint8Array([0x00, 0x00, 0xFF]);
const YELLOW_LED: Uint8Array = new Uint8Array([0xFF, 0xFF, 0x00]);

// Function to repeat an LED pattern for the whole frame
function createFrame(ledColor: Uint8Array): Uint8Array {
  return new Uint8Array(new Array(256).fill(ledColor).flat());
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

const testMetadata: {
  animationID: string;
  frameDuration: number;
  repeatCount: number;
  totalFrames: number;
  frameOrder: string[];
}[] = [
    {
      "animationID": "anim1",
      "frameDuration": 500,
      "repeatCount": 3,
      "totalFrames": 4,
      "frameOrder": [uuidv4(), uuidv4(), uuidv4(), uuidv4()]
    },
    {
      "animationID": "anim2",
      "frameDuration": 300,
      "repeatCount": 2,
      "totalFrames": 5,
      "frameOrder": [uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4()]
    },
    {
      "animationID": "anim3",
      "frameDuration": 200,
      "repeatCount": 4,
      "totalFrames": 3,
      "frameOrder": [uuidv4(), uuidv4(), uuidv4()]
    }
  ];

export { testAnimationData, testMetadata };
