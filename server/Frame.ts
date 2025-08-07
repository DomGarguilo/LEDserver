export class Frame {
    frameID: string;
    data: Uint8Array;

    //TODO: add validation for data
    constructor(frameID: string, data: Uint8Array) {
        this.frameID = frameID;
        this.data = data;
    }
}