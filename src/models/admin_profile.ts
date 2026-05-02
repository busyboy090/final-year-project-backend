import { Model, DataTypes } from 'sequelize';
import type { 
  Sequelize, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional,
  NonAttribute
} from 'sequelize';
import { User } from './user.ts';
import { Faculty } from './faculty.ts';
import { Department } from './department.ts';

export class AdminProfile extends Model<InferAttributes<AdminProfile>, InferCreationAttributes<AdminProfile>> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare department_id: number | null;
  declare faculty_id: number | null;
  declare is_super_admin: boolean;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Associations (Virtual Fields)
  declare user?: NonAttribute<User>;
  declare faculty?: NonAttribute<Faculty>;
  declare department?: NonAttribute<Department>;

  static associate(models: any) {
    // Links back to the central User account
    AdminProfile.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Determines scope of administrative authority
    AdminProfile.belongsTo(models.Faculty, {
      foreignKey: 'faculty_id',
      as: 'faculty'
    });

    AdminProfile.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department'
    });
  }
}

export default (sequelize: Sequelize) => {
  AdminProfile.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        }
      },
      faculty_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'faculties',
          key: 'id'
        }
      },
      is_super_admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'AdminProfile',
      tableName: 'admin_profiles',
      underscored: true,
      timestamps: true,
    }
  );

  return AdminProfile;
};