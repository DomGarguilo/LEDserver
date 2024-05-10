import { Component } from "react";
import { getHeaderStyle } from "../utils"

class Header extends Component {
    sendAppStateToServer = () => {
        console.log('sending state to server, from header');
        this.props.sendStateToServer();
    }

    render() {
        return (
            <div className="Header" style={getHeaderStyle()} >
                <button onClick={this.props.openCreateModal}>Create New Animation</button>
                <button onClick={this.sendAppStateToServer}>Save</button>
            </div >
        )
    };
}

export default Header;