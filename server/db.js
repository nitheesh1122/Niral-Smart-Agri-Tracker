const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://Tharunkumar:MTK%4012b28@freshgoods.7azz85x.mongodb.net/PERISENSE?retryWrites=true&w=majority&appName=FreshGoods',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 20, // 🔧 Connection pool size
      }
    );
    console.log('✅ MongoDB Connected to PERISENSE Cluster');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
