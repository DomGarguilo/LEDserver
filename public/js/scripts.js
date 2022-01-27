const IMAGE_PIXEL_LENGTH = 16;
const PIXEL_COUNT_PER_IMAGE = 256;

// main function to display the image previews on the page
async function createAnimationList(callback) {

    const rawOrderJson = await getJsonOrder();
    const animationOrderArray = rawOrderJson.order; // array defining the order of animations

    const rawDataJson = await getJsonData();
    const animationArray = rawDataJson.animationList; // array defining animation image data

    assertThat(animationOrderArray.length === animationArray.length, 'Order array and animation array should be the same length');

    // create ordered list of html tags for animations and insert them into the html list
    for (const animationID of animationOrderArray) {
        // get html tag to refference the animation
        const html = generateHtmlListElement(animationID);
        insertHTML(html);
    }

    // loop through the rest of the animation data to create the animations
    for (const data of animationArray) {
        const pixelSize = 10;
        const cssArray = generateCSSFrameSet(pixelSize, data);
        const cssDetails = generateCSSDetails(data.name);

        insertCss(cssArray);
        insertCss(cssDetails);
    }
    console.log('Finished creating list of animations. Now calling makeListDraggable()');
    callback(arguments[1]);
}

// makes list draggable. takes the lists' id as input
function makeListDraggable(target) {
    console.log("Making list draggable. ID='" + target + "'");
    // (A) GET LIST + ATTACH CSS CLASS
    target = document.getElementById(target);
    target.classList.add("slist");

    // (B) MAKE ITEMS DRAGGABLE + SORTABLE
    var items = target.getElementsByTagName("li"), current = null;
    for (let i of items) {
        // (B1) ATTACH DRAGGABLE
        i.draggable = true;

        // (B2) DRAG START - YELLOW HIGHLIGHT DROPZONES
        i.addEventListener("dragstart", function (ev) {
            current = this;
            for (let it of items) {
                if (it != current) { it.classList.add("hint"); }
            }
        });

        // (B3) DRAG ENTER - RED HIGHLIGHT DROPZONE
        i.addEventListener("dragenter", function (ev) {
            if (this != current) { this.classList.add("active"); }
        });

        // (B4) DRAG LEAVE - REMOVE RED HIGHLIGHT
        i.addEventListener("dragleave", function () {
            this.classList.remove("active");
        });

        // (B5) DRAG END - REMOVE ALL HIGHLIGHTS
        i.addEventListener("dragend", function () {
            for (let it of items) {
                it.classList.remove("hint");
                it.classList.remove("active");
            }
        });

        // (B6) DRAG OVER - PREVENT THE DEFAULT "DROP", SO WE CAN DO OUR OWN
        i.addEventListener("dragover", function (evt) {
            evt.preventDefault();
        });

        // (B7) ON DROP - DO SOMETHING
        i.addEventListener("drop", function (evt) {
            evt.preventDefault();
            if (this != current) {
                let currentpos = 0, droppedpos = 0;
                for (let it = 0; it < items.length; it++) {
                    if (current == items[it]) { currentpos = it; }
                    if (this == items[it]) { droppedpos = it; }
                }
                if (currentpos < droppedpos) {
                    this.parentNode.insertBefore(current, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(current, this);
                }
            }
        });
    }
}

// get order of animation queue
function getCurrentAnimationOrder() {
    var list = document.getElementById("sortlist");
    var items = list.getElementsByTagName("li");
    var animationOrder = new Array();
    for (let i of items) {
        var clazz = i.childNodes[0].className;
        animationOrder.push(clazz);
    }
    return animationOrder;
}


// send an order of animations to update the server
function sendQueueOrder() {
    var order = { "order": getCurrentAnimationOrder() };
    post(order, "/order");
}

// inserts css into stylesheet
function insertCss(cssCode) {
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

// inserts html into list
function insertHTML(htmlToInsert) {
    let list = document.getElementById("sortlist");
    list.appendChild(htmlToInsert);
}

// generates the css color array for a single frame of animation
function generateFrame(pixelSize, frameRange, data) {
    let result = frameRange + ' {box-shadow:';
    for (let i = 1; i <= IMAGE_PIXEL_LENGTH; i++) {
        for (let j = 1; j <= IMAGE_PIXEL_LENGTH; j++) {
            result += (pixelSize * i).toString() + 'px ' + (pixelSize * j).toString() + 'px 0 0 #' + data[i - 1][j - 1];
            if (j == IMAGE_PIXEL_LENGTH && i == IMAGE_PIXEL_LENGTH) {
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
function generateCSSFrameSet(pixelSize, data) {
    const rangeList = getCSSAnimationTimings(data.frames.length);
    const frameList = data.frames;
    let result = '@keyframes ' + data.name + ' {';
    for (let i = 0; i < frameList.length; i++) {
        result = result + generateFrame(pixelSize, rangeList[i], reverseEveryOtherCol(get2Darray(frameList[i])));
    }
    result = result + '}'
    return result;
}

// takes a number and returns a corresponding range of percents needed for CSS animation details
// e.g. getRange(3) = {"0%, 33.3%","33.4%, 66.6%", "66.7%, 100%"}
function getCSSAnimationTimings(num) {
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
function generateCSSDetails(name) {
    return '.' + name + ` {
        display: block;
        margin-bottom: 170px;
        animation: ` + name + ` 2s infinite;
        -webkit-animation: ` + name + ` 2s infinite;
        -moz-animation: ` + name + ` 2s infinite;
        -o-animation: ` + name + ` 2s infinite;
    }`
}

// return an html list element containing the div for an animation
function generateHtmlListElement(name) {
    let li = document.createElement("li");
    let div = document.createElement("div");
    div.setAttribute('class', name);
    li.appendChild(div);
    return li;
}

// makes a POST req to the server
// Accepts json object containing hex color array for a new image formatted for use by the matrix
async function post(data, path) {
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
            return await response;
        } else {
            console.error("error in response, status not OK");
        }
    } catch (error) {
        return error;
    }
}

// fetches the image data json from server
// comes in array of hex color vals so other functions convert it to css-acceptable code
async function getJsonData() {
    const endpoint = document.URL + 'data';
    const response = await fetch(endpoint);
    const jsonData = await response.json();
    console.log('Get request to pull image data made');
    return jsonData;
}

//fetches the list of animation order from the server
async function getJsonOrder() {
    const endpoint = document.URL + 'order';
    const response = await fetch(endpoint);
    const jsonOrder = await response.json();
    console.log('Get request to pull image order from server. Response: ' + jsonOrder.order);
    return jsonOrder;
}


// converts a 1D array to a 2D array
// hardcoded 256 1D array -> 16x16 2D array
function get2Darray(arr) {
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
// NOT CURRENT USED
function reverseEveryOtherRow(arr) {
    let result = Array.from(Array(IMAGE_PIXEL_LENGTH), () => new Array());
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

async function uploadImage() {
    // scrape image from the preview canvas
    let image = imageToHexArray();
    image = hexArrayToUpload(image);
    // put image data into the animation json
    let validJson = getNewJson(getRandID(), 200, 12, image);
    console.log(validJson);
    // post to server then refresh the page, drawing the updated data from server
    await post(validJson, "/data");
    window.location.reload();
}

// converts an array to the serpentine pattern
// i.e. every other row of image reversed
function hexArrayToUpload(arr) {
    let result = new Array();
    for (let i = 0; i < IMAGE_PIXEL_LENGTH; i++) {
        if (i % 2 == 0) {
            for (let j = 0; j < IMAGE_PIXEL_LENGTH; j++) {
                result.push(arr[(i * IMAGE_PIXEL_LENGTH) + j]);
            }
        } else {
            for (let j = IMAGE_PIXEL_LENGTH - 1; j >= 0; j--) {
                result.push(arr[(i * IMAGE_PIXEL_LENGTH) + j]);
            }
        }
    }
    assertThat(result.length === PIXEL_COUNT_PER_IMAGE, "wrong size in hex2upload " + result.length);
    return result;
}

// Proccess image on 'upload button' press
function imageToHexArray() {
    // pull image data from preview canvas
    var canvas = document.getElementById("myCanvasPreview");
    var context = canvas.getContext('2d');
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    assertThat((data.length / 4) === PIXEL_COUNT_PER_IMAGE, "Unexpected data size in uploadImage");
    var result = new Array(0);
    for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        // const alpha = data[i + 3]; ignore alpha value
        result.push(rgbToHex(red, green, blue));
    }
    assertThat(result.length === PIXEL_COUNT_PER_IMAGE, "Unexpected array size in uploadImage");
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
function assertThat(condition, message) {
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
    const idLength = 10;
    for (let i = 0; i < idLength; i++) {
        let tempInt = Math.floor((Math.random() * 26) + 65);
        let tempChar = String.fromCharCode(tempInt);
        result += tempChar;
    }
    console.log('New UUID: ' + result);
    return result;
}