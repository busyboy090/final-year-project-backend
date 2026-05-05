import { Model, DataTypes } from 'sequelize';
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute
} from 'sequelize';
import { Venue } from './venue.ts';
import { Facility } from './facility.ts';

export class VenueFacility extends Model<InferAttributes<VenueFacility>, InferCreationAttributes<VenueFacility>> {
  declare id: CreationOptional<number>;
  declare venue_id: number;
  declare facility_id: number;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Associations (Virtual Fields)
  declare venue?: NonAttribute<Venue[]>; // Array of venues for multi-role support
  declare facility?: NonAttribute<Facility[]>; // Array of facilities for multi-role support

  static associate(models: any) {
    VenueFacility.belongsTo(models.Venue, { foreignKey: 'venue_id', as: 'venue' });
    VenueFacility.belongsTo(models.Facility, { foreignKey: 'facility_id', as: 'facility' });
  }
}

export default (sequelize: Sequelize) => {
  VenueFacility.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      venue_id: {
        type: DataTypes.INTEGER,
        allowNull: false,   
      },
      facility_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'VenueFacility',
      tableName: 'venue_facilities',
      underscored: true,
      timestamps: true
    }
  );

  return VenueFacility;
};