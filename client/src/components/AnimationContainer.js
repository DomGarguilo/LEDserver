import { Component } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
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
            const reorderedAnimationDataList = Reorder(
                this.props.animationDataList,
                result.source.index,
                result.destination.index
            );
            this.props.setAnimationState(reorderedAnimationDataList);
        } else { // if an individual frame is being dragged
            const reorderedFrames = Reorder(
                this.props.animationDataList[result.type].frames,
                result.source.index,
                result.destination.index
            );

            const animationDataListCopy = this.props.animationDataList;

            animationDataListCopy[result.type].frames = reorderedFrames;

            this.props.setAnimationState(animationDataListCopy);
        }
    }

    render() {
        return (
            <DragDropContext onDragEnd={this.onDragEnd} onDragUpdate={this.onDragUpdate} >
                <Droppable droppableId="droppable" type="ANIMATIONS">
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef} style={getWholeBoxStyle(snapshot.isDraggingOver)} >
                            {this.props.animationDataList.map((animationData, index) => (
                                <WholeBox animationData={animationData} index={index} removeFromAnimationList={this.props.removeFromAnimationList} key={animationData.name} />
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