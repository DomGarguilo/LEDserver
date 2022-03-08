import React from 'react';
import { v4 as uuid } from 'uuid';

const Switch = ({ isOn, handleToggle }) => {
    const ID = uuid();
    return (
        <>
            <input
                checked={isOn}
                onChange={handleToggle}
                className="react-switch-checkbox"
                id={`react-switch-new` + ID}
                type="checkbox"
            />
            <label
                style={{ background: isOn && '#06D6A0' }}
                className="react-switch-label"
                htmlFor={`react-switch-new` + ID}
            >
                <span className={`react-switch-button`} />
            </label>
        </>
    );
};

export default Switch;