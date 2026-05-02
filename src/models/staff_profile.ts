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

export class StaffProfile extends Model<InferAttributes<StaffProfile>, InferCreationAttributes<StaffProfile>> {
  declare id: CreationOptional<number>;
  declare title: string; // e.g., Prof, Dr, Mr, Mrs
  declare user_id: number;
  declare staff_id: string; // Unique Employee ID
  declare faculty_id: number | null;
  declare department_id: number | null;
  declare position: string; // e.g., Dean, HOD, Lecturer I
  declare staff_type: 'academic-staff' | 'non-academic-staff';
  declare phone: string | null;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Associations
  declare user?: NonAttribute<User>;
  declare faculty?: NonAttribute<Faculty>;
  declare department?: NonAttribute<Department>;

  static associate(models: any) {
    // Links to the core User credentials
    StaffProfile.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Academic positioning
    StaffProfile.belongsTo(models.Faculty, {
      foreignKey: 'faculty_id',
      as: 'faculty'
    });

    StaffProfile.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department'
    });
  }
}

export default (sequelize: Sequelize) => {
  StaffProfile.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
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
      staff_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      faculty_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'faculties',
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
      position: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      staff_type: {
        type: DataTypes.ENUM('academic-staff', 'non-academic-staff'),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'StaffProfile',
      tableName: 'staff_profiles',
      underscored: true,
      timestamps: true,
    }
  );

  return StaffProfile;
};