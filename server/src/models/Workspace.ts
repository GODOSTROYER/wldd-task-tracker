/**
 * @file models/Workspace.ts — Mongoose Workspace schema and model
 *
 * Workspaces group tasks together. Each workspace has an owner and a members
 * array for future collaboration features.
 *
 * Exports: Workspace model, IWorkspace interface
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

const Workspace = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
export default Workspace;
