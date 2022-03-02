import React, { Component } from 'react'
import styled from 'styled-components';
import { arraysOrderAreEqual, get2Darray, reverseEveryOtherCol, IMAGE_PIXEL_LENGTH } from 'utils';

const pixelSize = 8;

class Frame extends Component {
    // determines when the Component should re-render
    shouldComponentUpdate(nextProps, nextState) {
        if (arraysOrderAreEqual(this.props.frames, nextProps.frames)) {
            return false;
        } else {
            return true;
        }
    }

    render() {
        console.log('rendering styled frame');
        return (
            <Wrapper>
                <StyledFrame frames={this.props.frames} pixelSize={pixelSize} />
            </Wrapper>
        )
    }
}

export default Frame

const StyledFrame = styled.div`
${(props) => generateCSSDetails(props.pixelSize)}
${(props) => generateCSSFrameSet(props.pixelSize, props.frames)}`;

const Wrapper = styled.section`
    width: 148px;
    height: 148px;
    background: papayawhip;
    overflow: hidden;
`;

// wraps the set of color arrays with additional CSS for displaying them as animation
function generateCSSFrameSet(pixelSize, frames) {
    let framesCopy = frames;
    framesCopy = get2Darray(framesCopy);
    framesCopy = reverseEveryOtherCol(framesCopy);
    return generateFrame(pixelSize, framesCopy);
}

// generates the css color array for a single frame of animation
function generateFrame(pixelSize, data) {
    let result = 'box-shadow:';
    for (let i = 1; i <= IMAGE_PIXEL_LENGTH; i++) {
        for (let j = 1; j <= IMAGE_PIXEL_LENGTH; j++) {
            result += (pixelSize * i).toString() + 'px ' + (pixelSize * j).toString() + 'px 0 0 ' + data[i - 1][j - 1];
            if (j === IMAGE_PIXEL_LENGTH && i === IMAGE_PIXEL_LENGTH) {
                result += ';';
            } else {
                result += ',';
            }
        }
    }
    result += '\nheight:' + pixelSize.toString() + 'px;\nwidth:' + pixelSize.toString() + 'px;';
    result = result.replaceAll('0x', '#');
    return result;
}

// returns the css animation rules
// tells it how big and how fast to display frames and such
function generateCSSDetails(pixelSize) {
    return `
        position: absolute;
        display: block;
        margin-bottom: `+ (pixelSize * 16) + `px;`
}

/* SAMPLE STYLED DIV FOR FRAME
const StyledFrame1 = styled.div`
position: absolute;
display: block;
margin-bottom: 128px;

box-shadow: 10px 10px 0 0 #22b574, 10px 20px 0 0 #22b574, 10px 30px 0 0 #22b574, 10px 40px 0 0 #22b574, 10px 50px 0 0 #22b574, 10px 60px 0 0 #22b574, 10px 70px 0 0 #22b574, 10px 80px 0 0 #22b574, 10px 90px 0 0 #22b574, 10px 100px 0 0 #22b574, 10px 110px 0 0 #22b574, 10px 120px 0 0 #22b574, 10px 130px 0 0 #22b574, 10px 140px 0 0 #22b574, 10px 150px 0 0 #22b574, 10px 160px 0 0 #22b574, 20px 10px 0 0 #22b574, 20px 20px 0 0 #22b574, 20px 30px 0 0 #22b574, 20px 40px 0 0 #22b574, 20px 50px 0 0 #22b574, 20px 60px 0 0 #22b574, 20px 70px 0 0 #22b574, 20px 80px 0 0 #22b574, 20px 90px 0 0 #22b574, 20px 100px 0 0 #22b574, 20px 110px 0 0 #22b574, 20px 120px 0 0 #22b574, 20px 130px 0 0 #22b574, 20px 140px 0 0 #22b574, 20px 150px 0 0 #22b574, 20px 160px 0 0 #22b574, 30px 10px 0 0 #22b574, 30px 20px 0 0 #22b574, 30px 30px 0 0 #22b574, 30px 40px 0 0 #22b574, 30px 50px 0 0 #22b574, 30px 60px 0 0 #c18d1f, 30px 70px 0 0 #22b574, 30px 80px 0 0 #c18d1f, 30px 90px 0 0 #22b574, 30px 100px 0 0 #22b574, 30px 110px 0 0 #22b574, 30px 120px 0 0 #22b574, 30px 130px 0 0 #22b574, 30px 140px 0 0 #22b574, 30px 150px 0 0 #22b574, 30px 160px 0 0 #22b574, 40px 10px 0 0 #22b574, 40px 20px 0 0 #22b574, 40px 30px 0 0 #22b574, 40px 40px 0 0 #22b574, 40px 50px 0 0 #22b574, 40px 60px 0 0 #22b574, 40px 70px 0 0 #d69d24, 40px 80px 0 0 #22b574, 40px 90px 0 0 #22b574, 40px 100px 0 0 #22b574, 40px 110px 0 0 #22b574, 40px 120px 0 0 #22b574, 40px 130px 0 0 #22b574, 40px 140px 0 0 #22b574, 40px 150px 0 0 #22b574, 40px 160px 0 0 #22b574, 50px 10px 0 0 #22b574, 50px 20px 0 0 #22b574, 50px 30px 0 0 #22b574, 50px 40px 0 0 #c18d1f, 50px 50px 0 0 #22b574, 50px 60px 0 0 #e57933, 50px 70px 0 0 #e59633, 50px 80px 0 0 #ffb036, 50px 90px 0 0 #22b574, 50px 100px 0 0 #22b574, 50px 110px 0 0 #22b574, 50px 120px 0 0 #22b574, 50px 130px 0 0 #22b574, 50px 140px 0 0 #22b574, 50px 150px 0 0 #22b574, 50px 160px 0 0 #22b574, 60px 10px 0 0 #22b574, 60px 20px 0 0 #22b574, 60px 30px 0 0 #22b574, 60px 40px 0 0 #22b574, 60px 50px 0 0 #c18d1f, 60px 60px 0 0 #e57933, 60px 70px 0 0 #e59633, 60px 80px 0 0 #ffbf36, 60px 90px 0 0 #c18d1f, 60px 100px 0 0 #22b574, 60px 110px 0 0 #22b574, 60px 120px 0 0 #22b574, 60px 130px 0 0 #22b574, 60px 140px 0 0 #22b574, 60px 150px 0 0 #22b574, 60px 160px 0 0 #22b574, 70px 10px 0 0 #22b574, 70px 20px 0 0 #22b574, 70px 30px 0 0 #22b574, 70px 40px 0 0 #22b574, 70px 50px 0 0 #22b574, 70px 60px 0 0 #e59633, 70px 70px 0 0 #17111a, 70px 80px 0 0 #fec639, 70px 90px 0 0 #22b574, 70px 100px 0 0 #22b574, 70px 110px 0 0 #22b574, 70px 120px 0 0 #22b574, 70px 130px 0 0 #22b574, 70px 140px 0 0 #22b574, 70px 150px 0 0 #22b574, 70px 160px 0 0 #22b574, 80px 10px 0 0 #22b574, 80px 20px 0 0 #22b574, 80px 30px 0 0 #22b574, 80px 40px 0 0 #22b574, 80px 50px 0 0 #22b574, 80px 60px 0 0 #22b574, 80px 70px 0 0 #22b574, 80px 80px 0 0 #22b574, 80px 90px 0 0 #22b574, 80px 100px 0 0 #22b574, 80px 110px 0 0 #22b574, 80px 120px 0 0 #22b574, 80px 130px 0 0 #22b574, 80px 140px 0 0 #22b574, 80px 150px 0 0 #22b574, 80px 160px 0 0 #22b574, 90px 10px 0 0 #22b574, 90px 20px 0 0 #22b574, 90px 30px 0 0 #22b574, 90px 40px 0 0 #22b574, 90px 50px 0 0 #22b574, 90px 60px 0 0 #22b574, 90px 70px 0 0 #22b574, 90px 80px 0 0 #22b574, 90px 90px 0 0 #22b574, 90px 100px 0 0 #22b574, 90px 110px 0 0 #22b574, 90px 120px 0 0 #22b574, 90px 130px 0 0 #22b574, 90px 140px 0 0 #22b574, 90px 150px 0 0 #22b574, 90px 160px 0 0 #22b574, 100px 10px 0 0 #22b574, 100px 20px 0 0 #22b574, 100px 30px 0 0 #22b574, 100px 40px 0 0 #22b574, 100px 50px 0 0 #22b574, 100px 60px 0 0 #22b574, 100px 70px 0 0 #22b574, 100px 80px 0 0 #22b574, 100px 90px 0 0 #22b574, 100px 100px 0 0 #22b574, 100px 110px 0 0 #22b574, 100px 120px 0 0 #bf3fb3, 100px 130px 0 0 #682b82, 100px 140px 0 0 #22b574, 100px 150px 0 0 #682b82, 100px 160px 0 0 #22b574, 110px 10px 0 0 #22b574, 110px 20px 0 0 #22b574, 110px 30px 0 0 #22b574, 110px 40px 0 0 #22b574, 110px 50px 0 0 #22b574, 110px 60px 0 0 #22b574, 110px 70px 0 0 #22b574, 110px 80px 0 0 #22b574, 110px 90px 0 0 #22b574, 110px 100px 0 0 #22b574, 110px 110px 0 0 #22b574, 110px 120px 0 0 #22b574, 110px 130px 0 0 #22b574, 110px 140px 0 0 #682b82, 110px 150px 0 0 #22b574, 110px 160px 0 0 #682b82, 120px 10px 0 0 #22b574, 120px 20px 0 0 #22b574, 120px 30px 0 0 #22b574, 120px 40px 0 0 #22b574, 120px 50px 0 0 #22b574, 120px 60px 0 0 #22b574, 120px 70px 0 0 #22b574, 120px 80px 0 0 #22b574, 120px 90px 0 0 #22b574, 120px 100px 0 0 #22b574, 120px 110px 0 0 #bf3fb3, 120px 120px 0 0 #682b82, 120px 130px 0 0 #22b574, 120px 140px 0 0 #bf3fb3, 120px 150px 0 0 #682b82, 120px 160px 0 0 #682b82, 130px 10px 0 0 #22b574, 130px 20px 0 0 #22b574, 130px 30px 0 0 #22b574, 130px 40px 0 0 #22b574, 130px 50px 0 0 #22b574, 130px 60px 0 0 #22b574, 130px 70px 0 0 #22b574, 130px 80px 0 0 #22b574, 130px 90px 0 0 #22b574, 130px 100px 0 0 #bf3fb3, 130px 110px 0 0 #22b574, 130px 120px 0 0 #22b574, 130px 130px 0 0 #bf3fb3, 130px 140px 0 0 #22b574, 130px 150px 0 0 #682b82, 130px 160px 0 0 #682b82, 140px 10px 0 0 #22b574, 140px 20px 0 0 #22b574, 140px 30px 0 0 #22b574, 140px 40px 0 0 #22b574, 140px 50px 0 0 #22b574, 140px 60px 0 0 #22b574, 140px 70px 0 0 #22b574, 140px 80px 0 0 #22b574, 140px 90px 0 0 #22b574, 140px 100px 0 0 #22b574, 140px 110px 0 0 #22b574, 140px 120px 0 0 #22b574, 140px 130px 0 0 #22b574, 140px 140px 0 0 #682b82, 140px 150px 0 0 #22b574, 140px 160px 0 0 #682b82, 150px 10px 0 0 #22b574, 150px 20px 0 0 #22b574, 150px 30px 0 0 #22b574, 150px 40px 0 0 #22b574, 150px 50px 0 0 #22b574, 150px 60px 0 0 #22b574, 150px 70px 0 0 #22b574, 150px 80px 0 0 #22b574, 150px 90px 0 0 #22b574, 150px 100px 0 0 #22b574, 150px 110px 0 0 #22b574, 150px 120px 0 0 #bf3fb3, 150px 130px 0 0 #682b82, 150px 140px 0 0 #22b574, 150px 150px 0 0 #bf3fb3, 150px 160px 0 0 #22b574, 160px 10px 0 0 #22b574, 160px 20px 0 0 #22b574, 160px 30px 0 0 #22b574, 160px 40px 0 0 #22b574, 160px 50px 0 0 #22b574, 160px 60px 0 0 #22b574, 160px 70px 0 0 #22b574, 160px 80px 0 0 #22b574, 160px 90px 0 0 #22b574, 160px 100px 0 0 #22b574, 160px 110px 0 0 #22b574, 160px 120px 0 0 #22b574, 160px 130px 0 0 #22b574, 160px 140px 0 0 #22b574, 160px 150px 0 0 #22b574, 160px 160px 0 0 #22b574;
height: 10px;
width: 10px;
`;
*/