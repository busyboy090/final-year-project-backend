import { Model, DataTypes } from 'sequelize';
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute
} from 'sequelize';
import { Venue } from './venue.ts';

export class Facility extends Model<InferAttributes<Facility>, InferCreationAttributes<Facility>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: string | null;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Associations (Virtual Fields)
  declare venues?: NonAttribute<Venue[]>; // Array of venues for multi-role support

  static associate(models: any) {
    // 1. Many-to-Many Association with Roles
    Facility.belongsToMany(models.Venue, {
      through: models.VenueFacility,
      foreignKey: 'facility_id',
      otherKey: 'venue_id',
      as: 'venues' // This allows facility.venues access
    });
  }
}

export default (sequelize: Sequelize) => {
  Facility.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Facility',
      tableName: 'facilities',
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Facility;
};