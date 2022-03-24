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

        // outer, animation + frame draggable part
        if (result.type === "QUESTIONS") {
            const animationList = Reorder(
                this.props.animationList,
                result.source.index,
                result.destination.index
            );

            this.props.setAnimationState(animationList);
            // this.setState({
            //     animationList
            // });
        } else {
            const reorderedFrames = Reorder(
                this.props.animationList[parseInt(result.type, 10)].frames,
                result.source.index,
                result.destination.index
            );

            const animationList = this.props.animationList;

            animationList[result.type].frames = reorderedFrames;

            this.props.setAnimationState(animationList);
            // this.setState({
            //     animationList
            // });
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