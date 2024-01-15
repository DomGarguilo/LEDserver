require('dotenv').config();

import mongoose from 'mongoose';

const mongoPath = process.env.DATABASE_URL;

if (!mongoPath) {
  console.error('No mongo path found in .env file');
  process.exit(1);
}

const connectToMongo = async () => {
  try {
    mongoose.connect(mongoPath);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  return mongoose;
};

export default connectToMongo;
