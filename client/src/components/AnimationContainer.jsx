import { Component } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { Reorder, getWholeBoxStyle } from "../utils";
import WholeBox from "./WholeBox";

class AnimationContainer extends Component {
    constructor(props) {
        super(props);

        this.onDragEnd = this.onDragEnd.bind(this);
    }

    onDragEnd(result) {
        // dropped outside the list
        if (!result.destination) {
            console.log('NOT EQUALS');
            return;
        }

        // if a WholeBox is being dragged
        if (result.type === "ANIMATIONS") {
            const reorderedMetadata = Reorder(
                this.props.metadataArray,
                result.source.index,
                result.destination.index
            );
            this.props.rearrangeAnimations(reorderedMetadata);
        } else { // if an individual frame is being dragged
            const animationMetadata = this.props.metadataArray.find(meta => meta.animationID === result.type);
            if (animationMetadata) {
                const reorderedFrameOrder = Reorder(
                    animationMetadata.frameOrder,
                    result.source.index,
                    result.destination.index
                );

                this.props.rearrangeFrames(result.type, reorderedFrameOrder);
            } else {
                console.error('could not find animation metadata for frame reorder. animationID:', result.type);
            }
        }
    }

    render() {
        if (this.props.isLoading) {
            return <div>Loading...</div>;
        }
        return (
            <DragDropContext onDragEnd={this.onDragEnd} onDragUpdate={this.onDragUpdate} >
                <Droppable droppableId="droppable" type="ANIMATIONS" direction="horizontal">
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef} style={getWholeBoxStyle(snapshot.isDraggingOver)} >
                            {this.props.metadataArray.map((metadata, index) => (
                                <WholeBox
                                    metadata={metadata}
                                    frames={this.props.frames}
                                    loadingStatus={this.props.loadingStatus?.[metadata.animationID]}
                                    index={index}
                                    removeAnimation={() => this.props.removeAnimation(metadata.animationID)}
                                    key={metadata.animationID}
                                    edit={() => this.props.setActiveAnimationID(metadata.animationID)}
                                />
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        );
    }
}

export default AnimationContainer;
