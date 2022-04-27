require('dotenv').config();

const mongoose = require('mongoose');
const mongoPW = process.env.DATABASE_PW;
const mongoPath = `mongodb+srv://domgarguilo:${mongoPW}@led-matrix-server.20lyz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

module.exports = async () => {
  await mongoose.connect(mongoPath, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  return mongoose;
};