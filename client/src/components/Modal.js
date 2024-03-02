import React, { useEffect, useState } from "react";
import { DragDropContext } from "react-beautiful-dnd";
import { Reorder } from "../utils"
import Animation from "./Animation";
import FrameList from "./FrameList";

const modalStyles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    background: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '90%',
    zIndex: 1001,
  },
};

const Modal = ({ metadata, frames, rearrangeFrames, closeModal }) => {
  const [localMetadata, setLocalMetadata] = useState(metadata);

  const onDragEnd = (result) => {
    if (!result.destination) {
      // dropped outside the list
      return;
    }

    const reorderedFrameOrder = Reorder(
      localMetadata.frameOrder,
      result.source.index,
      result.destination.index
    );

    setLocalMetadata({
      ...localMetadata,
      frameOrder: reorderedFrameOrder
    });
  }

  const handleSaveAndClose = () => {
    rearrangeFrames(localMetadata.animationID, localMetadata.frameOrder);
    closeModal();
  }

  useEffect(() => {
    function keyListener(e) {
      if (e.keyCode === 27) {
        closeModal();
      }
    }

    document.addEventListener("keydown", keyListener);

    // Cleanup the event listener on component unmount
    return () => document.removeEventListener("keydown", keyListener);
  }, [closeModal]);

  return (
    <div style={modalStyles.backdrop} onClick={handleSaveAndClose}>
      <div style={modalStyles.content} onClick={e => e.stopPropagation()}> {/* Prevent click from closing modal */}
        <Animation metadata={localMetadata} frames={frames} />
        <DragDropContext onDragEnd={onDragEnd}  >
          <FrameList metadata={localMetadata} frames={frames} dragSwitch={true} />
        </DragDropContext>
        <button onClick={handleSaveAndClose}>Close</button>
      </div>
    </div>
  );
};

export default Modal;