import { Draggable } from "react-beautiful-dnd";
import Animation from "./Animation";
import { getItemStyle } from 'utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical, faEdit, faTrashAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';

const WholeBox = (props) => {
    const { metadata, frames, index, removeAnimation, edit, loadingStatus } = props;
    const status = loadingStatus?.status || 'ready';
    const errorMessage = loadingStatus?.message;

    return (
        <Draggable key={metadata.animationID} draggableId={metadata.animationID} index={index} isDragDisabled={false}>
            {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}>
                    <div className="wholeBox">
                        <div
                            className="animation-container"
                            style={{ position: 'relative', minWidth: 180, minHeight: 180 }}
                        >
                            {status === 'ready' && (
                                <Animation metadata={metadata} frames={frames} samplingTechnique="queue" />
                            )}
                            {status === 'loading' && (
                                <div style={overlayStyle}>
                                    <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                                </div>
                            )}
                            {status === 'error' && (
                                <div style={overlayStyle}>
                                    <span style={{ color: '#b00020', fontSize: '0.9rem', textAlign: 'center' }}>
                                        {errorMessage || 'Failed to load'}
                                    </span>
                                </div>
                            )}
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

const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#fff',
    padding: '12px',
    boxSizing: 'border-box',
};
