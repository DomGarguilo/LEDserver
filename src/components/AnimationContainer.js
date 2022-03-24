import { Component } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { Reorder,  getQuestionListStyle } from "../utils";
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
        if (result.type === "QUESTIONS") {
            const animationList = Reorder(
                this.props.animationList,
                result.source.index,
                result.destination.index
            );
            this.props.setAnimationState(animationList);
        } else { // if an individual frame is being dragged
            const reorderedFrames = Reorder(
                this.props.animationList[parseInt(result.type, 10)].frames,
                result.source.index,
                result.destination.index
            );

            const animationList = this.props.animationList;

            animationList[result.type].frames = reorderedFrames;

            this.props.setAnimationState(animationList);
        }
    }

    render() {
        return (
            <DragDropContext onDragEnd={this.onDragEnd} onDragUpdate={this.onDragUpdate} >
                <Droppable droppableId="droppable" type="QUESTIONS">
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef} style={getQuestionListStyle(snapshot.isDraggingOver)} >
                            {this.props.animationList.map((question, index) => (
                                <WholeBox question={question} index={index} key={question.name}/>
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