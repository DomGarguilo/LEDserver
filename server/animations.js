const RED_LED = [0xFF, 0x00, 0x00];
const GREEN_LED = [0x00, 0xFF, 0x00];
const BLUE_LED = [0x00, 0x00, 0xFF];
const YELLOW_LED = [0xFF, 0xFF, 0x00];

// Function to repeat an LED pattern for the whole frame
function createFrame(ledColor) {
    return new Array(9).fill(ledColor).flat();
}

// Creating full-frame color patterns
const redFrame = createFrame(RED_LED);
const greenFrame = createFrame(GREEN_LED);
const blueFrame = createFrame(BLUE_LED);
const yellowFrame = createFrame(YELLOW_LED);

// Example data structure for animations
// Each animation is an array of frames, and each frame is an array of RGB values
const animations = {
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

module.exports = animations;