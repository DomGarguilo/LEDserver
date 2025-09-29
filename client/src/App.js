import { Component } from "react";
import AnimationContainer from './components/AnimationContainer';
import {
  fetchMetadataFromServer,
  fetchFramesRawFromServer,
  sendStateToServer,
  fetchCatalogFromServer,
  archiveCatalogAnimationOnServer,
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
      loadingStatus: {},
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

      const loadingStatus = {};
      for (const metadata of metadataList) {
        loadingStatus[metadata.animationID] = { status: 'loading' };
      }

      this.setState({
        metadataArray: metadataList,
        frames: new Map(),
        isLoading: false,
        loadingStatus,
        activeAnimationID: null,
        catalogAnimations: catalogList,
      }, () => {
        this.prefetchAnimationFrames(metadataList);
      });
    } catch (error) {
      console.error('Failed to initialize app data:', error);
      this.setState({ isLoading: false });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  prefetchAnimationFrames = (metadataList) => {
    for (const metadata of metadataList) {
      this.loadFramesForAnimation(metadata);
    }
  };

  loadFramesForAnimation = async (metadata) => {
    try {
      const batch = await fetchFramesRawFromServer(metadata.animationID, metadata.frameOrder);
      this.setState(prevState => {
        const frames = new Map(prevState.frames);
        for (const [frameId, frameData] of batch.entries()) {
          frames.set(frameId, frameData);
        }
        return {
          frames,
          loadingStatus: {
            ...prevState.loadingStatus,
            [metadata.animationID]: { status: 'ready' }
          }
        };
      });
    } catch (error) {
      console.error(`Failed to load frames for animation ${metadata.animationID}:`, error);
      this.setState(prevState => ({
        loadingStatus: {
          ...prevState.loadingStatus,
          [metadata.animationID]: {
            status: 'error',
            message: error && error.message ? error.message : 'Failed to load frames'
          }
        }
      }));
    }
  };

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
    await this.refreshCatalogAnimations();
  };

  closeCatalog = () => {
    this.setState({ isCatalogOpen: false });
  };

  refreshCatalogAnimations = async () => {
    this.setState({ isCatalogLoading: true });
    try {
      const catalogList = await fetchCatalogFromServer();
      const activeIds = new Set(this.state.metadataArray.map((meta) => meta.animationID));
      const filteredCatalog = catalogList.filter((animation) => !activeIds.has(animation.animationID));
      this.setState({ catalogAnimations: filteredCatalog });
      await this.ensureCatalogFramesLoaded(filteredCatalog);
    } catch (error) {
      console.error('Failed to refresh catalog:', error);
    } finally {
      this.setState({ isCatalogLoading: false });
    }
  };

  ensureCatalogFramesLoaded = async (animations = this.state.catalogAnimations) => {
    const { catalogFrames } = this.state;
    const framesToFetch = animations.filter((animation) => {
      if (!animation.frameOrder || animation.frameOrder.length === 0) {
        return false;
      }
      return animation.frameOrder.some((frameId) => !catalogFrames.has(frameId));
    });

    if (framesToFetch.length === 0) {
      return;
    }

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

    this.setState((prevState) => ({
      catalogAnimations: prevState.catalogAnimations.filter((animation) => animation.animationID !== animationMetadata.animationID),
    }));
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
    const queuedAnimation = this.state.metadataArray.find((metadata) => metadata.animationID === animationID);

    if (queuedAnimation) {
      this.removeAnimation(animationID);
    }

    try {
      await archiveCatalogAnimationOnServer(animationID);
      this.removeCatalogAnimationLocally(animationID);
    } catch (error) {
      console.error('Failed to archive catalog animation:', error);
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
      return {
        metadataArray: newMetadata,
        frames: newFrames,
        loadingStatus: {
          ...prevState.loadingStatus,
          [newAnimationMetadata.animationID]: { status: 'ready' }
        },
        hasUnsavedChanges: true
      };
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
      const { [animationID]: _removedStatus, ...restStatus } = prevState.loadingStatus;
      return {
        metadataArray: newMetadata,
        frames: newFrames,
        loadingStatus: restStatus,
        hasUnsavedChanges: true
      };
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
            loadingStatus={this.state.loadingStatus}
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
            onRemoveFromQueue={this.removeAnimation}
            isLoading={isCatalogLoading}
          />
        )}
      </div>
    );
  }
}

export default App;
