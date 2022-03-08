import { Component } from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { Reorder,  getQuestionListStyle } from "../utils";
import WholeBox from "./WholeBox";

async function getDataFromServer() {
    const response = await fetch('http://localhost:3000/data');
    const data = await response.json();
    return data;
}

class AnimationContainer extends Component {
    constructor(props) {
        super(props);

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
            console.log('NOT EQUALS');
            return;
        }

        // outer, animation + frame draggable part
        if (result.type === "QUESTIONS") {
            const animationList = Reorder(
                this.state.animationList,
                result.source.index,
                result.destination.index
            );

            this.setState({
                animationList
            });
        } else {
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

    render() {
        return (
            <DragDropContext onDragEnd={this.onDragEnd} onDragUpdate={this.onDragUpdate} >
                <Droppable droppableId="droppable" type="QUESTIONS">
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef} style={getQuestionListStyle(snapshot.isDraggingOver)} >
                            {this.state.animationList.map((question, index) => (
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