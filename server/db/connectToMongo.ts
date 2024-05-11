require('dotenv').config();

import mongoose from 'mongoose';

const mongoPath = process.env.DATABASE_URL;

if (!mongoPath) {
  console.error('No mongo path found in .env file');
  process.exit(1);
}

const connectToMongo = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoPath);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  return mongoose;
};

export default connectToMongo;
