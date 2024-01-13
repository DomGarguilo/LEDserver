export class Frame {
    frameID: string;
    animationID: string;
    data: Uint8Array;

    //TODO: add validation for data
    constructor(frameID: string, animationID: string, data: Uint8Array) {
        this.frameID = frameID;
        this.animationID = animationID;
        this.data = data;
    }
}