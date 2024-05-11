import { Component } from "react";
import { getHeaderStyle } from "../utils"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faPlusSquare } from "@fortawesome/free-solid-svg-icons";

class Header extends Component {
    sendAppStateToServer = () => {
        console.log('sending state to server, from header');
        this.props.sendStateToServer();
    }

    render() {
        return (
            <div className="Header" style={getHeaderStyle()} >
                <button onClick={this.props.openCreateModal} className="wholeBoxButton">
                    <FontAwesomeIcon icon={faPlusSquare} />
                </button>
                <button onClick={this.sendAppStateToServer} className="wholeBoxButton">
                    <FontAwesomeIcon icon={faSave} />
                </button>
            </div >
        )
    };
}

export default Header;