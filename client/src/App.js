import { Component } from "react";
import AnimationContainer from './components/AnimationContainer';
import {
  fetchMetadataFromServer,
  fetchFramesRawFromServer,
  sendStateToServer,
  fetchCatalogFromServer,
  archiveCatalogAnimationOnServer,
  deleteCatalogAnimationFromServer,
} from './utils';
import Modal from './components/Modal';
import CatalogModal from './components/CatalogModal';

import './App.css';
import Header from "components/Header";

class App extends Component {
  constructor(props) {
    super(props);

    this.addAnimation = this.addAnimation.bind(this);
    this.removeAnimation = this.removeAnimation.bind(this);
    this.rearrangeAnimations = this.rearrangeAnimations.bind(this);
    this.rearrangeFrames = this.rearrangeFrames.bind(this);
    this.sendStateToServer = this.sendStateToServer.bind(this);

    this.state = {
      metadataArray: [], // Array of animation metadata, each with a list of frame IDs
      frames: new Map(), // Map from frame IDs to frame data for the active queue
      isLoading: true,
      activeAnimationID: null,  // Null for new animations, non-null for editing existing animation
      modalOpen: false,         // Generic modal open state
      hasUnsavedChanges: false, // Track unsaved changes
      catalogAnimations: [],
      catalogFrames: new Map(),
      isCatalogLoading: false,
      isCatalogOpen: false,
    };
  }

  handleBeforeUnload = (event) => {
    if (this.state.hasUnsavedChanges) {
      const confirmationMessage = 'You have unsaved changes. Are you sure you want to leave?';
      event.returnValue = confirmationMessage;
      return confirmationMessage;
    }
  };

  // wait for component to mount before pulling data and setting its state
  async componentDidMount() {
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    try {
      const [metadataList, catalogList] = await Promise.all([
        fetchMetadataFromServer(),
        fetchCatalogFromServer(),
      ]);

      const frames = await this.loadFramesForAnimations(metadataList);

      this.setState({
        metadataArray: metadataList,
        frames,
        isLoading: false,
        activeAnimationID: null,
        catalogAnimations: catalogList,
      });
    } catch (error) {
      console.error('Failed to initialize app data:', error);
      this.setState({ isLoading: false });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  loadFramesForAnimations = async (animations) => {
    const frames = new Map();
    const fetchPromises = animations.map(async (animationMetadata) => {
      if (!animationMetadata.frameOrder || animationMetadata.frameOrder.length === 0) {
        return;
      }
      const batch = await fetchFramesRawFromServer(
        animationMetadata.animationID,
        animationMetadata.frameOrder
      );
      for (const [frameId, frameData] of batch.entries()) {
        frames.set(frameId, frameData);
      }
    });

    await Promise.all(fetchPromises);
    return frames;
  }

  setUnsavedChanges = (hasUnsavedChanges) => {
    this.setState({ hasUnsavedChanges });
  };

  openModalForNewAnimation = () => {
    this.setState({ modalOpen: true, activeAnimationID: null });
  };

  openModalForEditAnimation = (animationID) => {
    this.setState({ modalOpen: true, activeAnimationID: animationID });
  };

  closeModal = () => {
    this.setState({ modalOpen: false, activeAnimationID: null });
  };

  openCatalog = async () => {
    this.setState({ isCatalogOpen: true });
    await this.ensureCatalogFramesLoaded();
  };

  closeCatalog = () => {
    this.setState({ isCatalogOpen: false });
  };

  ensureCatalogFramesLoaded = async () => {
    const { catalogAnimations, catalogFrames } = this.state;
    const framesToFetch = catalogAnimations.filter((animation) => {
      if (!animation.frameOrder || animation.frameOrder.length === 0) {
        return false;
      }
      return animation.frameOrder.some((frameId) => !catalogFrames.has(frameId));
    });

    if (framesToFetch.length === 0) {
      return;
    }

    this.setState({ isCatalogLoading: true });
    try {
      const updatedFrames = new Map(catalogFrames);
      for (const animation of framesToFetch) {
        if (!animation.frameOrder || animation.frameOrder.length === 0) {
          continue;
        }
        const batch = await fetchFramesRawFromServer(
          animation.animationID,
          animation.frameOrder
        );
        for (const [frameId, frameData] of batch.entries()) {
          updatedFrames.set(frameId, frameData);
        }
      }
      this.setState({ catalogFrames: updatedFrames });
    } catch (error) {
      console.error('Failed to load catalog frames:', error);
    } finally {
      this.setState({ isCatalogLoading: false });
    }
  };

  addCatalogAnimation = (animationMetadata) => {
    if (this.state.metadataArray.some(metadata => metadata.animationID === animationMetadata.animationID)) {
      return;
    }

    const frameData = new Map();
    for (const frameId of animationMetadata.frameOrder) {
      const frame = this.state.catalogFrames.get(frameId);
      if (frame) {
        frameData.set(frameId, frame);
      }
    }

    if (frameData.size !== animationMetadata.frameOrder.length) {
      console.warn('Unable to add catalog animation due to missing frames:', animationMetadata.animationID);
      return;
    }

    const metadataCopy = {
      animationID: animationMetadata.animationID,
      frameDuration: animationMetadata.frameDuration,
      repeatCount: animationMetadata.repeatCount,
      frameOrder: [...animationMetadata.frameOrder],
    };

    this.addAnimation(metadataCopy, frameData);
  };

  removeCatalogAnimationLocally = (animationID) => {
    this.setState((prevState) => {
      const animationToRemove = prevState.catalogAnimations.find((animation) => animation.animationID === animationID);
      if (!animationToRemove) {
        return null;
      }

      const updatedAnimations = prevState.catalogAnimations.filter((animation) => animation.animationID !== animationID);
      const updatedFrames = new Map(prevState.catalogFrames);
      (animationToRemove.frameOrder || []).forEach((frameId) => {
        updatedFrames.delete(frameId);
      });

      return { catalogAnimations: updatedAnimations, catalogFrames: updatedFrames };
    });
  };

  archiveCatalogAnimation = async (animationID) => {
    const isQueued = this.state.metadataArray.some((metadata) => metadata.animationID === animationID);
    const confirmation = window.confirm(
      isQueued
        ? 'This animation is currently in the active queue. Archiving will remove it from the catalog but it will remain queued. Continue?'
        : 'Archive this animation? It will be removed from the catalog but retained for safekeeping.'
    );

    if (!confirmation) {
      return;
    }

    try {
      await archiveCatalogAnimationOnServer(animationID);
      this.removeCatalogAnimationLocally(animationID);
    } catch (error) {
      console.error('Failed to archive catalog animation:', error);
      window.alert('Failed to archive animation. Please try again.');
    }
  };

  deleteCatalogAnimation = async (animationID) => {
    const isQueued = this.state.metadataArray.some((metadata) => metadata.animationID === animationID);
    const confirmation = window.confirm(
      isQueued
        ? 'This animation is currently in the active queue. Deleting removes it from the catalog forever but keeps the queued copy. Continue?'
        : 'Permanently delete this animation from the catalog? This action cannot be undone.'
    );

    if (!confirmation) {
      return;
    }

    try {
      await deleteCatalogAnimationFromServer(animationID);
      this.removeCatalogAnimationLocally(animationID);
    } catch (error) {
      console.error('Failed to delete catalog animation:', error);
      window.alert('Failed to delete animation. Please try again.');
    }
  };

  /**
   * Adds a new animation to the state.
   *
   * @param {Object} newAnimationMetadata - The metadata of the new animation.
   * @param {Map<string,Uint8Array} newFrameData - The frame data of the new animation.
   */
  addAnimation = (newAnimationMetadata, newFrameData) => {
    this.setState(prevState => {
      // Add the new animation's metadata to the beginning of the metadata array
      const newMetadata = [newAnimationMetadata, ...prevState.metadataArray];

      // create a new Map with the new frame data
      const newFrames = new Map(prevState.frames);
      for (const [frameId, frameData] of newFrameData.entries()) {
        newFrames.set(frameId, frameData);
      }

      // replace the state with the new metadata and frames
      return { metadataArray: newMetadata, frames: newFrames, hasUnsavedChanges: true };
    });
  }

  /**
   * Removes an animation from the state.
   * 
   * @param {string} animationID - The ID of the animation to remove.
   */
  removeAnimation = (animationID) => {
    this.setState(prevState => {
      // remove all the frames in an animation from the frames Map
      const newMetadata = prevState.metadataArray.filter(animation => animation.animationID !== animationID);

      // create a new Map with the frames that are not in the removed animation
      const newFrames = new Map(prevState.frames);
      for (const animation of prevState.metadataArray) {
        if (animation.animationID === animationID) {
          for (const frameId of animation.frameOrder) {
            newFrames.delete(frameId);
          }
        }
      }
      return { metadataArray: newMetadata, frames: newFrames, hasUnsavedChanges: true };
    });
  }

  rearrangeAnimations = (newAnimationOrder) => {
    this.setState({ metadataArray: newAnimationOrder, hasUnsavedChanges: true });
  }

  /**
   * Rearranges the frames of an animation in the state.
   * 
   * @param {string} animationID - The ID of the animation.
   * @param {string[]} newFrameOrder - The new order of frames in the given animation.
   */
  rearrangeFrames = (animationID, newFrameOrder) => {
    this.setState(prevState => {
      const newMetadata = prevState.metadataArray.map(metadata => {
        if (metadata.animationID === animationID) {
          // Replace the frame order for this animation
          return { ...metadata, frameOrder: newFrameOrder };
        } else {
          return metadata;
        }
      });
      return { metadataArray: newMetadata, hasUnsavedChanges: true };
    });
  }

  /**
   * Updates the metadata of the animation with the given ID.
   * 
   * @param {string} animationID - The ID of the animation to update.
   * @param {Object} newMetadata - The new metadata for the animation.
   */
  updateMetadata = (animationID, newMetadata) => {
    if (!newMetadata.animationID || !newMetadata.frameDuration || !newMetadata.repeatCount || !newMetadata.frameOrder) {
      console.error('Invalid metadata:', newMetadata);
      return;
    }
    this.setState(prevState => {
      const newMetadataArray = prevState.metadataArray.map(metadata => {
        if (metadata.animationID === animationID) {
          return newMetadata;
        } else {
          return metadata;
        }
      });
      return { metadataArray: newMetadataArray, hasUnsavedChanges: true };
    });
  }

  sendStateToServer = () => {
    sendStateToServer(this.state.metadataArray, this.state.frames);
    this.setState({ hasUnsavedChanges: false });
  }

  render() {
    const {
      metadataArray,
      frames,
      isLoading,
      activeAnimationID,
      modalOpen,
      catalogAnimations,
      catalogFrames,
      isCatalogOpen,
      isCatalogLoading,
    } = this.state;
    const activeMetadata = activeAnimationID ? metadataArray.find(metadata => metadata.animationID === activeAnimationID) : {};
    const queuedAnimationIDs = new Set(metadataArray.map(metadata => metadata.animationID));

    return (
      <div className="container">
        <Header
          sendStateToServer={this.sendStateToServer}
          openModalForNewAnimation={this.openModalForNewAnimation}
          hasUnsavedChanges={this.state.hasUnsavedChanges}
          openCatalog={this.openCatalog}
        />
        <div className="AnimationContainer">
          <AnimationContainer
            metadataArray={metadataArray}
            frames={frames}
            isLoading={isLoading}
            removeAnimation={this.removeAnimation}
            rearrangeAnimations={this.rearrangeAnimations}
            rearrangeFrames={this.rearrangeFrames}
            setActiveAnimationID={this.openModalForEditAnimation}
          />
        </div>
        {modalOpen && (
          <Modal
            metadata={activeMetadata}
            frames={activeAnimationID ? frames : new Map()}
            closeModal={this.closeModal}
            updateMetadata={this.updateMetadata}
            addAnimation={this.addAnimation}
            isNewAnimation={!activeAnimationID}
          />
        )}
        {isCatalogOpen && (
          <CatalogModal
            animations={catalogAnimations}
            frames={catalogFrames}
            queueAnimationIDs={queuedAnimationIDs}
            onClose={this.closeCatalog}
            onAddToQueue={this.addCatalogAnimation}
            onArchiveAnimation={this.archiveCatalogAnimation}
            onDeleteAnimation={this.deleteCatalogAnimation}
            isLoading={isCatalogLoading}
          />
        )}
      </div>
    );
  }
}

export default App;