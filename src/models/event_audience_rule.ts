import { Model, DataTypes } from "sequelize";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";
import type { Event } from "./event.ts";
import type { Level } from "./level.ts";

export class EventAudienceRule extends Model<
  InferAttributes<EventAudienceRule>,
  InferCreationAttributes<EventAudienceRule>
> {
  declare id: CreationOptional<number>;
  declare event_id: number;
  declare role: "staff" | "student";
  declare staff_type: "academic-staff" | "non-academic-staff" | null;
  declare level_id: number | null;
  declare gender: "male" | "female" | "other" | null;

  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare event?: NonAttribute<Event>;
  declare level?: NonAttribute<Level>;

  static associate(models: any) {
    EventAudienceRule.belongsTo(models.Event, {
      foreignKey: "event_id",
      as: "event",
    });

    EventAudienceRule.belongsTo(models.Level, {
      foreignKey: "level_id",
      as: "level",
    });
  }
}

export default (sequelize: Sequelize) => {
  EventAudienceRule.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          key: "id",
          model: "events",
        },
      },
      role: {
        type: DataTypes.ENUM("staff", "student"),
        allowNull: false,
      },
      staff_type: {
        type: DataTypes.ENUM("academic-staff", "non-academic-staff"),
        allowNull: true,
      },
      level_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          key: "id",
          model: "levels",
        },
      },
      gender: {
        type: DataTypes.ENUM("male", "female", "other"),
        allowNull: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "EventAudienceRule",
      tableName: "event_audience_rules",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return EventAudienceRule;
};
