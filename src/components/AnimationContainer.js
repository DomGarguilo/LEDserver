import { Component } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Reorder, getItemStyle, getQuestionListStyle } from "../utils";
import FrameList from "./FrameList";

// fake data generator
const getQuestions = (count) =>
    Array.from({ length: count }, (v, k) => k).map((k) => ({
        id: `question-${k}`,
        content: `question ${k}`,
        //<Frame path={"./one.jpg"} />
        //want to make this a list of frames
        frames: [`frame-1`, `frame-2`, `frame-3`]
    }));

class AnimationContainer extends Component {
    constructor(props) {
        super(props);

        console.log(getQuestions(3));

        this.state = {
            questions: getQuestions(3)
        };
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    onDragEnd(result) {
        // dropped outside the list
        if (!result.destination) {
            //console.log("no-change");
            return;
        }

        if (result.type === "QUESTIONS") {
            console.log(result);
            const questions = Reorder(
                this.state.questions,
                result.source.index,
                result.destination.index
            );

            this.setState({
                questions
            });
        } else {
            const frames = Reorder(
                this.state.questions[parseInt(result.type, 10)].frames,
                result.source.index,
                result.destination.index
            );

            const questions = JSON.parse(JSON.stringify(this.state.questions));

            questions[result.type].frames = frames;

            this.setState({
                questions
            });
        }
    }

    // Normally you would want to split things out into separate components.
    // But in this example everything is just done in one place for simplicity
    render() {
        return (
            <DragDropContext onDragEnd={this.onDragEnd} onDragUpdate={this.onDragUpdate} >

                <Droppable droppableId="droppable" type="QUESTIONS">
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef} style={getQuestionListStyle(snapshot.isDraggingOver)} >
                            {this.state.questions.map((question, index) => (

                                <Draggable key={question.id} draggableId={question.id} index={index} >
                                    {(provided, snapshot) => (
                                        <span {...provided.dragHandleProps}>
                                            <div ref={provided.innerRef} {...provided.draggableProps} style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)} >
                                                {question.content}
                                                <h3>Animation preview can go here but needs styling to push it to the left of the frames box</h3>

                                                <FrameList questionNum={index} question={question} />
                                            </div>
                                        </span>
                                    )}
                                </Draggable>
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