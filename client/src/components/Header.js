import { Component } from "react";
import { assertTrue, getHeaderStyle, Reorder, IMAGE_PIXEL_LENGTH, FRAME_PIXEL_COUNT } from "../utils"
import { DragDropContext } from "react-beautiful-dnd";
import FrameList from "./FrameList";
import { genFrameID } from "../utils";

class Header extends Component {
    constructor(props) {
        super(props);

        this.state = {
            metadata: {},
            frames: new Map()
        };
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onImageChange = this.onImageChange.bind(this);
        this.onInsert = this.onInsert.bind(this);
        this.sendAppStateToServer = this.sendAppStateToServer.bind(this);
    }

    // re-render when the metadata changes
    shouldComponentUpdate(nextProps, nextState) {
        return this.state.metadata !== nextState.metadata;
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
            var newFrames = new Map();
            var newFrameOrder = [];
            for (let img of imgArray) {
                const frameId = genFrameID(16);
                const imgData = getImageData(img);
                newFrames.set(frameId, getRGBArray(imgData));
                newFrameOrder.push(frameId);
            }

            const newMetadata = {
                animationID: 'ID' + new Date().getTime(),
                frameDuration: 400,
                repeatCount: 3,
                frameOrder: newFrameOrder
            };

            // set the new frames and metadata
            this.setState({
                metadata: newMetadata,
                frames: newFrames
            });
        });

    };

    // reorders the frames based on where they were dragged
    onDragEnd(result) {
        // dropped outside the list
        if (!result.destination) {
            console.log('NOT EQUALS');
            return;
        }

        const reorderedFrameOrder = Reorder(
            this.state.metadata.frameOrder,
            result.source.index,
            result.destination.index
        );

        this.setState({
            metadata: {
                ...this.state.metadata,
                frameOrder: reorderedFrameOrder
            }
        });
    }

    /**
     * Inserts a new animation into the component's state and triggers the addAnimation prop.
     * If there are no frames to upload, it logs a message and returns.
     */
    onInsert() {
        if (this.state.frames.size === 0) {
            console.log('Nothing to upload, state.frames is empty');
            return;
        }

        console.log('inserting new animation into queue');
        console.log(this.state.metadata);
        console.log(this.state.frames);

        this.props.addAnimation(this.state.metadata, this.state.frames);

        this.setState({
            metadata: {},
            frames: new Map()
        });
    }

    sendAppStateToServer() {
        console.log('sending state to server, from header');
        this.props.sendStateToServer();
    }

    render() {
        return (
            <div className="Header" style={getHeaderStyle()} >
                <input type="file" multiple accept="image/*" onChange={this.onImageChange} />
                <button onClick={this.onInsert}>Insert new animation into queue</button>
                <button onClick={this.sendAppStateToServer}>Send state to server</button>
                <DragDropContext onDragEnd={this.onDragEnd} onDragUpdate={this.onDragUpdate} >
                    <FrameList metadata={this.state.metadata} frames={this.state.frames} animationIndex={1} dragSwitch={true} />
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


// Converts image data from a canvas into an RGB color array
function getRGBArray(imageData) {
    const data = imageData.data;
    assertTrue((data.length / 4) === FRAME_PIXEL_COUNT, "Unexpected data size in uploadImage");
    var result = new Array(0);
    for (let i = 0; i < data.length; i += 4) {
        // Add the RGB array to the result
        result.push(data[i]);
        result.push(data[i + 1]);
        result.push(data[i + 2]);
    }
    assertTrue(result.length === FRAME_PIXEL_COUNT * 3, "Unexpected array size in uploadImage");
    return new Uint8Array(result);
}