import { Model, DataTypes } from "sequelize";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";
import { User } from "./user.ts";
import { Event } from "./event.ts";

export class EventEnrollment extends Model<
  InferAttributes<EventEnrollment>,
  InferCreationAttributes<EventEnrollment>
> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare event_id: number;
  declare status: "confirmed" | "cancelled" | "attended";
  declare check_in_time: Date | null;
  declare qr_token: string | null;
  declare qr_issued_at: Date | null;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Associations (Virtual Fields)
  declare user?: NonAttribute<User>;
  declare event?: NonAttribute<Event>;

  static associate(models: any) {
    // 1. An enrollment belongs to a User (Student/Staff)
    EventEnrollment.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    // 2. An enrollment belongs to an Event
    EventEnrollment.belongsTo(models.Event, {
      foreignKey: "event_id",
      as: "event",
    });
  }
}

export default (sequelize: Sequelize) => {
  EventEnrollment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          key: "id",
          model: "users",
        },
      },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          key: "id",
          model: "events",
        },
      },
      status: {
        type: DataTypes.ENUM("confirmed", "cancelled", "attended"),
        allowNull: false,
        defaultValue: "confirmed",
      },
      check_in_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      qr_token: {
        type: DataTypes.STRING(128),
        allowNull: true,
        unique: true,
      },
      qr_issued_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "EventEnrollment",
      tableName: "event_enrollments",
      underscored: true,
      timestamps: true,
    },
  );

  return EventEnrollment;
};
