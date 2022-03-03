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

export const getQuestionListStyle = (isDraggingOver) => ({
    background: isDraggingOver ? "orange" : "lightgrey",
    padding: 8
});

export const getAnswerListStyle = (isDraggingOver) => ({
    background: isDraggingOver ? "orange" : "lightgrey",
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
    height: 100,
    backgroundColor: "black",
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
    assertTrue(arr.length === FRAME_PIXEL_COUNT, 'Array length needs to be 256');
    let result = Array.from(Array(IMAGE_PIXEL_LENGTH), () => new Array(IMAGE_PIXEL_LENGTH));
    for (let i = 0; i < IMAGE_PIXEL_LENGTH; i++) {
        for (let j = 0; j < IMAGE_PIXEL_LENGTH; j++) {
            result[i][j] = arr[(j * IMAGE_PIXEL_LENGTH) + i];
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