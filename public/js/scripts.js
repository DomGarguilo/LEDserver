console.log('in scripts');

displayImagePreview();

//inserts css into stylesheet
function addCss(cssCode) {
    var styleElement = document.createElement("style");
    if (styleElement.styleSheet) {
        styleElement.styleSheet.cssText = cssCode;
    } else {
        styleElement.appendChild(document.createTextNode(cssCode));
    }
    document.getElementsByTagName("head")[0].appendChild(styleElement);
}

//fetches the image data json from server
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
//wraps the color array with additional CSS for displaying the frame
function generateFrameSet(pixelSize, frameRange, data) {
    var result = '@keyframes x {' + generateFrame(pixelSize, frameRange, data) + '}';
    return result;
}

function displayImagePreview() {
    getJsonData().then((v) => {
        var arr = get2Darray(v.animationList[0].frames[0]);
        var cssArray = generateFrameSet(40, '0%, 100%', arr);
        addCss(cssArray);
    });

}

function get2Darray(arr) {
    var result = Array.from(Array(16), () => new Array(16));
    var i;
    for (i = 0; i < 16; i++) {
        var j;
        for (j = 0; j < 16; j++) {
            result[i][j] = arr[(j * 16) + i];
        }
    }
    return result;
}