import React, { PureComponent } from 'react'
import { Droppable, Draggable } from "react-beautiful-dnd";
import { getItemStyle, getFrameListStyle } from "../utils";
import Frame from "./Frame";

class FrameList extends PureComponent {

    render() {
        const { metadata, frames, dragSwitch } = this.props;
        if (!metadata || !metadata.frameOrder) {
            console.error('metadata or metadata.frameOrder is null for ' + metadata.animationID);
            return null;
        }
        return (
            <>
                <Droppable droppableId={`droppable${metadata.animationID}`} type={`${metadata.animationID}`} direction="horizontal">
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef} style={getFrameListStyle(snapshot.isDraggingOver)}>
                            {metadata.frameOrder.map((frameId, index) => {
                                const frame = frames.get(frameId);
                                return (
                                    <Draggable key={`${frameId}`} draggableId={`${frameId}`} index={index} isDragDisabled={!dragSwitch}>
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
