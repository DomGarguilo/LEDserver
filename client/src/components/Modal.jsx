import React, { Component } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Reorder, genFrameID, getResizedRGBArray, getResizedRGBArrayFromImageData, extractFramesFromGif } from "../utils";
import Animation from "./Animation";
import FrameList from "./FrameList";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';

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
    top: 20,
    right: 20,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  topButton: {
    fontSize: '1rem',
    padding: '10px 12px',
  },
  topSection: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
  },
  spinnerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    color: '#333',
  },
  spinnerLabel: {
    fontSize: '1rem',
  },
};

class Modal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      localMetadata: (props.metadata && Object.keys(props.metadata).length > 0) ? props.metadata : this.getDefaultMetadata(),
      frames: props.frames && props.frames.size > 0 ? props.frames : new Map(),
      hasUnsavedChanges: false,
      currentFrames: props.isNewAnimation ? new Map() : props.frames,
      framesTech1: new Map(),
      framesTech2: new Map(),
      samplingTechnique: 'nearest',
      isProcessing: false,
    };
    this.onImageChange = this.onImageChange.bind(this);
  }

  backdropRef = React.createRef();

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      this.confirmClose();
    }
  };

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
    const { localMetadata } = this.state;
    const { isNewAnimation } = this.props;

    if (isNewAnimation) {
      const { currentFrames } = this.state;
      if (currentFrames.size < 1) {
        return;
      }
      this.props.addAnimation(localMetadata, currentFrames);
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

  calculateGifFrameDuration = (frames) => {
    if (!frames || frames.length === 0) {
      return this.state.localMetadata.frameDuration;
    }

    const validDelays = frames
      .map(frame => frame.delayMs)
      .filter(delay => typeof delay === 'number' && delay > 0);

    if (validDelays.length === 0) {
      return this.state.localMetadata.frameDuration;
    }

    const averageDelay = validDelays.reduce((sum, delay) => sum + delay, 0) / validDelays.length;
    return Math.max(20, Math.round(averageDelay));
  };

  onImageChange = async (event) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const files = Array.from(event.target.files);
    event.target.value = '';

    const gifFiles = files.filter(file => file.type === 'image/gif');

    if (gifFiles.length > 0) {
      if (gifFiles.length > 1 || files.length > gifFiles.length) {
        window.alert('Please upload a single GIF or multiple static images, not both.');
        return;
      }

      this.setState({ isProcessing: true });
      try {
        const gifFrames = await extractFramesFromGif(gifFiles[0]);

        if (!gifFrames.length) {
          window.alert('No frames could be extracted from the GIF.');
          return;
        }

        const framesTech1 = new Map();
        const framesTech2 = new Map();
        const newFrameOrder = [];

        for (const { imageData } of gifFrames) {
          const frameId = genFrameID(16);
          const rgbArrayNearest = getResizedRGBArrayFromImageData(imageData, 'nearest');
          const rgbArrayBilinear = getResizedRGBArrayFromImageData(imageData, 'bilinear');

          framesTech1.set(frameId, rgbArrayNearest);
          framesTech2.set(frameId, rgbArrayBilinear);
          newFrameOrder.push(frameId);
        }

        const frameDuration = this.calculateGifFrameDuration(gifFrames);

        this.setState(prevState => ({
          framesTech1,
          framesTech2,
          currentFrames: prevState.samplingTechnique === 'nearest' ? framesTech1 : framesTech2,
          localMetadata: {
            ...prevState.localMetadata,
            frameDuration,
            frameOrder: newFrameOrder
          },
          hasUnsavedChanges: true,
        }));
      } catch (error) {
        console.error('Failed to process GIF:', error);
        window.alert('An error occurred while processing the GIF. Please try another file.');
      } finally {
        this.setState({ isProcessing: false });
      }

      return;
    }

    this.setState({ isProcessing: true });
    try {
      const imgArray = await Promise.all(
        files.map(file => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              resolve(img);
              URL.revokeObjectURL(img.src); // Free up memory
            };
            img.onerror = () => {
              reject(new Error("Failed to load image"));
            };
            img.src = URL.createObjectURL(file);
          });
        })
      );

      const framesTech1 = new Map();
      const framesTech2 = new Map();
      const newFrameOrder = [];

      for (let img of imgArray) {
        const frameId = genFrameID(16);

        // Get resized RGB arrays using both sampling methods
        const rgbArrayNearest = getResizedRGBArray(img, 'nearest');
        const rgbArrayBilinear = getResizedRGBArray(img, 'bilinear');

        framesTech1.set(frameId, rgbArrayNearest);
        framesTech2.set(frameId, rgbArrayBilinear);
        newFrameOrder.push(frameId);
      }

      this.setState(prevState => ({
        framesTech1,
        framesTech2,
        currentFrames: prevState.samplingTechnique === 'nearest' ? framesTech1 : framesTech2,
        localMetadata: {
          ...prevState.localMetadata,
          frameOrder: newFrameOrder
        },
        hasUnsavedChanges: true,
      }));
    } catch (error) {
      console.error("Failed to load images:", error);
      window.alert('An error occurred while loading the selected images.');
    } finally {
      this.setState({ isProcessing: false });
    }
  };


  handleSamplingTechniqueChange = (event) => {
    const selectedTechnique = event.target.value;
    this.setState(prevState => {
      let newCurrentFrames;
      if (selectedTechnique === 'nearest') {
        newCurrentFrames = prevState.framesTech1;
      } else if (selectedTechnique === 'bilinear') {
        newCurrentFrames = prevState.framesTech2;
      } else {
        console.error("Invalid sampling technique selected");
        return;
      }
      return {
        samplingTechnique: selectedTechnique,
        currentFrames: newCurrentFrames,
        hasUnsavedChanges: true,
      };
    });
  }

  render() {
    const { localMetadata, currentFrames, isProcessing } = this.state;

    return (
      <div style={modalStyles.backdrop} onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp} ref={this.backdropRef}>
        <div style={{ ...modalStyles.content, pointerEvents: isProcessing ? 'none' : 'auto' }} onClick={e => e.stopPropagation()}>
          <div style={modalStyles.topRightButtons}>
            <button
              onClick={this.confirmClose}
              className="button"
              style={modalStyles.topButton}
              title="Close"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <button
              onClick={this.handleSave}
              className="button"
              style={modalStyles.topButton}
              title={this.props.isNewAnimation ? "Insert" : "Save"}
              aria-label={this.props.isNewAnimation ? "Insert" : "Save"}
            >
              <FontAwesomeIcon icon={faSave} />
            </button>
            {this.state.hasUnsavedChanges && (
              <span
                style={{ color: 'red', fontWeight: 'bold', marginLeft: 4 }}
                title="Unsaved changes"
                aria-label="Unsaved changes"
              >
                •
              </span>
            )}
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
          {this.props.isNewAnimation && (
            <div style={modalStyles.controlGroup}>
              <label style={modalStyles.label}>Sampling Technique:</label>
              <div>
                <label>
                  <input
                    type="radio"
                    value="nearest"
                    checked={this.state.samplingTechnique === 'nearest'}
                    onChange={this.handleSamplingTechniqueChange}
                  />
                  Nearest Neighbor Sampling
                </label>
                <label style={{ marginLeft: '10px' }}>
                  <input
                    type="radio"
                    value="bilinear"
                    checked={this.state.samplingTechnique === 'bilinear'}
                    onChange={this.handleSamplingTechniqueChange}
                  />
                  Bilinear Interpolation Sampling
                </label>
              </div>
            </div>
          )}
          <div style={modalStyles.topSection}>
            <Animation metadata={localMetadata} frames={currentFrames} samplingTechnique={this.state.samplingTechnique} />
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
            <FrameList metadata={localMetadata} frames={currentFrames} dragSwitch={true} />
          </DragDropContext>
        </div>
        {isProcessing && (
          <div style={modalStyles.loadingOverlay}>
            <div style={modalStyles.spinnerContainer}>
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
              <span style={modalStyles.spinnerLabel}>Processing animation...</span>
            </div>
          </div>
        )}
      </div>
    );
  }

}

export default Modal;
