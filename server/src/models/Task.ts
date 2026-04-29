import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config';

export type TaskStatus = 'pending' | 'completed';
interface TaskAttrs { id: string; title: string; description: string; status: TaskStatus; ownerId: string; workspaceId: string; }
type CreateAttrs = Optional<TaskAttrs, 'id' | 'description' | 'status'>;
class Task extends Model<TaskAttrs, CreateAttrs> implements TaskAttrs {
  declare id: string; declare title: string; declare description: string; declare status: TaskStatus; declare ownerId: string; declare workspaceId: string;
}
Task.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  status: { type: DataTypes.ENUM('pending', 'completed'), allowNull: false, defaultValue: 'pending' },
  ownerId: { type: DataTypes.UUID, allowNull: false },
  workspaceId: { type: DataTypes.UUID, allowNull: false },
}, { sequelize, tableName: 'tasks', indexes: [{ fields: ['ownerId'] }, { fields: ['status'] }] });

export default Task;
