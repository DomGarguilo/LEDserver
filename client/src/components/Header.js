import { Component } from "react";
import { assertTrue, getHeaderStyle, arraysOrderAreEqual, Reorder, IMAGE_PIXEL_LENGTH, FRAME_PIXEL_COUNT } from "../utils"
import { DragDropContext } from "react-beautiful-dnd";
import { v4 as uuid } from 'uuid';
import FrameList from "./FrameList";

class Header extends Component {
    constructor(props) {
        super(props);

        this.state = {
            frames: []
        };
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onImageChange = this.onImageChange.bind(this);
        this.onInsert = this.onInsert.bind(this);
    }

    // determines when the Component should re-render
    shouldComponentUpdate(nextProps, nextState) {
        return !arraysOrderAreEqual(this.state.frames, nextState.frames);
    }

    // when images are selected from file explorer
    onImageChange = event => {
        if (!event.target.files || !event.target.files[0]) {
            return;
        }

        // grab image urls from the upload event
        var imgURLarray = [];
        for (var i = 0; i < event.target.files.length; i++) {
            const imgFile = event.target.files[i];
            const imgURL = URL.createObjectURL(imgFile);
            imgURLarray.push(imgURL);
        }

        // load all of the images
        loadImages(imgURLarray).then(imgArray => {
            // convert all images to hex arrays
            var hexArraySet = [];
            for (let img of imgArray) {
                const imgData = getImageData(img)
                const hexArray = getHexArray(imgData);
                hexArraySet.push(hexArray);
            }
            // set the hex color arrays to state
            this.setState({
                frames: hexArraySet
            });
        });

    };

    // reorders the frams based on where they were dragged
    onDragEnd(result) {
        // dropped outside the list
        if (!result.destination) {
            console.log('NOT EQUALS');
            return;
        }

        const reorderedFrames = Reorder(
            this.state.frames,
            result.source.index,
            result.destination.index
        );

        this.setState({
            frames: reorderedFrames
        });
    }

    onInsert() {
        if (this.state.frames.length === 0) {
            console.log('Nothing to upload, state.frames is empty');
            return;
        }
        const newAnimation = {
            name: uuid(),
            frameDuration: 2,
            repeatCount: 3,
            frames: this.state.frames
        }
        this.setState({ frames: [] });
        this.props.pushNewAnimation(newAnimation);
    }

    render() {
        return (
            <div className="Header" style={getHeaderStyle()} >
                <input type="file" multiple accept="image/*" onChange={this.onImageChange} />
                <button onClick={this.onInsert}>Insert new animation into queue</button>
                <DragDropContext onDragEnd={this.onDragEnd} onDragUpdate={this.onDragUpdate} >
                    <FrameList animationData={this.state} animationIndex={1} dragSwitch={true} />
                </DragDropContext>
            </div >
        )
    };
}

export default Header;


// accepts an array of image URLs
// waits for them to load
// returns an array of those loaded images
async function loadImages(imageUrlArray) {
    const promiseArray = []; // create an array for promises
    const imageArray = []; // array for the images

    for (let imageUrl of imageUrlArray) {
        promiseArray.push(new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.src = imageUrl;
            imageArray.push(img);
        }));
    }

    await Promise.all(promiseArray); // wait for all the images to be loaded
    console.log("all images loaded");
    return imageArray;
}

// accepts an image object
// returns the data from that image
function getImageData(img) {
    // create in-memory canvas
    const canvas = document.createElement("canvas");
    canvas.width = IMAGE_PIXEL_LENGTH;
    canvas.height = IMAGE_PIXEL_LENGTH;
    const context = canvas.getContext("2d");

    // scale image to fit canvas
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width / 2) - (img.width / 2) * scale;
    const y = (canvas.height / 2) - (img.height / 2) * scale;

    // draw the image to the canvas
    context.drawImage(img, x, y, img.width * scale, img.height * scale);
    // grab then return the image data from the new canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return imageData;
}


// converts image data from a canvas into a hex color array
function getHexArray(imageData) {
    const data = imageData.data;
    assertTrue((data.length / 4) === FRAME_PIXEL_COUNT, "Unexpected data size in uploadImage");
    var result = new Array(0);
    for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        // const alpha = data[i + 3]; ignore alpha value
        result.push(rgbToHex(red, green, blue));
    }
    assertTrue(result.length === FRAME_PIXEL_COUNT, "Unexpected array size in uploadImage");
    return result;
}

// converts a set of r, g and b values to its hex equivalent
function rgbToHex(r, g, b) {
    return "0x" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// converts an r, g or b value to its hex equivalent
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}