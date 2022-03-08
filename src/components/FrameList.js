import React, { PureComponent } from 'react'
import { Droppable, Draggable } from "react-beautiful-dnd";
import { getItemStyle, getAnswerListStyle } from "../utils";
import Frame from "./Frame";

class FrameList extends PureComponent {
    render() {
        const { question, questionNum, dragSwitch } = this.props;
        return (
            <Droppable droppableId={`droppable${question.name}`} type={`${questionNum}`} direction="horizontal">
                {(provided, snapshot) => (
                    <div ref={provided.innerRef} style={getAnswerListStyle(snapshot.isDraggingOver)}>
                        {question.frames.map((answer, index) => {
                            return (
                                <Draggable key={`${questionNum}${index}`} draggableId={`${questionNum}${index}`} index={index} isDragDisabled={!dragSwitch}>
                                    {(provided, snapshot) => (
                                        <span {...provided.dragHandleProps}>
                                            <div ref={provided.innerRef} {...provided.draggableProps} style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}>
                                                <Frame frame={answer} />
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
