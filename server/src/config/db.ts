import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/mini-task-tracker';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

export default connectDB;
