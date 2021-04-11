displayImagePreview();

// inserts css into stylesheet
function addCss(cssCode) {
    let styleElement = document.createElement("style");
    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = cssCode;
    } else {
        styleElement.appendChild(document.createTextNode(cssCode));
    }
    document.getElementsByTagName("head")[0].appendChild(styleElement);
}

// fetches the image data json from server
async function getJsonData() {
    let response = await fetch(document.URL + 'data');
    //var response = await fetch('https://led-matrix-server.herokuapp.com/')
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

function displayImagePreview() {
    getJsonData().then((v) => {
        const animationCount = v.animationList.length;
        for (let i = 0; i < animationCount; i++) {
            let ranges = getRange(v.animationList[i].frames.length);
            let data = v.animationList[i];
            let cssArray = generateFrameSet(10, ranges, data);
            let cssDetails = generateCssDetails(data.name, 2);
            let html = generateHtmlTag(data.name);
            addHtml(html, 'imageQueue');
            addCss(cssArray);
            addCss(cssDetails);
        }
    });

}

// makes a POST req to the server. Accepts json object
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

// returns div tag for animation
function generateHtmlTag(name) {
    let result = `<div class="` + name + `"></div>`;
    return result;
}

// converts a 1D array to a 2D array
function get2Darray(arr) {
    let result = Array.from(Array(16), () => new Array(16));
    for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 16; j++) {
            result[i][j] = arr[(j * 16) + i];
        }
    }
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

// reverses every other row since in the raw array, every other is reversed since thats how the physical matrix needs it
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

// returns the css animation details
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

// function to pull the form data and send it to the server
function submitJson() {
    console.log("here:");
    let formEl = document.forms.submitForm;
    var formData = new FormData(formEl);
    var name = formData.get('name');
    console.log(name);
}

function run_this_function() {
    // your code goes here
    console.log("mmm");
    return 'running';
}

function myFunction() {
    let formEl = document.forms.myform;
    var formData = new FormData(formEl);
    var name = formData.get('fullname');
    post(JSON.parse(name));
    console.log('HERE');
}