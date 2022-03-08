import { useState } from 'react'
import { Draggable } from "react-beautiful-dnd";
import FrameList from "./FrameList";
import Animation from "./Animation";
import Switch from "./Switch";
import { getItemStyle } from 'utils';


function WholeBox(props) {
    const { question, index } = props;
    const [value, setValue] = useState(false);
    return (
        <Draggable key={question.name} draggableId={question.name} index={index} isDragDisabled={false}>
            {(provided, snapshot) => (
                <span {...provided.dragHandleProps}>
                    <div ref={provided.innerRef} {...provided.draggableProps} style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)} >
                        <Animation data={question} />
                        <FrameList questionNum={index} question={question} dragSwitch={value}/>
                        <Switch isOn={value} handleToggle={() => setValue(!value)} />
                        ID: {question.name}
                    </div>
                </span>
            )}
        </Draggable>
    );
}

export default WholeBox;