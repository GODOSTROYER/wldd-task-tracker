import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config';

interface WorkspaceAttrs { id: string; name: string; ownerId: string; }
type CreateAttrs = Optional<WorkspaceAttrs, 'id'>;
class Workspace extends Model<WorkspaceAttrs, CreateAttrs> implements WorkspaceAttrs { declare id: string; declare name: string; declare ownerId: string; }

Workspace.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  ownerId: { type: DataTypes.UUID, allowNull: false },
}, { sequelize, tableName: 'workspaces' });

export default Workspace;
