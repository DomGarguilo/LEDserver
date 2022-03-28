import React, { PureComponent } from 'react'
import { Droppable, Draggable } from "react-beautiful-dnd";
import { getItemStyle, getFrameListStyle } from "../utils";
import Frame from "./Frame";

class FrameList extends PureComponent {
    render() {
        const { animationData, animationIndex, dragSwitch } = this.props;
        return (
            <Droppable droppableId={`droppable${animationData.name}`} type={`${animationIndex}`} direction="horizontal">
                {(provided, snapshot) => (
                    <div ref={provided.innerRef} style={getFrameListStyle(snapshot.isDraggingOver)}>
                        {animationData.frames.map((frame, index) => {
                            return (
                                <Draggable key={`${animationIndex}${index}`} draggableId={`${animationIndex}${index}`} index={index} isDragDisabled={!dragSwitch}>
                                    {(provided, snapshot) => (
                                        <span {...provided.dragHandleProps}>
                                            <div ref={provided.innerRef} {...provided.draggableProps} style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}>
                                                <Frame frame={frame} />
                                            </div>
                                        </span>
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        );
    };
};

export default FrameList;
