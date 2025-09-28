import { Draggable } from "react-beautiful-dnd";
import Animation from "./Animation";
import { getItemStyle } from 'utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical, faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

const WholeBox = (props) => {
    const { metadata, frames, index, removeAnimation, edit } = props;

    return (
        <Draggable key={metadata.animationID} draggableId={metadata.animationID} index={index} isDragDisabled={false}>
            {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}>
                    <div className="wholeBox">
                        <div className="animation-container">
                            <Animation metadata={metadata} frames={frames} samplingTechnique="queue" />
                        </div>
                        <div className="controls-container">
                            <div className="drag-handle">
                                <FontAwesomeIcon icon={faGripVertical} />
                            </div>
                            <div className="buttons-container">
                                <button onClick={edit} className="button" title="Edit animation">
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button onClick={removeAnimation} className="button" title="Delete animation">
                                    <FontAwesomeIcon icon={faTrashAlt} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}

export default WholeBox;