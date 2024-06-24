const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect(
    'mongodb+srv://bob123:bob123@cluster0.kugpsyk.mongodb.net/'
  );

  console.log('db connected');
};

module.exports = connectDB;
