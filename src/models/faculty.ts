import { Model, DataTypes } from 'sequelize';
import type { 
  Sequelize, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional,
  NonAttribute
} from 'sequelize';
import { Department } from './department.ts';
import { StaffProfile } from "./staff_profile.ts"

export class Faculty extends Model<InferAttributes<Faculty>, InferCreationAttributes<Faculty>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare code: string;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Associations
  declare departments?: NonAttribute<Department[]>;
  declare staff?: NonAttribute<StaffProfile[]>;

  static associate(models: any) {
    Faculty.hasMany(models.Department, {
      foreignKey: 'faculty_id',
      as: 'departments'
    });

    Faculty.hasMany(models.StaffProfile, {
      foreignKey: 'faculty_id',
      as: 'staff'
    });

    Faculty.hasMany(models.Organisation, {
      foreignKey: 'faculty_id',
      as: 'organisations'
    });
  }
}

export default (sequelize: Sequelize) => {
  Faculty.init(
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
      modelName: 'Faculty',
      tableName: 'faculties',
      underscored: true,
      timestamps: true,
    }
  );

  return Faculty;
};