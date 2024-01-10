import React, { PureComponent } from 'react'
import { Droppable, Draggable } from "react-beautiful-dnd";
import { getItemStyle, getFrameListStyle } from "../utils";
import Frame from "./Frame";

class FrameList extends PureComponent {

    render() {
        console.log('rendering FrameList');
        return (
            <>
                <Droppable droppableId={`droppable${this.props.animationData.animationID}`} type={`${this.props.animationIndex}`} direction="horizontal">
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef} style={getFrameListStyle(snapshot.isDraggingOver)}>
                            {this.props.animationData.frames.map((frame, index) => {
                                return (
                                    <Draggable key={`${this.props.animationIndex}${index}`} draggableId={`${this.props.animationIndex}${index}`} index={index} isDragDisabled={!this.props.dragSwitch}>
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
            </>
        );
    };
};

export default FrameList;
