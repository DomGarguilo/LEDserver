import crypto from 'crypto';

export const genFrameID = (length: number): string => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').substring(0, length);
};

export const hashString = (str: string): string => {
  const hash = crypto.createHash('sha256');
  hash.update(str);
  return hash.digest('hex');
}