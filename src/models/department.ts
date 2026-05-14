import { Model, DataTypes } from 'sequelize';
import type { 
  Sequelize, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional,
  NonAttribute
} from 'sequelize';
import { Faculty } from './faculty.ts';

export class Department extends Model<InferAttributes<Department>, InferCreationAttributes<Department>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare code: string;
  declare faculty_id: number;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Association (Virtual Field)
  declare faculty?: NonAttribute<Faculty>;

  static associate(models: any) {
    // A Department belongs to a single Faculty
    Department.belongsTo(models.Faculty, {
      foreignKey: 'faculty_id',
      as: 'faculty',
      onDelete: 'CASCADE'
    });

    // A Department can have many student profiles
    Department.hasMany(models.StudentProfile, {
      foreignKey: 'department_id',
      as: 'student'
    });

    // A Department can have many staff members
    Department.hasMany(models.StaffProfile, {
      foreignKey: 'department_id',
      as: 'staff'
    });
  }
}

export default (sequelize: Sequelize) => {
  Department.init(
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
      faculty_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'faculties',
          key: 'id'
        }
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Department',
      tableName: 'departments',
      underscored: true,
      timestamps: true,
    }
  );

  return Department;
};