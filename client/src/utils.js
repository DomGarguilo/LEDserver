const SERVER_ROOT_URL = window.location.href;
// const SERVER_ROOT_URL = 'http://localhost:5000/';

export const IMAGE_PIXEL_LENGTH = 16;
export const FRAME_PIXEL_COUNT = Math.pow(IMAGE_PIXEL_LENGTH, 2);

// a little function to help us with reordering the result
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

        // change background colour if dragging
        background: isDragging ? "lightgreen" : "grey",

        // styles we need to apply on draggables
        ...draggableStyle
    };
};

export const getWholeBoxStyle = (isDraggingOver) => ({
    background: isDraggingOver ? "lightpurple" : "lightgrey",
    padding: 8
});

export const getFrameListStyle = (isDraggingOver) => ({
    background: isDraggingOver ? "lightpurple" : "lightgrey",
    padding: 4,
    height: 180,
    display: "flex"
});

export const getFrameStyle = () => ({
    width: 100,
    height: 100,
    display: "flex"
});

export const getHeaderStyle = () => ({
    height: 300,
    backgroundColor: "grey",
    itemsAlign: "center",
    color: "white",
    outline: "5px dashed green",
    fontSize: "calc(10px + 4vmin)"
});

export const assertTrue = (condition, message) => {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

export const arraysOrderAreEqual = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b))
        throw new TypeError("Either one or both parameters is not an Array");

    return a.length === b.length && a.every((v, i) => v === b[i]);
}

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


// makes a POST req to the server
// Accepts json object containing hex color array for a new image formatted for use by the matrix
export const post = async (data, path) => {
    try {
        const config = {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }
        const response = await fetch(path, config);
        console.log("POSTRRR " + response);
        if (response.ok) {
            // maybe maybe this a callback to refresh
            return response;
        } else {
            console.error("error in response, status not OK");
        }
    } catch (error) {
        return error;
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
    return data;
}

/**
 * @param {String} animationID the animation to fetch from
 * @param {*} frameNum the frame number to fetch
 * @returns the frame data as a Uint8Array from the server
 */
export const fetchFrameDataFromServer = async (animationID, frameNum) => {
    const endpoint = SERVER_ROOT_URL + `frameData/${animationID}/${frameNum}`;
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
