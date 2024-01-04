import React, { Component } from 'react'
import styled from 'styled-components';
import { arraysOrderAreEqual, get2Darray, IMAGE_PIXEL_LENGTH } from 'utils';

const pixelSize = 8;

class Frame extends Component {
    // determines when the Component should re-render
    shouldComponentUpdate(nextProps, nextState) {
        return !arraysOrderAreEqual(this.props.frame, nextProps.frame);
    }

    render() {
        console.log('rendering styled frame');
        return (
            <Wrapper>
                <StyledFrame frame={this.props.frame} pixelSize={pixelSize} />
            </Wrapper>
        )
    }
}

export default Frame

const StyledFrame = styled.div`
${(props) => generateCSSDetails(props.pixelSize)}
${(props) => generateCSSFrame(props.pixelSize, props.frame)}`;

const Wrapper = styled.section`
    width: 148px;
    height: 148px;
    background: papayawhip;
    overflow: hidden;
`;

// wraps the set of color arrays with additional CSS for displaying them as animation
function generateCSSFrame(pixelSize, frame) {
    let frameCopy = frame;
    frameCopy = get2Darray(frameCopy);
    return generateFrame(pixelSize, frameCopy);
}

// generates the css color array for a single frame of animation
function generateFrame(pixelSize, data) {
    let result = 'box-shadow:';
    for (let i = 0; i < IMAGE_PIXEL_LENGTH; i++) {
        for (let j = 0; j < IMAGE_PIXEL_LENGTH; j++) {
            const [r, g, b] = data[i][j];
            const color = `rgb(${r}, ${g}, ${b})`;
            result += `${pixelSize * (j + 1)}px ${pixelSize * (i + 1)}px 0 0 ${color}`;
            if (j === IMAGE_PIXEL_LENGTH - 1 && i === IMAGE_PIXEL_LENGTH - 1) {
                result += ';';
            } else {
                result += ',';
            }
        }
    }
    result += `\nheight:${pixelSize}px;\nwidth:${pixelSize}px;`;
    return result;
}


function generateCSSDetails(pixelSize) {
    return `
        position: absolute;
        display: block;
        margin-bottom: `+ (pixelSize * 16) + `px;`
}