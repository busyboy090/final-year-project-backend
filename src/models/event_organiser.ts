import { Model, DataTypes } from "sequelize";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";
import { User } from "./user.ts";

export class EventOrganiserProfile extends Model<
  InferAttributes<EventOrganiserProfile>,
  InferCreationAttributes<EventOrganiserProfile>
> {
  declare id: CreationOptional<number>;
  declare organiser_id: CreationOptional<string | null>;
  declare user_id: number;
  declare title: CreationOptional<string | null>;
  declare phone: CreationOptional<string | null>;
  declare organisation: CreationOptional<string | null>;

  // Associations
  declare user?: NonAttribute<User>;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  static associate(models: any) {
    // Links to the core User credentials
    EventOrganiserProfile.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  }
}

export default (sequelize: Sequelize) => {
  EventOrganiserProfile.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      organiser_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      organisation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "EventOrganiserProfile",
      tableName: "event_organiser_profiles",
      underscored: true,
      timestamps: true,
    },
  );

  return EventOrganiserProfile;
};
