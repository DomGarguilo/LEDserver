import React from 'react';
import { getFrameStyle } from "utils"

export default function Frame(props) {
    const { frames } = props;
    return (
        <div>
            <img src={require("resources/frog.gif")} alt="Logo" style={getFrameStyle()} />
            <h4>{frames.length}</h4>
        </div>
    );
}