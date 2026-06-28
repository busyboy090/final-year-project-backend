import { Model, DataTypes } from 'sequelize';
import type { 
  Sequelize, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional,
  NonAttribute
} from 'sequelize';
import { User } from './user.ts';
import { Department } from './department.ts';
import { Level } from './level.ts';

export class StudentProfile extends Model<InferAttributes<StudentProfile>, InferCreationAttributes<StudentProfile>> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare matric_no: string;
  declare department_id: number | null;
  declare level_id: number | null;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Associations (Virtual Fields)
  declare user?: NonAttribute<User>;
  declare department?: NonAttribute<Department>;
  declare level?: NonAttribute<Level>;

  static associate(models: any) {
    // Linked to the main User account
    StudentProfile.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Linked to academic structures
    StudentProfile.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department'
    });

    StudentProfile.belongsTo(models.Level, {
      foreignKey: 'level_id',
      as: 'level'
    });
  }
}

export default (sequelize: Sequelize) => {
  StudentProfile.init(
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
      matric_no: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        }
      },
      level_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'levels',
          key: 'id'
        }
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'StudentProfile',
      tableName: 'student_profiles',
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return StudentProfile;
};