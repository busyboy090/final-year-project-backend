import { Model, DataTypes } from 'sequelize';
import type { 
  Sequelize, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional,
  NonAttribute
} from 'sequelize';
import { User } from './user.ts';
import { Venue } from './venue.ts';
import type { EventCategory, EventStatus } from '../types/event.d.ts';

export class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare description: string;
  declare duration: number;
  declare category: EventCategory;
  declare thumbnail: string;
  declare organisation_id: number | null;
  declare venue_id: number;
  declare start_date: Date;
  declare end_date: Date;
  declare capacity: number;
  declare created_by: number;
  declare status: EventStatus;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Associations (Virtual Fields)
  declare creator?: NonAttribute<User>;
  declare eventVenue?: NonAttribute<Venue>;

  static associate(models: any) {
    // 1. An event is created by a user (Staff/Student/Admin)
    Event.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    // 2. An event is held at a specific venue
    Event.belongsTo(models.Venue, {
      foreignKey: 'venue_id',
      as: 'venue'
    });

    Event.belongsToMany(models.User, { 
      through: models.EventEnrollment, 
      foreignKey: 'event_id', 
      otherKey: 'user_id',
      as: 'attendees' 
    });

    Event.belongsTo(models.Organisation, {
      foreignKey: 'organisation_id',
      as: 'organisation'
    });
  }
}

export default (sequelize: Sequelize) => {
  Event.init(
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
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      category: {
        type: DataTypes.ENUM('Academic Conference', 'Workshop', 'Cultural Event', 'Sports Match', 'Exhibition/Expo', 'Social Gathering/Party'),
        allowNull: false
      },
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      organisation_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          key: "id",
          model: "organisations"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },
      venue_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          key: "id",
          model: "venues"
        }
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          key: "id",
          model: "users"
        }
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Event',
      tableName: 'events',
      underscored: true,
      timestamps: true,
    }
  );

  return Event;
};