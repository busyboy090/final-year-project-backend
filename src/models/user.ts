import { Model, DataTypes } from 'sequelize';
import type { 
  Sequelize, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional,
  NonAttribute
} from 'sequelize';
import { Role } from './role.ts'; 

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare first_name: string;
  declare last_name: string;
  declare email: string;
  declare password: string | null;
  declare email_verified: boolean;
  declare is_active: boolean;
  declare profile_picture_url: string | null;
  declare two_factor_secret: string | null;
  declare two_factor_enabled: boolean;
  declare two_factor_recovery_codes: string | null;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Associations (Virtual Fields)
  declare roles?: NonAttribute<Role[]>; // Array of roles for multi-role support
  declare studentProfile?: NonAttribute<any>;
  declare adminProfile?: NonAttribute<any>;
  declare staffProfile?: NonAttribute<any>;

  static associate(models: any) {
    // 1. Many-to-Many Association with Roles
    User.belongsToMany(models.Role, {
      through: models.UserRole,
      foreignKey: 'user_id',
      otherKey: 'role_id',
      as: 'roles' // This allows user.roles access
    });

    // 2. Direct link to UserRole junction table (for administrative tasks)
    User.hasMany(models.UserRole, {
      foreignKey: 'user_id',
      as: 'userRoles'
    });

    // 3. Profile Associations (1:1)
    User.hasOne(models.StudentProfile, {
      foreignKey: 'user_id',
      as: 'studentProfile'
    });

    User.hasOne(models.AdminProfile, {
      foreignKey: 'user_id',
      as: 'adminProfile'
    });

    User.hasOne(models.StaffProfile, {
      foreignKey: 'user_id',
      as: 'staffProfile'
    });
  }
}

export default (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profile_picture_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, 
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      two_factor_secret: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      two_factor_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      two_factor_recovery_codes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true, 
      timestamps: true, 
      defaultScope: {
        attributes: { exclude: ['password', 'two_factor_secret', 'two_factor_recovery_codes'] },
      },
      scopes: {
        withSecrets: { 
          attributes: { 
            include: ['password', 'two_factor_secret'] 
          } 
        },
      }
    }
  );

  return User;
};