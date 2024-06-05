import React, { Component } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { Reorder, loadImages, genFrameID, getImageData, getRGBArray } from "../utils";
import Animation from "./Animation";
import FrameList from "./FrameList";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

const modalStyles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    width: '70%',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: '20px',
    marginBottom: '20px',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '10px',
  },
  label: {
    marginBottom: '5px',
  },
  inputField: {
    marginBottom: '10px',
  },
  topRightButtons: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    display: 'flex',
    flexDirection: 'row',
  },
  button: {
    marginLeft: '10px',
    fontSize: '1rem',
    padding: '10px 15px',
  },
  topSection: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
};

class Modal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      localMetadata: (props.metadata && Object.keys(props.metadata).length > 0) ? props.metadata : this.getDefaultMetadata(),
      frames: props.frames && props.frames.size > 0 ? props.frames : new Map(),
      hasUnsavedChanges: false,
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
      this.confirmClose();
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

    this.props.closeModal();
  }

  confirmClose = () => {
    if (this.state.hasUnsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        this.props.closeModal();
      }
    } else {
      this.props.closeModal();
    }
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

    const hasOrderChanged = JSON.stringify(newFrameOrder) !== JSON.stringify(this.state.localMetadata.frameOrder);

    if (!hasOrderChanged) {
      return;
    }

    this.setState(prevState => ({
      localMetadata: {
        ...prevState.localMetadata,
        frameOrder: newFrameOrder
      },
      hasUnsavedChanges: true,
    }));
  }

  handleFrameDurationChange = (e) => {
    const newDuration = Number(e.target.value);
    this.setState(prevState => ({
      localMetadata: {
        ...prevState.localMetadata,
        frameDuration: newDuration
      },
      hasUnsavedChanges: true,
    }));
  }

  handleRepeatCountChange = (e) => {
    const newCount = Number(e.target.value);
    this.setState(prevState => ({
      localMetadata: {
        ...prevState.localMetadata,
        repeatCount: newCount
      },
      hasUnsavedChanges: true,
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
          <div style={modalStyles.topRightButtons}>
            <button onClick={this.handleSave} className="button" title={this.state.isNewAnimation ? "Insert" : "Save"}>
              {this.props.isNewAnimation ? "Insert" : "Save"}&nbsp;<FontAwesomeIcon icon={faSave} />
              {this.state.hasUnsavedChanges && <span style={{ color: 'red', marginLeft: '5px' }}>!</span>}
            </button>
            <button onClick={this.confirmClose} className="button" title="Close">
              Close&nbsp;<FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          {this.props.isNewAnimation && (
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={this.onImageChange}
              style={{ display: 'block', marginBottom: '20px' }}
            />
          )}
          <div style={modalStyles.topSection}>
            <Animation metadata={localMetadata} frames={frames} />
            <div style={modalStyles.controls}>
              <div style={modalStyles.controlGroup}>
                <label style={modalStyles.label}>Frame Duration (ms):</label>
                <input
                  type="number"
                  value={localMetadata.frameDuration}
                  onChange={this.handleFrameDurationChange}
                  style={modalStyles.inputField}
                />
              </div>
              <div style={modalStyles.controlGroup}>
                <label style={modalStyles.label}>Repeat Count:</label>
                <input
                  type="number"
                  value={localMetadata.repeatCount}
                  onChange={this.handleRepeatCountChange}
                  style={modalStyles.inputField}
                />
              </div>
            </div>
          </div>
          <DragDropContext onDragEnd={this.onDragEnd}>
            <FrameList metadata={localMetadata} frames={frames} dragSwitch={true} />
          </DragDropContext>
        </div>
      </div>
    );
  }

}

export default Modal;