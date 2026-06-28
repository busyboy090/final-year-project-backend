import { Model, DataTypes } from 'sequelize';
import type { 
  Sequelize, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional,
  NonAttribute
} from 'sequelize';
import { Faculty } from './faculty.ts';
import type { DepartmentType } from '../types/department.d.ts';
import { Organisation } from './organisation.ts';

export class Department extends Model<InferAttributes<Department>, InferCreationAttributes<Department>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare code: string;
  declare type: DepartmentType;
  declare faculty_id: number;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Association (Virtual Field)
  declare faculty?: NonAttribute<Faculty>;
  declare organisations?: NonAttribute<Organisation>;

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

    // A Department can have many organisation
    Department.hasMany(models.Organisation, {
      foreignKey: 'department_id',
      as: 'organisations'
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
      type: {
        type:  DataTypes.ENUM("Academic","Administrative","Student Union","Support Unit","Research Unit"),
        allowNull: false,
        defaultValue: "Academic"
      },
      faculty_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Department;
};
