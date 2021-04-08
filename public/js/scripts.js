console.log('in scripts');

displayImagePreview();

// inserts css into stylesheet
function addCss(cssCode) {
    var styleElement = document.createElement("style");
    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = cssCode;
    } else {
        styleElement.appendChild(document.createTextNode(cssCode));
    }
    document.getElementsByTagName("head")[0].appendChild(styleElement);
}

// fetches the image data json from server
async function getJsonData() {
    var response = await fetch(document.URL + 'data');
    //var response = await fetch('https://led-matrix-server.herokuapp.com/')
    jsonData = await response.json();
    return jsonData;
}
// generates the css color array for a single frame of animation
function generateFrame(pixelSize, frameRange, data) {
    var result = frameRange + ' {box-shadow:';
    for (var i = 1; i <= 16; i++) {
        for (var j = 1; j <= 16; j++) {

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
    console.log('HERE');
    var result = '@keyframes ' + data.name + ' {';
    var frameList = data.frames;
    var i;
    for (i = 0; i < frameList.length; i++) {
        result = result + generateFrame(pixelSize, rangeList[i], get2Darray(frameList[i]));
    }
    result = result + '}'
    return result;
}

function displayImagePreview() {
    getJsonData().then((v) => {
        var animationCount = v.animationList.length;
        for (i = 0; i < animationCount; i++) {
            var ranges = getRange(v.animationList[i].frames.length);
            var data = v.animationList[i];
            var cssArray = generateFrameSet(10, ranges, data);
            var cssDetails = generateCssDetails(data.name, 2);
            var html = generateHtmlTag(data.name);
            console.log(html);
            console.log(data.name);
            addHtml(html, 'imageQueue');
            addCss(cssArray);
            addCss(cssDetails);
        }
    });

}

// inserts html after specified div tag
function addHtml(html, insertTag) {
    console.log(insertTag);
    console.log(html);
    document.getElementById(insertTag).innerHTML += html;
}

// returns div tag for animation
function generateHtmlTag(name) {
    var result = `<div class="` + name + `"></div>`;
    return result;
}

// converts a 1D array to a 2D array
function get2Darray(arr) {
    var result = Array.from(Array(16), () => new Array(16));
    var i;
    for (i = 0; i < 16; i++) {
        var j;
        var tempArr = new Array(16);
        for (j = 0; j < 16; j++) {
            result[i][j] = arr[(j * 16) + i];
        }
    }
    return reverseEveryOther(result);
}

// takes a number and returns a range of percents
// e.g. getRange(3) = {"0%, 33.3%","33.4%, 66.6%", "66.7%, 100%"}
function getRange(num) {
    var result = new Array(num);
    let increment = Number(100 / num);
    for (var i = 0; i < result.length; i++) {
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
    var col;
    for (col = 0; col < matrix[0].length; col++) {
        if (col % 2 == 1) {
            var row;
            for (row = 0; row < matrix.length / 2; row++) {
                var temp = matrix[row][col];
                matrix[row][col] = matrix[matrix.length - row - 1][col];
                matrix[matrix.length - row - 1][col] = temp;
            }
        }
    }
    return matrix;
}

// returns the css animation details
function generateCssDetails(name, seconds) {
    var result = '.' + name + ` {
        display: block;
        margin-bottom: 200px;
        animation: `+ name + `2s infinite;
        -webkit-animation: `+ name + ` 2s infinite;
        -moz-animation: `+ name + ` 2s infinite;
        -o-animation: `+ name + ` 2s infinite;
    }`
    console.log(result);
    return result;
}