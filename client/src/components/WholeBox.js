import { useState } from 'react'
import { Draggable } from "react-beautiful-dnd";
import FrameList from "./FrameList";
import Animation from "./Animation";
import Switch from "./Switch";
import { getItemStyle } from 'utils';
import trashIcon from '../resources/trash_icon.png';




const WholeBox = (props) => {
    const { animationData, index, removeFromAnimationList } = props;
    const [value, setValue] = useState(false);

    const trashIconStyle = {
        padding: 5,
        border: "solid",
        borderRadius: 8,
        cursor: "pointer"
    };

    return (
        <Draggable key={animationData.name} draggableId={animationData.name} index={index} isDragDisabled={false}>
            {(provided, snapshot) => (
                <span {...provided.dragHandleProps}>
                    <div ref={provided.innerRef} {...provided.draggableProps} style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)} >
                        <Animation data={animationData} />
                        <FrameList animationData={animationData} animationIndex={index} dragSwitch={value} />
                        <Switch isOn={value} handleToggle={() => setValue(!value)} name={animationData.name} />
                        <img src={trashIcon} width={26} height={39} style={trashIconStyle} onClick={() => removeFromAnimationList(animationData.name)} alt="trashbin" />
                    </div>
                </span>
            )}
        </Draggable>
    );
}

export default WholeBox;