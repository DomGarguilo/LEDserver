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
                <span {...provided.dragHandleProps}>
                    <div ref={provided.innerRef} {...provided.draggableProps} style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)} >
                        <Animation metadata={metadata} frames={frames} />
                        <div className="wholeBoxButtonContainer">
                            <div className="drag-handle" {...provided.dragHandleProps}>
                                <FontAwesomeIcon icon={faGripVertical} />
                            </div>
                            <button onClick={edit} className="button" title="Edit animation">
                                <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button onClick={removeAnimation} className="button" title="Delete animation">
                                <FontAwesomeIcon icon={faTrashAlt} />
                            </button>
                        </div>
                    </div>
                </span>
            )}
        </Draggable>
    );
}

export default WholeBox;