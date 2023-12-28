import { Component } from "react";
import Header from './components/Header';
import AnimationContainer from './components/AnimationContainer';
import { fetchMetadataFromServer, fetchFrameDataFromServer, post, convertUint8ArrayToHexColorArray,parseFrameData } from 'utils';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.setAnimationState = this.setAnimationState.bind(this);
    this.pushNewAnimation = this.pushNewAnimation.bind(this);
    this.removeFromAnimationList = this.removeFromAnimationList.bind(this);
    this.sendStateToServer = this.sendStateToServer.bind(this);

    this.state = { animationList: [] };
  }

  // wait for component to mount before pulling data and setting its state
  async componentDidMount() {
    const metadataList = await fetchMetadataFromServer();
    
    const animationsWithFrames = await Promise.all(metadataList.map(async (animationMetadata) => {
        let frames = [];
        for (let i = 0; i < animationMetadata.totalFrames; i++) {
            const frameDataBuffer = await fetchFrameDataFromServer(animationMetadata.animationID, i);
            const uint8Array = new Uint8Array(frameDataBuffer); // Convert ArrayBuffer to Uint8Array
            const hexColorArray = convertUint8ArrayToHexColorArray(uint8Array);
            frames.push(hexColorArray);
        }
        return { ...animationMetadata, frames };
    }));

    console.log(animationsWithFrames);

    this.setState({ animationList: animationsWithFrames });
}

  // helper function to set state from child component
  setAnimationState = (newAnimationList) => {
    this.setState({ animationList: newAnimationList });
  }

  // helper function to push new animation into the queue
  pushNewAnimation = (newAnimation) => {
    const currentList = this.state.animationList;
    currentList.unshift(newAnimation);
    this.setState({ animationList: currentList });
  }

  // helper function to remove an entry from the animation array
  removeFromAnimationList = (animationToDelete) => {
    this.setState({
      animationList: this.state.animationList.filter(function (animation) {
        return animation.animationID !== animationToDelete;
      })
    });
  }

  sendStateToServer() {
    const currentList = this.state.animationList;
    post(currentList, '/data');
  }

  render() {
    return (
      <>
        <Header pushNewAnimation={this.pushNewAnimation} sendStateToServer={this.sendStateToServer} />
        <AnimationContainer animationDataList={this.state.animationList} setAnimationState={this.setAnimationState} removeFromAnimationList={this.removeFromAnimationList} />
      </>
    );
  }
}

export default App;