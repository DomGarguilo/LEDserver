const SERVER_ROOT_URL = window.location.href;
//const SERVER_ROOT_URL = 'http://localhost:5000/';

export const IMAGE_PIXEL_LENGTH = 16;
export const FRAME_PIXEL_COUNT = Math.pow(IMAGE_PIXEL_LENGTH, 2);

/**
 * Reorders an array by moving an element from one index to another.
 * @param {Array} list - The original array.
 * @param {number} startIndex - The index of the element to be moved.
 * @param {number} endIndex - The index where the element should be moved to.
 * @returns {Array} - The reordered array.
 */
export const Reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

const grid = 6;
export const getItemStyle = (isDragging, draggableStyle) => {
    return {
        // some basic styles to make the items look a bit nicer
        userSelect: "none",
        padding: grid * 2,
        margin: `0 0 ${grid}px 0`,
        textAlign: "right",
        border: "solid",
        display: "flex",
        borderRadius: 6,

        // change background colour if dragging
        background: isDragging ? "lightgreen" : "grey",

        // styles we need to apply on draggables
        ...draggableStyle
    };
};

export const getWholeBoxStyle = (isDraggingOver) => ({
    background: isDraggingOver ? "lightpurple" : "lightgrey",
    display: "flex",
    flexDirection: "row",
    padding: 8,
    overflowX: "auto",
    alignItems: "center",
    height: "100%",
});

export const getFrameListStyle = (isDraggingOver) => ({
    background: isDraggingOver ? "lightpurple" : "lightgrey",
    padding: 4,
    height: "100%",
    display: "flex",
    overflow: "auto",
});

export const getFrameStyle = () => ({
    width: 100,
    height: 100,
    display: "flex"
});

export const assertTrue = (condition, message) => {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

export const arraysOrderAreEqual = (a, b) => {
    if (!(a instanceof Array || a instanceof Uint8Array) ||
        !(b instanceof Array || b instanceof Uint8Array)) {
        console.warn("One or both arguments are not arrays or typed arrays:", a, b);
        return false;
    }

    return a.length === b.length && a.every((v, i) => v === b[i]);
};

// converts a 1D array to a 2D array
// hardcoded 256 1D array -> 16x16 2D array
export const get2Darray = (arr) => {
    assertTrue(arr.length === FRAME_PIXEL_COUNT * 3, 'Array length needs to be 256*3');
    let result = Array.from(Array(IMAGE_PIXEL_LENGTH), () => new Array(IMAGE_PIXEL_LENGTH));
    for (let i = 0; i < IMAGE_PIXEL_LENGTH; i++) {
        for (let j = 0; j < IMAGE_PIXEL_LENGTH; j++) {
            let index = 3 * ((i * IMAGE_PIXEL_LENGTH) + j);
            result[i][j] = [arr[index], arr[index + 1], arr[index + 2]];
        }
    }
    return result;
}

// reverses every other row in a 2D array
// thats how the physical matrix needs it
export const reverseEveryOtherCol = (matrix) => {
    for (let col = 0; col < matrix[0].length; col++) {
        if (col % 2 === 1) {
            for (let row = 0; row < matrix.length / 2; row++) {
                let temp = matrix[row][col];
                matrix[row][col] = matrix[matrix.length - row - 1][col];
                matrix[matrix.length - row - 1][col] = temp;
            }
        }
    }
    return matrix;
}


/**
 * Sends the state data to the server.
 * @param {Array} metadataArray - The array of metadata.
 * @param {Map<string,Uint8Array>} frameDataMap - The map of frame data.
 * @returns {Promise<void>} - A promise that resolves when the data is sent to the server.
 */
export const sendStateToServer = async (metadataArray, frameDataMap) => {
    const formData = new FormData();

    // Add metadata to the form data
    formData.append('metadata', JSON.stringify(metadataArray));

    // Add frame data to the form data
    for (const [frameId, frameData] of frameDataMap.entries()) {
        // convert Uint8Array to Blob
        const blob = new Blob([frameData], { type: 'application/octet-stream' });
        formData.append(frameId, blob);
    }

    try {
        const response = await fetch('/data', { method: 'POST', body: formData });
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
    } catch (error) {
        console.error('Failed to send state to server:', error);
        throw error;
    }
}

export const fetchMetadataFromServer = async () => {
    const endpoint = SERVER_ROOT_URL + 'metadata';
    console.log('GET request for metadata from server. Endpoint: ' + endpoint);
    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Metadata received: ' + JSON.stringify(data));
    return data.metadata;
}

/**
 * @param {*} frameID the unique ID of the frame to fetch
 * @returns the frame data as a Uint8Array from the server
 */
export const fetchFrameDataFromServer = async (frameID) => {
    const endpoint = SERVER_ROOT_URL + `frameData/${frameID}`;
    console.log('GET request for frame data from server. Endpoint: ' + endpoint);
    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    if (response.headers.get("Content-Type") === "application/octet-stream") {
        const buffer = await response.arrayBuffer();
        console.log('Frame data received as binary');
        // Process the binary data as needed for your application
        return new Uint8Array(buffer);
    } else {
        throw new Error('Unexpected content type');
    }
}

// Assuming each pixel's data is 3 bytes (1 byte for red, 1 for green, 1 for blue)
export const parseFrameData = (buffer) => {
    const frameData = new Uint8Array(buffer);
    const pixels = [];
    for (let i = 0; i < frameData.length; i += 3) {
        pixels.push([frameData[i], frameData[i + 1], frameData[i + 2]]);
    }
    return pixels; // Returns an array of [R, G, B] values
}

export const convertUint8ArrayToHexColorArray = (uint8Array) => {
    // Ensure the array has a length that is a multiple of 3
    if (uint8Array.length % 3 !== 0) {
        throw new Error("The length of the Uint8Array should be a multiple of 3.");
    }

    const hexColorArray = [];
    for (let i = 0; i < uint8Array.length; i += 3) {
        // Extract RGB values
        const r = uint8Array[i];
        const g = uint8Array[i + 1];
        const b = uint8Array[i + 2];

        // Convert RGB values to a hex string and add to the array
        hexColorArray.push(rgbToHex(r, g, b));
    }
    return hexColorArray;
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

//fetches the list of animation order from the server
export const getJsonOrder = async () => {
    const endpoint = document.URL + 'order';
    const response = await fetch(endpoint);
    const jsonOrder = await response.json();
    console.log('Get request to pull image order from server. Response: ' + jsonOrder.order);
    return jsonOrder;
}

//TODO consolidate with the method from server/utils.ts
export const genFrameID = (length) => {
    if (length < 1) throw new Error('Length must be at least 1');
    const characters = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters[Math.floor(Math.random() * characters.length)];
    }
    return result;
};

// accepts an array of image URLs
// waits for them to load
// returns an array of those loaded HTMLimageElements
export async function loadImages(imageUrlArray) {
    const promiseArray = []; // create an array for promises
    const imageArray = []; // array for the images

    for (let imageUrl of imageUrlArray) {
        promiseArray.push(new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.src = imageUrl;
            imageArray.push(img);
        }));
    }

    await Promise.all(promiseArray); // wait for all the images to be loaded
    console.log("all images loaded");
    return imageArray;
}

/**
 * Resizes an image and returns an array of RGB values.
 * 
 * @param {HTMLImageElement} img - The source image to be resized.
 * @returns {Uint8Array} - The resized image represented as an array of RGB values.
 */
export function getResizedRGBArray(img) {
    // Draw the source image to get its pixel data
    const srcCanvas = document.createElement("canvas");
    const srcContext = srcCanvas.getContext("2d");
    srcCanvas.width = img.width;
    srcCanvas.height = img.height;
    srcContext.drawImage(img, 0, 0, img.width, img.height);

    // Get the source image pixel data
    const srcData = srcContext.getImageData(0, 0, img.width, img.height);
    const srcPixels = srcData.data;

    // Allocate an array for the destination RGB data
    const dstWidth = IMAGE_PIXEL_LENGTH;
    const dstHeight = IMAGE_PIXEL_LENGTH;
    const result = new Uint8Array(dstWidth * dstHeight * 3);

    // Perform nearest neighbor sampling from the source image to the destination
    for (let dstY = 0; dstY < dstHeight; dstY++) {
        for (let dstX = 0; dstX < dstWidth; dstX++) {
            // Calculate the corresponding pixel in the source image (nearest neighbor)
            const srcX = Math.floor(dstX * srcCanvas.width / dstWidth);
            const srcY = Math.floor(dstY * srcCanvas.height / dstHeight);

            // Calculate the index of the pixel in the source image
            const srcIndex = (srcY * srcCanvas.width + srcX) * 4; // 4 bytes per pixel (RGBA)

            // Calculate the index in the result array
            const dstIndex = (dstY * dstWidth + dstX) * 3; // 3 bytes per pixel (RGB)

            // Copy the RGB values from the source to the result array
            result[dstIndex + 0] = srcPixels[srcIndex + 0]; // Red
            result[dstIndex + 1] = srcPixels[srcIndex + 1]; // Green
            result[dstIndex + 2] = srcPixels[srcIndex + 2]; // Blue
        }
    }

    return result;
}