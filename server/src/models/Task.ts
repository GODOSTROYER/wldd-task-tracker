import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  status: 'pending' | 'completed';
  dueDate?: Date;
  owner: Types.ObjectId;
  createdAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'completed'],
        message: 'Status must be either pending or completed',
      },
      default: 'pending',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

// PRD-required indexes
TaskSchema.index({ owner: 1 });
TaskSchema.index({ status: 1 });

const Task = mongoose.model<ITask>('Task', TaskSchema);
export default Task;
