import { useState } from 'react'
import { Draggable } from "react-beautiful-dnd";
import FrameList from "./FrameList";
import Animation from "./Animation";
import Switch from "./Switch";
import { getItemStyle } from 'utils';
import trashIcon from '../resources/trash_icon.png';

const WholeBox = (props) => {
    const { metadata, frames, index, removeAnimation } = props;
    const [value, setValue] = useState(false);

    const trashIconStyle = {
        padding: 5,
        border: "solid",
        borderRadius: 8,
        cursor: "pointer"
    };

    return (
        <Draggable key={metadata.animationID} draggableId={metadata.animationID} index={index} isDragDisabled={false}>
            {(provided, snapshot) => (
                <span {...provided.dragHandleProps}>
                    <div ref={provided.innerRef} {...provided.draggableProps} style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)} >
                        <Animation metadata={metadata} frames={frames} />
                        <FrameList metadata={metadata} frames={frames} animationIndex={index} dragSwitch={value} />
                        <Switch isOn={value} handleToggle={() => setValue(!value)} name={metadata.animationID} />
                        <img src={trashIcon} width={26} height={39} style={trashIconStyle} onClick={() => removeAnimation(metadata.animationID)} alt="trashbin" />
                    </div>
                </span>
            )}
        </Draggable>
    );
}

export default WholeBox;