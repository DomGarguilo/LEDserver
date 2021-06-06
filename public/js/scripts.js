main();

// main function to display the image previews on the page
function main() {
    // get image data from server
    getJsonData().then((v) => {
        // loops through each animation in image data
        const animationCount = v.animationList.length;
        for (let i = 0; i < animationCount; i++) {
            // get css header for each animation
            let ranges = getRange(v.animationList[i].frames.length);
            let data = v.animationList[i];
            // get css formatted color array
            let cssArray = generateFrameSet(10, ranges, data);
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

// fetches the image data json from server
// comes in array of hex color vals so other functions convert it to css-acceptable code
async function getJsonData() {
    let endpoint = document.URL + 'data';
    let response = await fetch(endpoint);
    jsonData = await response.json();
    return jsonData;
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

// wraps the color array with additional CSS for displaying the frame
function generateFrameSet(pixelSize, rangeList, data) {
    let result = '@keyframes ' + data.name + ' {';
    let frameList = data.frames;
    for (let i = 0; i < frameList.length; i++) {
        result = result + generateFrame(pixelSize, rangeList[i], get2Darray(frameList[i]));
    }
    result = result + '}'
    return result;
}


// makes a POST req to the server
// Accepts json object containing hex color array for a new image
function post(json) {
    fetch("/data", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(json)
    }).then(res => {
        console.log("Request complete! response:", res);
    });
}

// inserts html after specified div tag
function addHtml(html, insertTag) {
    document.getElementById(insertTag).innerHTML += html;
}

// create and return div tag for animation based on its name
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
    return reverseEveryOther(result);
}

// takes a number and returns a range of percents
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

// reverses every other row since in the raw array
// every other is reversed since thats how the physical matrix needs it
function reverseEveryOther(matrix) {
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

// returns the css animation rules
// tells it how big and how fast to display frames and such
function generateCssDetails(name, seconds) {
    let result = '.' + name + ` {
        display: block;
        margin-bottom: 200px;
        animation: `+ name + `2s infinite;
        -webkit-animation: `+ name + ` 2s infinite;
        -moz-animation: `+ name + ` 2s infinite;
        -o-animation: `+ name + ` 2s infinite;
    }`
    return result;
}

// accepts a json from a form and uploads it to the server
// deprecated and replaced by image upload
function jsonFormToServer() {
    try {
        let formEl = document.forms.myform;
        var formData = new FormData(formEl);
        var name = formData.get('fullname');
        if (name === undefined) {
            console.log('Empty form');
        } else {
            post(JSON.parse(name));
        }
    } catch (e) {
        console.log('Error sending json' + e);
    }


}

function convertImage(reader) {
    //create image
    var img = new Image();
    img.src = reader.result;
    //get canvas from html
    var canvas = document.getElementById("myCanvas");
    var context = canvas.getContext('2d');
    //scale image to fit canvas
    var scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    var x = (canvas.width / 2) - (img.width / 2) * scale;
    var y = (canvas.height / 2) - (img.height / 2) * scale;
    //draw canvas to screen
    context.drawImage(img, x, y, img.width * scale, img.height * scale);
}

// displays preview of uploaded image
function preview_image(event) {
    var reader = new FileReader();
    reader.onload = function () {
        var myImgOutput = document.getElementById('myImg');
        //var previewCanvasOutput = document.getElementById('previewCanvas');
        myImgOutput.src = reader.result;
        //previewCanvasOutput.src = reader.result        
    }
    reader.readAsDataURL(event.target.files[0]);
    convertImage(reader);
}

// Proccess image on upload button press
// TODO change canvas to 16x16 and replace image preview with old method
function uploadImage() {
    var canvas = document.getElementById("myCanvas");
    var context = canvas.getContext('2d');
    const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    assert((data.length / 4) === 256, "Unexpected data size in uploadImage");
    var result = new Array(0); //should be 256
    for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        // const alpha = data[i + 3]; ignore alpha value
        result.push(rgbToHex(red, green, blue));
    }
    assert(result.length === 256, "Unexpected array size in uploadImage");
    console.log(result);
}

// converts an r, g or b value to its hex equivalent
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

// converts a set of r, g and b values to its hex equivalent
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// testing
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}