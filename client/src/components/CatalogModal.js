import React from 'react';
import Animation from './Animation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faArchive, faTrash } from '@fortawesome/free-solid-svg-icons';

const CatalogModal = ({
  animations,
  frames,
  queueAnimationIDs,
  onClose,
  onAddToQueue,
  onArchiveAnimation,
  onDeleteAnimation,
  isLoading,
}) => {
  const animationIdSet = queueAnimationIDs instanceof Set ? queueAnimationIDs : new Set(queueAnimationIDs);

  return (
    <div className="CatalogBackdrop" role="dialog" aria-modal="true">
      <div className="CatalogContent">
        <div className="CatalogHeaderRow">
          <h2>Animation Catalog</h2>
          <button className="button CatalogCloseButton" onClick={onClose} title="Close catalog">
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
                    <div className="CatalogTitle">{animation.animationID}</div>
                    <div className="CatalogMeta">
                      <span>{frameOrder.length} frame{frameOrder.length === 1 ? '' : 's'}</span>
                      <span>{animation.frameDuration} ms / frame</span>
                      <span>Repeats: {animation.repeatCount}</span>
                    </div>
                    <div className="CatalogActions">
                      <button
                        className="button CatalogAddButton"
                        onClick={() => onAddToQueue(animation)}
                        disabled={isQueued || !hasFrames}
                        title={isQueued ? 'Animation already in the queue' : 'Add animation to the queue'}
                      >
                        {isQueued ? 'In Queue' : (
                          <>
                            Add to Queue&nbsp;
                            <FontAwesomeIcon icon={faPlus} />
                          </>
                        )}
                      </button>
                      <button
                        className="button CatalogArchiveButton"
                        onClick={() => onArchiveAnimation(animation.animationID)}
                        title="Archive this animation"
                      >
                        Archive&nbsp;
                        <FontAwesomeIcon icon={faArchive} />
                      </button>
                      <button
                        className="button CatalogDeleteButton"
                        onClick={() => onDeleteAnimation(animation.animationID)}
                        title="Delete this animation permanently"
                      >
                        Delete&nbsp;
                        <FontAwesomeIcon icon={faTrash} />
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
