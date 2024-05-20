import { Component } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faPlusSquare } from "@fortawesome/free-solid-svg-icons";

class Header extends Component {
    render() {
        return (
            <div className="Header">
                <button onClick={this.props.openModalForNewAnimation} className="button" title="Add new animation">
                    <FontAwesomeIcon icon={faPlusSquare} />
                </button>
                <button onClick={this.props.sendStateToServer} className="button" title="Save changes">
                    <FontAwesomeIcon icon={faSave} />
                    {this.props.hasUnsavedChanges && <span style={{ color: 'red', marginLeft: '5px' }}>!</span>}
                </button>
            </div>
        )
    };
}

export default Header;