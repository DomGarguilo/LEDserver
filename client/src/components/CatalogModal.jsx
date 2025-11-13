import React, { useEffect, useRef } from 'react';
import Animation from './Animation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faTimes, faTrashAlt, faImages, faClock, faRedo } from '@fortawesome/free-solid-svg-icons';

const CatalogModal = ({
  animations,
  frames,
  queueAnimationIDs,
  onClose,
  onAddToQueue,
  onArchiveAnimation,
  onRemoveFromQueue,
  isLoading,
}) => {
  const animationIdSet = queueAnimationIDs instanceof Set ? queueAnimationIDs : new Set(queueAnimationIDs);
  const backdropRef = useRef(null);
  const mouseDownOnBackdropRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleMouseDown = (event) => {
    if (event.target === backdropRef.current) {
      mouseDownOnBackdropRef.current = true;
    }
  };

  const handleMouseUp = (event) => {
    if (event.target === backdropRef.current && mouseDownOnBackdropRef.current) {
      onClose();
    }
    mouseDownOnBackdropRef.current = false;
  };

  return (
    <div
      className="CatalogBackdrop"
      role="dialog"
      aria-modal="true"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      ref={backdropRef}
    >
      <div className="CatalogContent" onClick={(event) => event.stopPropagation()}>
        <div className="CatalogHeaderRow">
          <h2>Animation Catalog</h2>
          <button
            className="button CatalogCloseButton"
            onClick={onClose}
            title="Close catalog"
            aria-label="Close catalog"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        {isLoading ? (
          <div className="CatalogStatus">Loading catalog previews&hellip;</div>
        ) : animations.length === 0 ? (
          <div className="CatalogStatus">No saved animations are available yet.</div>
        ) : (
          <div className="CatalogGrid">
            {animations.map((animation) => {
              const frameOrder = animation.frameOrder || [];
              const isQueued = animationIdSet.has(animation.animationID);
              const hasFrames = frameOrder.every((frameId) => frames.has(frameId));

              return (
                <div className="CatalogCard" key={animation.animationID}>
                  <div className="CatalogPreview">
                    {hasFrames ? (
                      <Animation metadata={animation} frames={frames} samplingTechnique="catalog" />
                    ) : (
                      <div className="CatalogPlaceholder">Preview loading&hellip;</div>
                    )}
                  </div>
                  <div className="CatalogDetails">
                    <div className="CatalogMetaRow" aria-label="Animation details">
                      <span className="CatalogMetaItem">
                        <FontAwesomeIcon icon={faImages} />
                        {frameOrder.length} frame{frameOrder.length === 1 ? '' : 's'}
                      </span>
                      <span className="CatalogMetaItem">
                        <FontAwesomeIcon icon={faClock} />
                        {animation.frameDuration} ms
                      </span>
                      <span className="CatalogMetaItem">
                        <FontAwesomeIcon icon={faRedo} />
                        ×{animation.repeatCount}
                      </span>
                    </div>
                    <div className="CatalogActions">
                      <button
                        className={`button CatalogToggleButton ${isQueued ? 'CatalogToggleButton--remove' : 'CatalogToggleButton--add'}`}
                        onClick={() => (isQueued ? onRemoveFromQueue(animation.animationID) : onAddToQueue(animation))}
                        disabled={!isQueued && !hasFrames}
                        title={isQueued ? 'Remove from queue' : 'Add animation to the queue'}
                      >
                        {isQueued ? (
                          <>
                            Remove from Queue&nbsp;
                            <FontAwesomeIcon icon={faMinus} />
                          </>
                        ) : (
                          <>
                            Add to Queue&nbsp;
                            <FontAwesomeIcon icon={faPlus} />
                          </>
                        )}
                      </button>
                      <button
                        className={`button CatalogDeleteButton${isQueued ? ' CatalogDeleteButton--disabled' : ''}`}
                        onClick={() => onArchiveAnimation(animation.animationID)}
                        title={isQueued ? 'Remove from queue before deleting' : 'Delete this animation'}
                        disabled={isQueued}
                      >
                        Delete From Catalog&nbsp;
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogModal;
