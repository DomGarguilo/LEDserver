import { Component } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faPlusSquare, faList } from "@fortawesome/free-solid-svg-icons";

class Header extends Component {
    render() {
        return (
            <div className="Header">
                <button onClick={this.props.openCatalog} className="button" title="Browse animation catalog">
                    Catalog&nbsp;<FontAwesomeIcon icon={faList} />
                </button>
                <button onClick={this.props.openModalForNewAnimation} className="button" title="Add new animation">
                    New Animation&nbsp;<FontAwesomeIcon icon={faPlusSquare} />
                </button>
                <button onClick={this.props.sendStateToServer} className="button" title="Save changes">
                    Save&nbsp;<FontAwesomeIcon icon={faSave} />
                    {this.props.hasUnsavedChanges && <span style={{ color: 'red', marginLeft: '5px' }}>!</span>}
                </button>
            </div>
        )
    };
}

export default Header;