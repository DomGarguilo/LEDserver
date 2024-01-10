require('dotenv').config();

const mongoose = require('mongoose');

const mongoPath = process.env.DATABASE_URL;

module.exports = async () => {
  try {
    mongoose.connect(mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  return mongoose;
};