import { Component } from "react";
import Header from './components/Header';
import AnimationContainer from './components/AnimationContainer';
import { fetchMetadataFromServer, fetchFrameDataFromServer, sendStateToServer } from 'utils';

import './App.css';

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
    };
  }

  // wait for component to mount before pulling data and setting its state
  async componentDidMount() {
    const metadataList = await fetchMetadataFromServer();

    const frames = new Map();
    for (const animationMetadata of metadataList) {
      for (let i = 0; i < animationMetadata.frameOrder.length; i++) {
        const frameId = animationMetadata.frameOrder[i];
        if (!frames.has(frameId)) {
          const frameData = await fetchFrameDataFromServer(frameId);
          frames.set(frameId, frameData);
        }
      }
    }

    this.setState({
      metadataArray: metadataList,
      frames: frames,
      isLoading: false
    });
  }

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
      return { metadataArray: newMetadata, frames: newFrames };
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
      return { metadataArray: newMetadata, frames: newFrames };
    });
  }

  rearrangeAnimations = (newAnimationOrder) => {
    this.setState({ metadataArray: newAnimationOrder });
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
      return { metadataArray: newMetadata };
    });
  }

  sendStateToServer() {
    sendStateToServer(this.state.metadataArray, this.state.frames);
  }

  render() {
    return (
      <>
        <Header addAnimation={this.addAnimation} sendStateToServer={this.sendStateToServer} />
        <AnimationContainer metadataArray={this.state.metadataArray} frames={this.state.frames} isLoading={this.state.isLoading} removeAnimation={this.removeAnimation} rearrangeAnimations={this.rearrangeAnimations} rearrangeFrames={this.rearrangeFrames} />
      </>
    );
  }
}

export default App;