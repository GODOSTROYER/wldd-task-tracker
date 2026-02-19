import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'completed';
  color?: string;
  position: number;
  dueDate?: Date;
  owner: Types.ObjectId;
  workspaceId: Types.ObjectId;
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
        values: ['todo', 'in-progress', 'in-review', 'completed'],
        message: 'Status must be one of: todo, in-progress, in-review, completed',
      },
      default: 'todo',
    },
    position: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    color: {
      type: String,
      default: null,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
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
