import React from 'react';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

const IMAGE_PIXEL_LENGTH = 16;
const pixelSize = 8;

export default function Frame(props) {
    const frames1 = props.frames;
    const uniqueID = uuid();
    console.log('creating Sytled Frame component: ' + uniqueID)

    return (
        <Wrapper>
            <StyledFrame frames={frames1} name={uniqueID} />
        </Wrapper>
    );
}

const StyledFrame = styled.div`
${(props) => generateCSSDetails(props.name)}

${(props) => generateCSSFrameSet(pixelSize, props.frames, props.name)}
`;

const Wrapper = styled.section`
    width: 148px;
    heigth: 10px;
    background: papayawhip;
    overflow: hidden;
`;

// wraps the set of color arrays with additional CSS for displaying them as animation
function generateCSSFrameSet(pixelSize, frames, name) {
    const rangeList = getCSSAnimationTimings(1);
    const frameList = []
    frameList.push(frames);
    let result = '@keyframes ' + name + ' {';
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
        if (i === 0) {
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

// generates the css color array for a single frame of animation
function generateFrame(pixelSize, frameRange, data) {
    let result = frameRange + ' {box-shadow:';
    for (let i = 1; i <= IMAGE_PIXEL_LENGTH; i++) {
        for (let j = 1; j <= IMAGE_PIXEL_LENGTH; j++) {
            result += (pixelSize * i).toString() + 'px ' + (pixelSize * j).toString() + 'px 0 0 #' + data[i - 1][j - 1];
            if (j === IMAGE_PIXEL_LENGTH && i === IMAGE_PIXEL_LENGTH) {
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

// returns the css animation rules
// tells it how big and how fast to display frames and such
function generateCSSDetails(name) {
    return `
        display: block;
        margin-bottom: 170px;
        animation: ` + name + ` 2s infinite;
        -webkit-animation: ` + name + ` 2s infinite;
        -moz-animation: ` + name + ` 2s infinite;
        -o-animation: ` + name + ` 2s infinite;`
}

// converts a 1D array to a 2D array
// hardcoded 256 length 1D array -> 16x16 2D array
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
// thats how the physical LED matrix needs it
function reverseEveryOtherCol(matrix) {
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

/* SAMPLE STYLED DIV FOR FRAME
const StyledFrame1 = styled.div`
position: absolute;
animation: x 2s infinite;
-webkit-animation: x 2s infinite;
-moz-animation: x 2s infinite;
-o-animation: x 2s infinite;

@keyframes x {
  0%, 50% {
    box-shadow: 10px 10px 0 0 #22b574, 10px 20px 0 0 #22b574, 10px 30px 0 0 #22b574, 10px 40px 0 0 #22b574, 10px 50px 0 0 #22b574, 10px 60px 0 0 #22b574, 10px 70px 0 0 #22b574, 10px 80px 0 0 #22b574, 10px 90px 0 0 #22b574, 10px 100px 0 0 #22b574, 10px 110px 0 0 #22b574, 10px 120px 0 0 #22b574, 10px 130px 0 0 #22b574, 10px 140px 0 0 #22b574, 10px 150px 0 0 #22b574, 10px 160px 0 0 #22b574, 20px 10px 0 0 #22b574, 20px 20px 0 0 #22b574, 20px 30px 0 0 #22b574, 20px 40px 0 0 #22b574, 20px 50px 0 0 #22b574, 20px 60px 0 0 #22b574, 20px 70px 0 0 #22b574, 20px 80px 0 0 #22b574, 20px 90px 0 0 #22b574, 20px 100px 0 0 #22b574, 20px 110px 0 0 #22b574, 20px 120px 0 0 #22b574, 20px 130px 0 0 #22b574, 20px 140px 0 0 #22b574, 20px 150px 0 0 #22b574, 20px 160px 0 0 #22b574, 30px 10px 0 0 #22b574, 30px 20px 0 0 #22b574, 30px 30px 0 0 #22b574, 30px 40px 0 0 #22b574, 30px 50px 0 0 #22b574, 30px 60px 0 0 #c18d1f, 30px 70px 0 0 #22b574, 30px 80px 0 0 #c18d1f, 30px 90px 0 0 #22b574, 30px 100px 0 0 #22b574, 30px 110px 0 0 #22b574, 30px 120px 0 0 #22b574, 30px 130px 0 0 #22b574, 30px 140px 0 0 #22b574, 30px 150px 0 0 #22b574, 30px 160px 0 0 #22b574, 40px 10px 0 0 #22b574, 40px 20px 0 0 #22b574, 40px 30px 0 0 #22b574, 40px 40px 0 0 #22b574, 40px 50px 0 0 #22b574, 40px 60px 0 0 #22b574, 40px 70px 0 0 #d69d24, 40px 80px 0 0 #22b574, 40px 90px 0 0 #22b574, 40px 100px 0 0 #22b574, 40px 110px 0 0 #22b574, 40px 120px 0 0 #22b574, 40px 130px 0 0 #22b574, 40px 140px 0 0 #22b574, 40px 150px 0 0 #22b574, 40px 160px 0 0 #22b574, 50px 10px 0 0 #22b574, 50px 20px 0 0 #22b574, 50px 30px 0 0 #22b574, 50px 40px 0 0 #c18d1f, 50px 50px 0 0 #22b574, 50px 60px 0 0 #e57933, 50px 70px 0 0 #e59633, 50px 80px 0 0 #ffb036, 50px 90px 0 0 #22b574, 50px 100px 0 0 #22b574, 50px 110px 0 0 #22b574, 50px 120px 0 0 #22b574, 50px 130px 0 0 #22b574, 50px 140px 0 0 #22b574, 50px 150px 0 0 #22b574, 50px 160px 0 0 #22b574, 60px 10px 0 0 #22b574, 60px 20px 0 0 #22b574, 60px 30px 0 0 #22b574, 60px 40px 0 0 #22b574, 60px 50px 0 0 #c18d1f, 60px 60px 0 0 #e57933, 60px 70px 0 0 #e59633, 60px 80px 0 0 #ffbf36, 60px 90px 0 0 #c18d1f, 60px 100px 0 0 #22b574, 60px 110px 0 0 #22b574, 60px 120px 0 0 #22b574, 60px 130px 0 0 #22b574, 60px 140px 0 0 #22b574, 60px 150px 0 0 #22b574, 60px 160px 0 0 #22b574, 70px 10px 0 0 #22b574, 70px 20px 0 0 #22b574, 70px 30px 0 0 #22b574, 70px 40px 0 0 #22b574, 70px 50px 0 0 #22b574, 70px 60px 0 0 #e59633, 70px 70px 0 0 #17111a, 70px 80px 0 0 #fec639, 70px 90px 0 0 #22b574, 70px 100px 0 0 #22b574, 70px 110px 0 0 #22b574, 70px 120px 0 0 #22b574, 70px 130px 0 0 #22b574, 70px 140px 0 0 #22b574, 70px 150px 0 0 #22b574, 70px 160px 0 0 #22b574, 80px 10px 0 0 #22b574, 80px 20px 0 0 #22b574, 80px 30px 0 0 #22b574, 80px 40px 0 0 #22b574, 80px 50px 0 0 #22b574, 80px 60px 0 0 #22b574, 80px 70px 0 0 #22b574, 80px 80px 0 0 #22b574, 80px 90px 0 0 #22b574, 80px 100px 0 0 #22b574, 80px 110px 0 0 #22b574, 80px 120px 0 0 #22b574, 80px 130px 0 0 #22b574, 80px 140px 0 0 #22b574, 80px 150px 0 0 #22b574, 80px 160px 0 0 #22b574, 90px 10px 0 0 #22b574, 90px 20px 0 0 #22b574, 90px 30px 0 0 #22b574, 90px 40px 0 0 #22b574, 90px 50px 0 0 #22b574, 90px 60px 0 0 #22b574, 90px 70px 0 0 #22b574, 90px 80px 0 0 #22b574, 90px 90px 0 0 #22b574, 90px 100px 0 0 #22b574, 90px 110px 0 0 #22b574, 90px 120px 0 0 #22b574, 90px 130px 0 0 #22b574, 90px 140px 0 0 #22b574, 90px 150px 0 0 #22b574, 90px 160px 0 0 #22b574, 100px 10px 0 0 #22b574, 100px 20px 0 0 #22b574, 100px 30px 0 0 #22b574, 100px 40px 0 0 #22b574, 100px 50px 0 0 #22b574, 100px 60px 0 0 #22b574, 100px 70px 0 0 #22b574, 100px 80px 0 0 #22b574, 100px 90px 0 0 #22b574, 100px 100px 0 0 #22b574, 100px 110px 0 0 #22b574, 100px 120px 0 0 #bf3fb3, 100px 130px 0 0 #682b82, 100px 140px 0 0 #22b574, 100px 150px 0 0 #682b82, 100px 160px 0 0 #22b574, 110px 10px 0 0 #22b574, 110px 20px 0 0 #22b574, 110px 30px 0 0 #22b574, 110px 40px 0 0 #22b574, 110px 50px 0 0 #22b574, 110px 60px 0 0 #22b574, 110px 70px 0 0 #22b574, 110px 80px 0 0 #22b574, 110px 90px 0 0 #22b574, 110px 100px 0 0 #22b574, 110px 110px 0 0 #22b574, 110px 120px 0 0 #22b574, 110px 130px 0 0 #22b574, 110px 140px 0 0 #682b82, 110px 150px 0 0 #22b574, 110px 160px 0 0 #682b82, 120px 10px 0 0 #22b574, 120px 20px 0 0 #22b574, 120px 30px 0 0 #22b574, 120px 40px 0 0 #22b574, 120px 50px 0 0 #22b574, 120px 60px 0 0 #22b574, 120px 70px 0 0 #22b574, 120px 80px 0 0 #22b574, 120px 90px 0 0 #22b574, 120px 100px 0 0 #22b574, 120px 110px 0 0 #bf3fb3, 120px 120px 0 0 #682b82, 120px 130px 0 0 #22b574, 120px 140px 0 0 #bf3fb3, 120px 150px 0 0 #682b82, 120px 160px 0 0 #682b82, 130px 10px 0 0 #22b574, 130px 20px 0 0 #22b574, 130px 30px 0 0 #22b574, 130px 40px 0 0 #22b574, 130px 50px 0 0 #22b574, 130px 60px 0 0 #22b574, 130px 70px 0 0 #22b574, 130px 80px 0 0 #22b574, 130px 90px 0 0 #22b574, 130px 100px 0 0 #bf3fb3, 130px 110px 0 0 #22b574, 130px 120px 0 0 #22b574, 130px 130px 0 0 #bf3fb3, 130px 140px 0 0 #22b574, 130px 150px 0 0 #682b82, 130px 160px 0 0 #682b82, 140px 10px 0 0 #22b574, 140px 20px 0 0 #22b574, 140px 30px 0 0 #22b574, 140px 40px 0 0 #22b574, 140px 50px 0 0 #22b574, 140px 60px 0 0 #22b574, 140px 70px 0 0 #22b574, 140px 80px 0 0 #22b574, 140px 90px 0 0 #22b574, 140px 100px 0 0 #22b574, 140px 110px 0 0 #22b574, 140px 120px 0 0 #22b574, 140px 130px 0 0 #22b574, 140px 140px 0 0 #682b82, 140px 150px 0 0 #22b574, 140px 160px 0 0 #682b82, 150px 10px 0 0 #22b574, 150px 20px 0 0 #22b574, 150px 30px 0 0 #22b574, 150px 40px 0 0 #22b574, 150px 50px 0 0 #22b574, 150px 60px 0 0 #22b574, 150px 70px 0 0 #22b574, 150px 80px 0 0 #22b574, 150px 90px 0 0 #22b574, 150px 100px 0 0 #22b574, 150px 110px 0 0 #22b574, 150px 120px 0 0 #bf3fb3, 150px 130px 0 0 #682b82, 150px 140px 0 0 #22b574, 150px 150px 0 0 #bf3fb3, 150px 160px 0 0 #22b574, 160px 10px 0 0 #22b574, 160px 20px 0 0 #22b574, 160px 30px 0 0 #22b574, 160px 40px 0 0 #22b574, 160px 50px 0 0 #22b574, 160px 60px 0 0 #22b574, 160px 70px 0 0 #22b574, 160px 80px 0 0 #22b574, 160px 90px 0 0 #22b574, 160px 100px 0 0 #22b574, 160px 110px 0 0 #22b574, 160px 120px 0 0 #22b574, 160px 130px 0 0 #22b574, 160px 140px 0 0 #22b574, 160px 150px 0 0 #22b574, 160px 160px 0 0 #22b574;
    height: 10px;
    width: 10px;
  }
  50.1%, 100% {
    box-shadow: 10px 10px 0 0 #22b574, 10px 20px 0 0 #22b574, 10px 30px 0 0 #22b574, 10px 40px 0 0 #22b574, 10px 50px 0 0 #22b574, 10px 60px 0 0 #22b574, 10px 70px 0 0 #22b574, 10px 80px 0 0 #22b574, 10px 90px 0 0 #22b574, 10px 100px 0 0 #22b574, 10px 110px 0 0 #22b574, 10px 120px 0 0 #22b574, 10px 130px 0 0 #22b574, 10px 140px 0 0 #22b574, 10px 150px 0 0 #22b574, 10px 160px 0 0 #22b574, 20px 10px 0 0 #22b574, 20px 20px 0 0 #22b574, 20px 30px 0 0 #22b574, 20px 40px 0 0 #22b574, 20px 50px 0 0 #22b574, 20px 60px 0 0 #22b574, 20px 70px 0 0 #22b574, 20px 80px 0 0 #22b574, 20px 90px 0 0 #22b574, 20px 100px 0 0 #22b574, 20px 110px 0 0 #22b574, 20px 120px 0 0 #22b574, 20px 130px 0 0 #22b574, 20px 140px 0 0 #22b574, 20px 150px 0 0 #22b574, 20px 160px 0 0 #22b574, 30px 10px 0 0 #22b574, 30px 20px 0 0 #22b574, 30px 30px 0 0 #22b574, 30px 40px 0 0 #22b574, 30px 50px 0 0 #22b574, 30px 60px 0 0 #22b574, 30px 70px 0 0 #22b574, 30px 80px 0 0 #22b574, 30px 90px 0 0 #22b574, 30px 100px 0 0 #22b574, 30px 110px 0 0 #22b574, 30px 120px 0 0 #22b574, 30px 130px 0 0 #22b574, 30px 140px 0 0 #22b574, 30px 150px 0 0 #22b574, 30px 160px 0 0 #22b574, 40px 10px 0 0 #22b574, 40px 20px 0 0 #22b574, 40px 30px 0 0 #22b574, 40px 40px 0 0 #22b574, 40px 50px 0 0 #22b574, 40px 60px 0 0 #22b574, 40px 70px 0 0 #22b574, 40px 80px 0 0 #22b574, 40px 90px 0 0 #22b574, 40px 100px 0 0 #22b574, 40px 110px 0 0 #22b574, 40px 120px 0 0 #22b574, 40px 130px 0 0 #22b574, 40px 140px 0 0 #22b574, 40px 150px 0 0 #22b574, 40px 160px 0 0 #22b574, 50px 10px 0 0 #22b574, 50px 20px 0 0 #22b574, 50px 30px 0 0 #22b574, 50px 40px 0 0 #22b574, 50px 50px 0 0 #22b574, 50px 60px 0 0 #22b574, 50px 70px 0 0 #22b574, 50px 80px 0 0 #22b574, 50px 90px 0 0 #22b574, 50px 100px 0 0 #22b574, 50px 110px 0 0 #22b574, 50px 120px 0 0 #22b574, 50px 130px 0 0 #22b574, 50px 140px 0 0 #22b574, 50px 150px 0 0 #22b574, 50px 160px 0 0 #22b574, 60px 10px 0 0 #22b574, 60px 20px 0 0 #22b574, 60px 30px 0 0 #22b574, 60px 40px 0 0 #22b574, 60px 50px 0 0 #25b473, 60px 60px 0 0 #31b16c, 60px 70px 0 0 #25b473, 60px 80px 0 0 #31b16c, 60px 90px 0 0 #25b473, 60px 100px 0 0 #22b574, 60px 110px 0 0 #22b574, 60px 120px 0 0 #22b574, 60px 130px 0 0 #22b574, 60px 140px 0 0 #22b574, 60px 150px 0 0 #22b574, 60px 160px 0 0 #22b574, 70px 10px 0 0 #22b574, 70px 20px 0 0 #22b574, 70px 30px 0 0 #22b574, 70px 40px 0 0 #22b574, 70px 50px 0 0 #31b16c, 70px 60px 0 0 #7e9e43, 70px 70px 0 0 #51ab5c, 70px 80px 0 0 #7e9e43, 70px 90px 0 0 #31b16c, 70px 100px 0 0 #22b574, 70px 110px 0 0 #22b574, 70px 120px 0 0 #22b574, 70px 130px 0 0 #22b574, 70px 140px 0 0 #22b574, 70px 150px 0 0 #21b674, 70px 160px 0 0 #22b574, 80px 10px 0 0 #22b574, 80px 20px 0 0 #22b574, 80px 30px 0 0 #25b473, 80px 40px 0 0 #31b16c, 80px 50px 0 0 #28b371, 80px 60px 0 0 #57a95d, 80px 70px 0 0 #a7a23b, 80px 80px 0 0 #5aae5d, 80px 90px 0 0 #25b473, 80px 100px 0 0 #22b574, 80px 110px 0 0 #21b674, 80px 120px 0 0 #21b674, 80px 130px 0 0 #21b674, 80px 140px 0 0 #22b574, 80px 150px 0 0 #21b674, 80px 160px 0 0 #21b674, 90px 10px 0 0 #22b574, 90px 20px 0 0 #22b574, 90px 30px 0 0 #31b16c, 90px 40px 0 0 #7e9e43, 90px 50px 0 0 #55a75d, 90px 60px 0 0 #bd8940, 90px 70px 0 0 #e59833, 90px 80px 0 0 #cfaf42, 90px 90px 0 0 #49b165, 90px 100px 0 0 #22b574, 90px 110px 0 0 #25b375, 90px 120px 0 0 #32a77a, 90px 130px 0 0 #2ca477, 90px 140px 0 0 #24b174, 90px 150px 0 0 #2ca477, 90px 160px 0 0 #21b674, 100px 10px 0 0 #22b574, 100px 20px 0 0 #22b574, 100px 30px 0 0 #22b574, 100px 40px 0 0 #3fae64, 100px 50px 0 0 #98963a, 100px 60px 0 0 #dc7f31, 100px 70px 0 0 #d78b30, 100px 80px 0 0 #f0b234, 100px 90px 0 0 #999f3c, 100px 100px 0 0 #2fb26c, 100px 110px 0 0 #2fab7a, 100px 120px 0 0 #83659a, 100px 130px 0 0 #5a5a82, 100px 140px 0 0 #348e77, 100px 150px 0 0 #4b637c, 100px 160px 0 0 #319877, 110px 10px 0 0 #22b574, 110px 20px 0 0 #22b574, 110px 30px 0 0 #22b574, 110px 40px 0 0 #22b574, 110px 50px 0 0 #47ae65, 110px 60px 0 0 #a78c3e, 110px 70px 0 0 #5c522c, 110px 80px 0 0 #b8af42, 110px 90px 0 0 #4ab465, 110px 100px 0 0 #25b375, 110px 110px 0 0 #35a67b, 110px 120px 0 0 #3b997d, 110px 130px 0 0 #359579, 110px 140px 0 0 #5c5583, 110px 150px 0 0 #407d7b, 110px 160px 0 0 #59487f, 120px 10px 0 0 #22b574, 120px 20px 0 0 #22b574, 120px 30px 0 0 #22b574, 120px 40px 0 0 #22b574, 120px 50px 0 0 #24b574, 120px 60px 0 0 #31b16c, 120px 70px 0 0 #26a56a, 120px 80px 0 0 #35b46d, 120px 90px 0 0 #24b574, 120px 100px 0 0 #409f80, 120px 110px 0 0 #86629b, 120px 120px 0 0 #5a5a82, 120px 130px 0 0 #469181, 120px 140px 0 0 #8c559c, 120px 150px 0 0 #693a85, 120px 160px 0 0 #682c82, 130px 10px 0 0 #22b574, 130px 20px 0 0 #22b574, 130px 30px 0 0 #22b574, 130px 40px 0 0 #22b574, 130px 50px 0 0 #22b574, 130px 60px 0 0 #22b574, 130px 70px 0 0 #22b574, 130px 80px 0 0 #20b674, 130px 90px 0 0 #33a97b, 130px 100px 0 0 #7f6f99, 130px 110px 0 0 #409f80, 130px 120px 0 0 #3b997d, 130px 130px 0 0 #806d99, 130px 140px 0 0 #4e8383, 130px 150px 0 0 #59487f, 130px 160px 0 0 #682c82, 140px 10px 0 0 #22b574, 140px 20px 0 0 #22b574, 140px 30px 0 0 #22b574, 140px 40px 0 0 #22b574, 140px 50px 0 0 #22b574, 140px 60px 0 0 #22b574, 140px 70px 0 0 #22b574, 140px 80px 0 0 #22b574, 140px 90px 0 0 #24b574, 140px 100px 0 0 #33a97b, 140px 110px 0 0 #25b375, 140px 120px 0 0 #32a77a, 140px 130px 0 0 #418d7e, 140px 140px 0 0 #505f7e, 140px 150px 0 0 #46817e, 140px 160px 0 0 #5b4980, 150px 10px 0 0 #22b574, 150px 20px 0 0 #22b574, 150px 30px 0 0 #22b574, 150px 40px 0 0 #22b574, 150px 50px 0 0 #22b574, 150px 60px 0 0 #22b574, 150px 70px 0 0 #22b574, 150px 80px 0 0 #22b574, 150px 90px 0 0 #22b574, 150px 100px 0 0 #20b674, 150px 110px 0 0 #33a97b, 150px 120px 0 0 #83659a, 150px 130px 0 0 #5a5a82, 150px 140px 0 0 #3d907c, 150px 150px 0 0 #7c6f98, 150px 160px 0 0 #3b997d, 160px 10px 0 0 #22b574, 160px 20px 0 0 #22b574, 160px 30px 0 0 #22b574, 160px 40px 0 0 #22b574, 160px 50px 0 0 #22b574, 160px 60px 0 0 #22b574, 160px 70px 0 0 #22b574, 160px 80px 0 0 #22b574, 160px 90px 0 0 #22b574, 160px 100px 0 0 #22b574, 160px 110px 0 0 #22b574, 160px 120px 0 0 #35a57b, 160px 130px 0 0 #2ca477, 160px 140px 0 0 #25b375, 160px 150px 0 0 #32a77a, 160px 160px 0 0 #25b375;
    height: 10px;
    width: 10px;
  }
}`;
*/