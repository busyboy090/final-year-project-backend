import { Organisation } from './organisation.ts';
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
  declare organisation_id: number;
  declare user_id: number;

  // Associations
  declare user?: NonAttribute<User>;
  declare organisation?: NonAttribute<Organisation>;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  static associate(models: any) {
    // Links to the core User credentials
    EventOrganiserProfile.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    EventOrganiserProfile.belongsTo(models.Organisation, {
      foreignKey: "organisation_id",
      as: "organisation"
    })
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
      organisation_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "organisations",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
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
