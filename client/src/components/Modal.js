import React, { useState } from "react";
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

const Modal = ({ metadata, frames, closeModal, updateMetadata }) => {
  const animationID = metadata.animationID;
  const [localMetadata, setLocalMetadata] = useState(metadata);

  const handleSave = () => {
    updateMetadata(animationID, localMetadata);
  }

  const handleSaveAndClose = () => {
    handleSave();
    closeModal();
  }

  const onDragEnd = (result) => {
    if (!result.destination) {
      // dropped outside the list
      return;
    }

    const newFrameOrder = Reorder(
      localMetadata.frameOrder,
      result.source.index,
      result.destination.index
    );

    setLocalMetadata({ ...localMetadata, frameOrder: newFrameOrder });
  }

  const handleFrameDurationChange = (e) => {
    setLocalMetadata({ ...localMetadata, frameDuration: Number(e.target.value) });
  }

  const handleRepeatCountChange = (e) => {
    setLocalMetadata({ ...localMetadata, repeatCount: Number(e.target.value) });
  }

  return (
    <div style={modalStyles.backdrop} onClick={closeModal}>
      <div style={modalStyles.content} onClick={e => e.stopPropagation()}>
        <Animation metadata={localMetadata} frames={frames} />
        <DragDropContext onDragEnd={onDragEnd}  >
          <FrameList metadata={localMetadata} frames={frames} dragSwitch={true} />
        </DragDropContext>
        <input
          type="number"
          value={localMetadata.frameDuration}
          onChange={handleFrameDurationChange}
        />
        <input
          type="number"
          value={localMetadata.repeatCount}
          onChange={handleRepeatCountChange}
        />
        <button onClick={handleSave}>Save</button>
        <button onClick={handleSaveAndClose}>Save and Close</button>
        <button onClick={closeModal}>Close without saving</button>
      </div>
    </div>
  );
};

export default Modal;