import { Model, DataTypes } from 'sequelize';
import type { 
  Sequelize, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional,
  NonAttribute
} from 'sequelize';
import { Event } from './event.ts';
import { VenueFacility } from './venue_facility.ts';
import { Facility } from './facility.ts';

export class Venue extends Model<InferAttributes<Venue>, InferCreationAttributes<Venue>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare type: 'hall' | 'outdoor' | 'classroom' | 'auditorium' | 'lab';
  declare capacity: number;
  declare status: 'available' | 'maintenance' | 'occupied';
  declare location: string;
  declare images: string[];
  declare thumbnail: string | null;
  
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Associations (Virtual Fields)
  declare events?: NonAttribute<Event[]>;
  declare venueFacilities?: NonAttribute<VenueFacility[]>;
  declare facilities?: NonAttribute<Facility[]>;

  static associate(models: any) {
    // One venue can host many events
    Venue.hasMany(models.Event, {
      foreignKey: 'venue',
      as: 'events'
    });

    // Many-to-Many: Venue ↔ Facility through VenueFacility
    Venue.hasMany(models.VenueFacility, {
      foreignKey: 'venue_id',
      as: 'venueFacilities'
    });

    Venue.belongsToMany(models.Facility, {
      through: models.VenueFacility,
      foreignKey: 'venue_id',
      otherKey: 'facility_id',
      as: 'facilities'
    });
  }
}

export default (sequelize: Sequelize) => {
  Venue.init(
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
      type: {
        type: DataTypes.ENUM('hall', 'outdoor', 'classroom', 'auditorium', 'lab'),
        allowNull: false,
        defaultValue: 'hall',
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM('available', 'maintenance', 'occupied'),
        allowNull: false,
        defaultValue: 'available',
      },
      location: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: [],
      },
      thumbnail: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Venue',
      tableName: 'venues',
      underscored: true,
      timestamps: true,
    }
  );

  return Venue;
};