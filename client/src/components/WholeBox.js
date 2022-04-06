import { useState } from 'react'
import { Draggable } from "react-beautiful-dnd";
import FrameList from "./FrameList";
import Animation from "./Animation";
import Switch from "./Switch";
import { getItemStyle } from 'utils';


const WholeBox = (props) => {
    const { animationData, index } = props;
    const [value, setValue] = useState(false);
    return (
        <Draggable key={animationData.name} draggableId={animationData.name} index={index} isDragDisabled={false}>
            {(provided, snapshot) => (
                <span {...provided.dragHandleProps}>
                    <div ref={provided.innerRef} {...provided.draggableProps} style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)} >
                        <Animation data={animationData} />
                        <FrameList animationData={animationData} animationIndex={index} dragSwitch={value} />
                        <Switch isOn={value} handleToggle={() => setValue(!value)} />
                        ID: {animationData.name}
                    </div>
                </span>
            )}
        </Draggable>
    );
}

export default WholeBox;