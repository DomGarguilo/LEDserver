import React, { useEffect } from "react";
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

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      console.log('NOT EQUALS');
      return;
    }

    const reorderedFrameOrder = Reorder(
      metadata.frameOrder,
      result.source.index,
      result.destination.index
    );

    rearrangeFrames(result.type, reorderedFrameOrder);
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
    <div style={modalStyles.backdrop} onClick={closeModal}>
      <div style={modalStyles.content} onClick={e => e.stopPropagation()}> {/* Prevent click from closing modal */}
        <Animation metadata={metadata} frames={frames} />
        <DragDropContext onDragEnd={onDragEnd}  >
          <FrameList metadata={metadata} frames={frames} dragSwitch={true} />
        </DragDropContext>
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};

export default Modal;