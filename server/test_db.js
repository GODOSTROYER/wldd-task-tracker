import mongoose from 'mongoose';

async function test() {
  console.log('Connecting to mongoose...');
  await mongoose.connect('mongodb+srv://{username}:{password}@task-tracker.jmyqota.mongodb.net/mini-task-tracker?retryWrites=true&w=majority');
  console.log('Connected! Finding workspaces...');
  try {
    const ws = await mongoose.connection.collection('workspaces').findOne({});
    console.log('Workspaces found:', ws);
  } catch (err) {
    console.error('Find error:', err);
  }
  process.exit(0);
}

test();
