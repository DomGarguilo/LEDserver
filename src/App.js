import { Component } from "react";
import Header from './components/Header';
import AnimationContainer from './components/AnimationContainer';
import { getDataFromServer } from 'utils';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.setAnimationState.bind(this);

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

  render() {
    return (
      <>
        <Header />
        <AnimationContainer animationList={this.state.animationList} setAnimationState={this.setAnimationState} />
      </>
    );
  }
}

export default App;