displayPreviews();

// main function to display the image previews on the page
function displayPreviews() {
    // get image data from server
    getJsonData().then((v) => {
        // loops through each animation in image data
        const animationCount = v.animationList.length;
        for (let i = 0; i < animationCount; i++) {
            // get css header for each animation
            let data = v.animationList[i];
            // get css formatted color array
            let cssArray = generateFrameSet(10, data);
            // get css rules to cycle through frames in animation
            let cssDetails = generateCssDetails(data.name, 2);
            // get html tag to refference the animation
            let html = generateHtmlTag(data.name);
            // add the various parts to the page
            addHtml(html, 'imageQueue');
            addCss(cssArray);
            addCss(cssDetails);
        }
    });
    console.log('Previews rendered to screen');
}

// inserts css into stylesheet
function addCss(cssCode) {
    // creates the HTMLStyleElement
    let styleElement = document.createElement("style");
    // I think this checks if theres a stylesheet and creates one if not exists
    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = cssCode;
    } else { // if one exists append to it
        styleElement.appendChild(document.createTextNode(cssCode));
    }
    // appends new HTMLStyleElement to the document
    document.getElementsByTagName("head")[0].appendChild(styleElement);
}

// inserts html after provided div tag
function addHtml(htmlToInsert, insertAfterThisDivTag) {
    document.getElementById(insertAfterThisDivTag).innerHTML += htmlToInsert;
}

// generates the css color array for a single frame of animation
function generateFrame(pixelSize, frameRange, data) {
    let result = frameRange + ' {box-shadow:';
    for (let i = 1; i <= 16; i++) {
        for (let j = 1; j <= 16; j++) {
            result += (pixelSize * i).toString() + 'px ' + (pixelSize * j).toString() + 'px 0 0 #' + data[i - 1][j - 1];
            if (j == 16 && i == 16) {
                result += ';';
            } else {
                result += ',';
            }
        }
    }
    result += 'height:' + pixelSize.toString() + 'px;width:' + pixelSize.toString() + 'px;}';
    result = result.replaceAll('0x', '');
    return result;
}

// wraps the set of color arrays with additional CSS for displaying them as animation
function generateFrameSet(pixelSize, data) {
    let rangeList = getRange(data.frames.length);
    let result = '@keyframes ' + data.name + ' {';
    let frameList = data.frames;
    for (let i = 0; i < frameList.length; i++) {
        result = result + generateFrame(pixelSize, rangeList[i], reverseEveryOtherCol(get2Darray(frameList[i])));
    }
    result = result + '}'
    return result;
}

// takes a number and returns a corresponding range of percents needed for CSS animation details
// e.g. getRange(3) = {"0%, 33.3%","33.4%, 66.6%", "66.7%, 100%"}
function getRange(num) {
    let result = new Array(num);
    let increment = Number(100 / num);
    for (let i = 0; i < result.length; i++) {
        let start, end;
        if (i == 0) {
            start = 0.0;
            end = Number(increment);
        } else {
            start = ((i * increment) + 0.1);
            end = ((i * increment) + increment);
        }
        result[i] = start.toFixed(1) + '%, ' + end.toFixed(1) + '%';
    }
    return result;
}

// returns the css animation rules
// tells it how big and how fast to display frames and such
function generateCssDetails(name, seconds) {
    let result = '.' + name + ` {
        display: block;
        margin-bottom: 200px;
        animation: `+ name + ` 2s infinite;
        -webkit-animation: `+ name + ` 2s infinite;
        -moz-animation: `+ name + ` 2s infinite;
        -o-animation: `+ name + ` 2s infinite;
    }`
    return result;
}

// makes a POST req to the server
// Accepts json object containing hex color array for a new image formatted for use by the matrix
function post(json) {
    fetch("/data", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(json)
    }).then((response) => {
        // make this print correctly. maybe async or something
        console.log("POST request complete! response:", response);
    });
}

// fetches the image data json from server
// comes in array of hex color vals so other functions convert it to css-acceptable code
async function getJsonData() {
    console.log('Get request to pull image data made');
    let endpoint = document.URL + 'data';
    let response = await fetch(endpoint);
    jsonData = await response.json();
    return jsonData;
}

// create and return the html for a div tag for animation
function generateHtmlTag(name) {
    let result = `<div class="` + name + `"></div>`;
    return result;
}

// converts a 1D array to a 2D array
// hardcoded 256 1D array -> 16x16 2D array
function get2Darray(arr) {
    let result = Array.from(Array(16), () => new Array(16));
    for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 16; j++) {
            result[i][j] = arr[(j * 16) + i];
        }
    }
    // reverse every other line in array (needed for image display)
    return result;
}

// reverses every other row in a 2D array
// thats how the physical matrix needs it
function reverseEveryOtherCol(matrix) {
    for (let col = 0; col < matrix[0].length; col++) {
        if (col % 2 == 1) {
            for (let row = 0; row < matrix.length / 2; row++) {
                let temp = matrix[row][col];
                matrix[row][col] = matrix[matrix.length - row - 1][col];
                matrix[matrix.length - row - 1][col] = temp;
            }
        }
    }
    return matrix;
}

// reverse every other row in a 2D array
function reverseEveryOtherRow(arr) {
    let result = Array.from(Array(16), () => new Array());
    for (let i = 0; i < arr.length; i++) {
        if (i % 2 == 0) {
            for (let j = 0; j < arr[i].length; j++) {
                result[i].push(arr[i][j]);
            }
        } else {
            for (let j = arr[i].length - 1; j >= 0; j--) {
                result[i].push(arr[i][j]);
            }
        }
    }
    return result;
}


// pulls the image from the upload preview and converts it to an HTML canvas
function imgToCanvas() {
    // create image object
    var img = new Image();
    img.src = document.getElementById('myImgPreview').src;
    // get canvas from html by element ID
    var canvas = document.getElementById("myCanvasPreview");
    var context = canvas.getContext('2d');
    // scale image to fit canvas
    var scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    var x = (canvas.width / 2) - (img.width / 2) * scale;
    var y = (canvas.height / 2) - (img.height / 2) * scale;
    // draw canvas to screen
    context.drawImage(img, x, y, img.width * scale, img.height * scale);
}

// displays preview of uploaded image
function imagePreview(event) {
    var reader = new FileReader();
    reader.onload = function () {
        var myImgOutput = document.getElementById('myImgPreview');
        myImgOutput.src = reader.result;
        imgToCanvas(reader);
    }
    reader.readAsDataURL(event.target.files[0]);
}

function uploadImage() {
    let image = imageToHexArray();
    image = hexArrayToUpload(image);
    let validJson = getNewJson(getRandID(), 200, 12, image);
    console.log(validJson);
    post(validJson);
}

// converts an array to the serpentine pattern
// i.e. every other row of image reversed
function hexArrayToUpload(arr) {
    let result = new Array();
    for (let i = 0; i < 16; i++) {
        if (i % 2 == 0) {
            for (let j = 0; j < 16; j++) {
                result.push(arr[(i * 16) + j]);
            }
        } else {
            for (let j = 15; j >= 0; j--) {
                result.push(arr[(i * 16) + j]);
            }
        }
    }
    assert(result.length == 256, "wrong size in hex2upload " + result.length);
    return result;
}

// Proccess image on 'upload button' press
function imageToHexArray() {
    // pull image data from preview canvas
    var canvas = document.getElementById("myCanvasPreview");
    var context = canvas.getContext('2d');
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    assert((data.length / 4) === 256, "Unexpected data size in uploadImage");
    var result = new Array(0);
    for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        // const alpha = data[i + 3]; ignore alpha value
        result.push(rgbToHex(red, green, blue));
    }
    assert(result.length === 256, "Unexpected array size in uploadImage");
    return result;
}

// converts an r, g or b value to its hex equivalent
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

// converts a set of r, g and b values to its hex equivalent
function rgbToHex(r, g, b) {
    return "0x" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// assert the provided statement is true
// if false, log the message
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

// generates a template json to send to server
function getNewJson(name, frameDuration, repeatCount, frames) {
    var result = {}
    result.name = name;
    result.frameDuration = frameDuration;
    result.repeatCount = repeatCount;
    result.frames = [];
    result.frames[0] = frames;
    return result;
}

// generates a unique name for inserted image
function getRandID() {
    let result = 'ID';
    for (let i = 0; i < 10; i++) {
        let tempInt = Math.floor((Math.random() * 26) + 65);
        let tempChar = String.fromCharCode(tempInt);
        result += tempChar;
    }
    console.log('New UUID: ' + result);
    return result;
}