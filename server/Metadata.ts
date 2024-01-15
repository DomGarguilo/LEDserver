export class Metadata {
  animationID: string;
  frameDuration: number;
  repeatCount: number;
  totalFrames: number;
  frameOrder: string[];

  constructor(animationID: string, frameDuration: number, repeatCount: number, totalFrames: number, frameOrder: string[]) {
    this.animationID = animationID;
    this.frameDuration = frameDuration;
    this.repeatCount = repeatCount;
    this.totalFrames = totalFrames;
    this.frameOrder = frameOrder;
  }
}