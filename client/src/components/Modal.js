import React, { Component } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { Reorder, loadImages, genFrameID, getImageData, getRGBArray } from "../utils"
import Animation from "./Animation";
import FrameList from "./FrameList";

const modalStyles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    background: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '90%',
    zIndex: 1001,
  },
};

class Modal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      localMetadata: (props.metadata && Object.keys(props.metadata).length > 0) ? props.metadata : this.getDefaultMetadata(),
      frames: props.frames && props.frames.size > 0 ? props.frames : new Map()
    };
    this.onImageChange = this.onImageChange.bind(this);
  }

  backdropRef = React.createRef();

  handleMouseDown = (event) => {
    if (event.target === this.backdropRef.current) {
      this.mouseDownOnBackdrop = true;
    }
  };

  handleMouseUp = (event) => {
    if (event.target === this.backdropRef.current && this.mouseDownOnBackdrop) {
      this.props.closeModal();
    }
    this.mouseDownOnBackdrop = false;
  };

  handleSave = () => {
    const { localMetadata, frames } = this.state;
    if (frames.size < 1) {
      return;
    }

    if (this.props.isNewAnimation) {
      this.props.addAnimation(localMetadata, frames);
    } else {
      this.props.updateMetadata(this.props.metadata.animationID, localMetadata);
    }
  }

  handleSaveAndClose = () => {
    this.handleSave();
    this.props.closeModal();
  };

  onDragEnd = (result) => {
    if (!result.destination) {
      // dropped outside the list
      return;
    }

    const newFrameOrder = Reorder(
      this.state.localMetadata.frameOrder,
      result.source.index,
      result.destination.index
    );

    this.setState(prevState => ({
      localMetadata: {
        ...prevState.localMetadata,
        frameOrder: newFrameOrder
      }
    }));
  }

  handleFrameDurationChange = (e) => {
    const newDuration = Number(e.target.value);
    this.setState(prevState => ({
      localMetadata: {
        ...prevState.localMetadata,
        frameDuration: newDuration
      }
    }));
  }

  handleRepeatCountChange = (e) => {
    const newCount = Number(e.target.value);
    this.setState(prevState => ({
      localMetadata: {
        ...prevState.localMetadata,
        repeatCount: newCount
      }
    }));
  }

  getDefaultMetadata() {
    return {
      animationID: 'ID' + new Date().getTime(),
      frameDuration: 400,
      repeatCount: 3,
      frameOrder: []
    };
  }

  onImageChange = async (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const files = Array.from(event.target.files);
    const imgURLarray = files.map(file => URL.createObjectURL(file));

    try {
      const imgArray = await loadImages(imgURLarray);
      const newFrames = new Map();
      const newFrameOrder = [];

      for (let img of imgArray) {
        const frameId = genFrameID(16);
        const imgData = getImageData(img);
        const rgbArray = getRGBArray(imgData);
        newFrames.set(frameId, rgbArray);
        newFrameOrder.push(frameId);
      }

      this.setState(prevState => ({
        localMetadata: {
          ...prevState.localMetadata,
          frameOrder: newFrameOrder
        },
        frames: newFrames
      }));
    } catch (error) {
      console.error("Failed to load images:", error);
    }
  };


  render() {
    const { localMetadata, frames } = this.state;

    return (
      <div style={modalStyles.backdrop} onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp} ref={this.backdropRef}>
        <div style={modalStyles.content} onClick={e => e.stopPropagation()}>
          {this.props.isNewAnimation && (
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={this.onImageChange}
              style={{ display: 'block', marginBottom: '20px' }}
            />
          )}
          <Animation metadata={localMetadata} frames={frames} />
          <DragDropContext onDragEnd={this.onDragEnd}>
            <FrameList metadata={localMetadata} frames={frames} dragSwitch={true} />
          </DragDropContext>
          <input
            type="number"
            value={localMetadata.frameDuration}
            onChange={this.handleFrameDurationChange}
          />
          <input
            type="number"
            value={localMetadata.repeatCount}
            onChange={this.handleRepeatCountChange}
          />
          <button onClick={this.handleSave}>{this.props.isNewAnimation ? 'Insert' : 'Save'}</button>
          <button onClick={this.handleSaveAndClose}>{this.props.isNewAnimation ? 'Insert and close' : 'Save and close'}</button>
          <button onClick={this.props.closeModal}>Close</button>
        </div>
      </div>
    );
  }

}

export default Modal;