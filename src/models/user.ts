import { Model, DataTypes } from 'sequelize';
import type { 
  Sequelize, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional 
} from 'sequelize';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare first_name: string;
  declare last_name: string;
  declare email: string;
  declare password: string | null;
  declare role: 'administrator' | 'organiser' | 'user';
  declare email_verified: boolean;
  declare is_active: boolean;
  declare two_factor_secret: string | null;
  declare two_factor_enabled: boolean;
  declare two_factor_recovery_codes: string | null;

  // static associate(models: any) {
  //   // Associations go here
  // }
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
      role: {
        type: DataTypes.ENUM('administrator', 'organiser', 'user'),
        allowNull: false,
        defaultValue: 'user',
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
        type: DataTypes.TEXT, // Changed to TEXT to support longer strings of codes
        allowNull: true,
      },
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