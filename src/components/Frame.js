import React from 'react';
import { getFrameStyle } from "utils"

export default function Frame(props) {
    return (
        <div>
            <img src={require("resources/frog.gif")} alt="Logo" style={getFrameStyle()} />
        </div>
    );
}