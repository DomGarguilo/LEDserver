import PropTypes from "prop-types";

export default function Animation(props) {
    return (
        <li>{props.name}</li>
    );
}

Animation.propTypes = {
    name: PropTypes.string.isRequired
};