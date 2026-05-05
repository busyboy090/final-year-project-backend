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

export class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare thumbnail: string;
  declare organizer: string;
  declare department: string | null;
  declare venue: number;
  declare start_date: Date;
  declare end_date: Date;
  declare capacity: number;
  declare created_by: number;
  declare status: 'pending' | 'approved' | 'rejected';

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
      foreignKey: 'venue',
      as: 'eventVenue'
    });

    Event.belongsToMany(models.User, { 
      through: models.EventEnrollment, 
      foreignKey: 'event_id', 
      otherKey: 'user_id',
      as: 'attendees' 
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
      thumbnail: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      organizer: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      department: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      venue: {
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
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
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