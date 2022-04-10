import { Component } from "react";
import Header from './components/Header';
import AnimationContainer from './components/AnimationContainer';
import { getDataFromServer, post } from 'utils';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.setAnimationState = this.setAnimationState.bind(this);
    this.pushNewAnimation = this.pushNewAnimation.bind(this);
    this.sendStateToServer = this.sendStateToServer.bind(this);

    this.state = { animationList: [] };
  }

  // wait for component to mount before pulling data and setting its state
  async componentDidMount() {
    const data = await getDataFromServer();
    this.setState({ animationList: data.animationList });
  }

  // helper function to set state from child component
  setAnimationState = (newAnimationList) => {
    this.setState({ animationList: newAnimationList });
  }

  // helper function to push new animation into the queue
  pushNewAnimation = (newAnimation) => {
    const currentList = this.state.animationList;
    currentList.push(newAnimation);
    this.setAnimationState(currentList);
  }

  sendStateToServer() {
    const currentList = this.state.animationList;
    post(currentList, '/data');
  }

  render() {
    return (
      <>
        <Header pushNewAnimation={this.pushNewAnimation} sendStateToServer={this.sendStateToServer} />
        <AnimationContainer animationDataList={this.state.animationList} setAnimationState={this.setAnimationState} />
      </>
    );
  }
}

export default App;