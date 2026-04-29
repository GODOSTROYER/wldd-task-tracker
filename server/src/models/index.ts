import User from './User';
import Workspace from './Workspace';
import Task from './Task';

User.hasMany(Workspace, { foreignKey: 'ownerId', as: 'workspaces', onDelete: 'CASCADE' });
Workspace.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(Task, { foreignKey: 'ownerId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Workspace.hasMany(Task, { foreignKey: 'workspaceId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Workspace, { foreignKey: 'workspaceId', as: 'workspace' });

export { Task, User, Workspace };
