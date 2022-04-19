import React from 'react';

const Switch = ({ isOn, handleToggle, name }) => {
    return (
        <>
            <input
                checked={isOn}
                onChange={handleToggle}
                className="react-switch-checkbox"
                id={`react-switch-new` + name}
                type="checkbox"
            />
            <label
                style={{ background: isOn && '#06D6A0' }}
                className="react-switch-label"
                htmlFor={`react-switch-new` + name}
            >
                <span className={`react-switch-button`} />
            </label>
        </>
    );
};

export default Switch;