import { Component } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Reorder, getItemStyle, getQuestionListStyle } from "../utils";
import FrameList from "./FrameList";
import Animation from "./Animation";

async function getDataFromServer() {
    const response = await fetch('http://localhost:3000/data');
    const data = await response.json();
    return data;
}

class AnimationContainer extends Component {
    constructor(props) {
        super(props);

        //console.log(getQuestions(3));

        this.state = {
            animationList: []
        };
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    async componentDidMount() {
        const data = await getDataFromServer();
        this.setState({ animationList: data.animationList });
        //console.log(this.state.animationList);
    }

    onDragEnd(result) {
        // dropped outside the list
        if (!result.destination) {
            return;
        }

        // outer, animation + frame draggable part
        if (result.type === "QUESTIONS") {
            console.log(result);
            const animationList = Reorder(
                this.state.animationList,
                result.source.index,
                result.destination.index
            );

            this.setState({
                animationList
            });
        } else {
            console.log(result);
            // TODO: something is wrong here where only the frames of the bottom most FrameList can be moved.s
            // I think theres a disconnect between the animationList in state and what we think it is
            // looks like there should be a 2D array whose elements are lists of thier own each corresponding to the outer and inner draggables
            const reorderedFrames = Reorder(
                this.state.animationList[parseInt(result.type, 10)].frames,
                result.source.index,
                result.destination.index
            );

            const animationList = this.state.animationList;

            animationList[result.type].frames = reorderedFrames;

            this.setState({
                animationList
            });
        }
    }

    // Normally you would want to split things out into separate components.
    // But in this example everything is just done in one place for simplicity
    //<FrameList questionNum={index} question={question} />
    render() {
        return (
            <DragDropContext onDragEnd={this.onDragEnd} onDragUpdate={this.onDragUpdate} >

                <Droppable droppableId="droppable" type="QUESTIONS">
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef} style={getQuestionListStyle(snapshot.isDraggingOver)} >
                            {this.state.animationList.map((question, index) => (

                                <Draggable key={question.name} draggableId={question.name} index={index} >
                                    {(provided, snapshot) => (
                                        <span {...provided.dragHandleProps}>
                                            <div ref={provided.innerRef} {...provided.draggableProps} style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)} >
                                                <Animation data={question} />
                                                <FrameList questionNum={index} question={question} />
                                                ID: {question.name}
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