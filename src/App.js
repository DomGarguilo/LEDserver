import { Component } from "react";
import Header from './components/Header';
import AnimationContainer from './components/AnimationContainer';
import { getDataFromServer } from 'utils';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.setAnimationState.bind(this);
    this.pushNewAnimation.bind(this);

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

  pushNewAnimation = (newAnimation) => {
    const currentList = this.state.animationList;
    currentList.push(newAnimation);
    this.setState({ animationList: currentList });
  }

  render() {
    return (
      <>
        <Header pushNewAnimation={this.pushNewAnimation} />
        <AnimationContainer animationList={this.state.animationList} setAnimationState={this.setAnimationState} />
      </>
    );
  }
}

export default App;