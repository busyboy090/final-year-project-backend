import { Model, DataTypes } from 'sequelize';
import type { 
  Sequelize, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional,
  NonAttribute
} from 'sequelize';
import { Faculty } from './faculty.ts';
import { Department } from './department.ts';

export class Organisation extends Model<InferAttributes<Organisation>, InferCreationAttributes<Organisation>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare faculty_id: number;
  declare department_id: number;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Association (Virtual Field)
  declare department?: NonAttribute<Department>;
  declare faculty?: NonAttribute<Faculty>;

  static associate(models: any) {
    // An Organisation belongs to a single Faculty
    Organisation.belongsTo(models.Faculty, {
      foreignKey: 'faculty_id',
      as: 'faculty',
      onDelete: 'SET NULL'
    });

    // An Organisation belongs to a single Department
    Organisation.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department',
      onDelete: 'SET NULL'
    });

    // An Organisation has many event organiser
    Organisation.hasMany(models.EventOrganiserProfile, {
      foreignKey: 'organisation_id',
      as: 'organisers',
      onDelete: 'CASCADE'
    });

    Organisation.hasMany(models.Event, {
      foreignKey: 'organisation_id',
      as: 'events'
    });
  }
}

export default (sequelize: Sequelize) => {
  Organisation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false
      },

      department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "departments",
          key: "id"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },

      faculty_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "faculties",
          key: "id"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Organisation',
      tableName: 'organisations',
      underscored: true,
      timestamps: true,
    }
  );

  return Organisation;
};