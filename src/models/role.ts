import { Model, DataTypes } from 'sequelize';
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute
} from 'sequelize';
import { UserRole } from './user_role.ts';
import { Permission } from './permission.ts';
import { User } from './user.ts';

export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare code: string;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Associations
  declare user_roles?: NonAttribute<UserRole[]>;
  declare permissions?: NonAttribute<Permission[]>;
  declare users?: NonAttribute<User[]>;

  static associate(models: any) {
    // 1. Many-to-Many link to Users
    Role.belongsToMany(models.User, {
      through: models.UserRole,
      foreignKey: 'role_id',
      otherKey: 'user_id',
      as: 'users'
    });

    // 2. Many-to-Many link to Permissions via junction table
    Role.belongsToMany(models.Permission, {
      through: models.RolePermission,
      foreignKey: 'role_id',
      otherKey: 'permission_id',
      as: 'permissions'
    });

    // 3. Junction table link for administrative auditing
    Role.hasMany(models.RolePermission, {
      foreignKey: 'role_id',
      as: 'role_permissions'
    });

    // 4. Direct link to UserRoles for RBAC checks
    Role.hasMany(models.UserRole, {
      foreignKey: 'role_id',
      as: 'user_roles'
    });
  }
}

export default (sequelize: Sequelize) => {
  Role.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Role',
      tableName: 'roles',
      underscored: true,
      timestamps: true,
    }
  );

  return Role;
};