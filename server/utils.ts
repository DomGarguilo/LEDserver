import crypto from 'crypto';

export const genFrameID = (length: number): string => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').substring(0, length);
};