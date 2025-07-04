import { Component } from "react";
import AnimationContainer from './components/AnimationContainer';
import { fetchMetadataFromServer, fetchFramesRawFromServer, sendStateToServer } from './utils';
import Modal from './components/Modal';

import './App.css';
import Header from "components/Header";

class App extends Component {
  constructor(props) {
    super(props);

    this.addAnimation = this.addAnimation.bind(this);
    this.removeAnimation = this.removeAnimation.bind(this);
    this.rearrangeAnimations = this.rearrangeAnimations.bind(this);
    this.rearrangeFrames = this.rearrangeFrames.bind(this);
    this.sendStateToServer = this.sendStateToServer.bind(this);

    this.state = {
      metadataArray: [], // Array of animation metadata, each with a list of frame IDs
      frames: new Map(), // Map from frame IDs to frame data
      isLoading: true,
      activeAnimationID: null,  // Null for new animations, non-null for editing existing animation
      modalOpen: false,         // Generic modal open state
      hasUnsavedChanges: false  // Track unsaved changes
    };
  }

  handleBeforeUnload = (event) => {
    if (this.state.hasUnsavedChanges) {
      const confirmationMessage = 'You have unsaved changes. Are you sure you want to leave?';
      event.returnValue = confirmationMessage;
      return confirmationMessage;
    }
  };

  // wait for component to mount before pulling data and setting its state
  async componentDidMount() {
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    const metadataList = await fetchMetadataFromServer();
    const frames = new Map();
    // Batch-fetch raw binary frames per animation using octet-stream endpoint
    for (const animationMetadata of metadataList) {
      const batch = await fetchFramesRawFromServer(
        animationMetadata.animationID,
        animationMetadata.frameOrder
      );
      for (const [frameId, frameData] of batch.entries()) {
        frames.set(frameId, frameData);
      }
    }
    this.setState({
      metadataArray: metadataList,
      frames,
      isLoading: false,
      activeAnimationID: null
    });
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  setUnsavedChanges = (hasUnsavedChanges) => {
    this.setState({ hasUnsavedChanges });
  };

  openModalForNewAnimation = () => {
    this.setState({ modalOpen: true, activeAnimationID: null });
  };

  openModalForEditAnimation = (animationID) => {
    this.setState({ modalOpen: true, activeAnimationID: animationID });
  };

  closeModal = () => {
    this.setState({ modalOpen: false, activeAnimationID: null });
  };

  /**
   * Adds a new animation to the state.
   * 
   * @param {Object} newAnimationMetadata - The metadata of the new animation.
   * @param {Map<string,Uint8Array} newFrameData - The frame data of the new animation.
   */
  addAnimation = (newAnimationMetadata, newFrameData) => {
    this.setState(prevState => {
      // Add the new animation's metadata to the beginning of the metadata array
      const newMetadata = [newAnimationMetadata, ...prevState.metadataArray];

      // create a new Map with the new frame data
      const newFrames = new Map(prevState.frames);
      for (const [frameId, frameData] of newFrameData.entries()) {
        newFrames.set(frameId, frameData);
      }

      // replace the state with the new metadata and frames
      return { metadataArray: newMetadata, frames: newFrames, hasUnsavedChanges: true };
    });
  }

  /**
   * Removes an animation from the state.
   * 
   * @param {string} animationID - The ID of the animation to remove.
   */
  removeAnimation = (animationID) => {
    this.setState(prevState => {
      // remove all the frames in an animation from the frames Map
      const newMetadata = prevState.metadataArray.filter(animation => animation.animationID !== animationID);

      // create a new Map with the frames that are not in the removed animation
      const newFrames = new Map(prevState.frames);
      for (const animation of prevState.metadataArray) {
        if (animation.animationID === animationID) {
          for (const frameId of animation.frameOrder) {
            newFrames.delete(frameId);
          }
        }
      }
      return { metadataArray: newMetadata, frames: newFrames, hasUnsavedChanges: true };
    });
  }

  rearrangeAnimations = (newAnimationOrder) => {
    this.setState({ metadataArray: newAnimationOrder, hasUnsavedChanges: true });
  }

  /**
   * Rearranges the frames of an animation in the state.
   * 
   * @param {string} animationID - The ID of the animation.
   * @param {string[]} newFrameOrder - The new order of frames in the given animation.
   */
  rearrangeFrames = (animationID, newFrameOrder) => {
    this.setState(prevState => {
      const newMetadata = prevState.metadataArray.map(metadata => {
        if (metadata.animationID === animationID) {
          // Replace the frame order for this animation
          return { ...metadata, frameOrder: newFrameOrder };
        } else {
          return metadata;
        }
      });
      return { metadataArray: newMetadata, hasUnsavedChanges: true };
    });
  }

  /**
   * Updates the metadata of the animation with the given ID.
   * 
   * @param {string} animationID - The ID of the animation to update.
   * @param {Object} newMetadata - The new metadata for the animation.
   */
  updateMetadata = (animationID, newMetadata) => {
    if (!newMetadata.animationID || !newMetadata.frameDuration || !newMetadata.repeatCount || !newMetadata.frameOrder) {
      console.error('Invalid metadata:', newMetadata);
      return;
    }
    this.setState(prevState => {
      const newMetadataArray = prevState.metadataArray.map(metadata => {
        if (metadata.animationID === animationID) {
          return newMetadata;
        } else {
          return metadata;
        }
      });
      return { metadataArray: newMetadataArray, hasUnsavedChanges: true };
    });
  }

  sendStateToServer = () => {
    sendStateToServer(this.state.metadataArray, this.state.frames);
    this.setState({ hasUnsavedChanges: false });
  }

  render() {
    const { metadataArray, frames, isLoading, activeAnimationID, modalOpen } = this.state;
    const activeMetadata = activeAnimationID ? metadataArray.find(metadata => metadata.animationID === activeAnimationID) : {};

    return (
      <div className="container">
        <Header
          sendStateToServer={this.sendStateToServer}
          openModalForNewAnimation={this.openModalForNewAnimation}
          hasUnsavedChanges={this.state.hasUnsavedChanges}
        />
        <div className="AnimationContainer">
          <AnimationContainer
            metadataArray={metadataArray}
            frames={frames}
            isLoading={isLoading}
            removeAnimation={this.removeAnimation}
            rearrangeAnimations={this.rearrangeAnimations}
            rearrangeFrames={this.rearrangeFrames}
            setActiveAnimationID={this.openModalForEditAnimation}
          />
        </div>
        {modalOpen && (
          <Modal
            metadata={activeMetadata}
            frames={activeAnimationID ? frames : new Map()}
            closeModal={this.closeModal}
            updateMetadata={this.updateMetadata}
            addAnimation={this.addAnimation}
            isNewAnimation={!activeAnimationID}
          />
        )}
      </div>
    );
  }
}

export default App;