import React from 'react';
import Header from './Header';
import AnimationContainer from './AnimationContainer';

import './App.css';

const contacts = [
  { id: 1, name: "Leanne Graham" },
  { id: 2, name: "Ervin Howell" },
  { id: 3, name: "Clementine Bauch" },
  { id: 4, name: "Patricia Lebsack" }
];

const listItems = [
  "Entertainment",
  "Private Time",
  "Rest",
  "Meal",
  "Exercise",
  "Work",
  "Home Projects",
  "Family"
];

function App() {
  return (
    <>
      <Header />
      <AnimationContainer />
    </>
  );
}

export default App;