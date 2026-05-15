import { Model, DataTypes } from "sequelize";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from "sequelize";
import { getGravatarUrl } from "../utils/gravatar.ts";

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare first_name: string;
  declare last_name: string;
  declare email: string;
  declare password: string | null;
  declare email_verified: boolean;
  declare is_active: boolean;
  declare role: "super-admin" | "event-organiser" | "staff" | "student";
  declare profile_picture_url: string | null;
  declare two_factor_secret: string | null;
  declare two_factor_enabled: boolean;
  declare two_factor_recovery_codes: string | null;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // Associations (Virtual Fields)
  declare studentProfile?: NonAttribute<any>;
  declare staffProfile?: NonAttribute<any>;
  declare eventOrganiserProfile?: NonAttribute<any>;

  static associate(models: any) {
    // 3. Profile Associations (1:1)
    User.hasOne(models.StudentProfile, {
      foreignKey: "user_id",
      as: "studentProfile",
    });

    User.hasOne(models.StaffProfile, {
      foreignKey: "user_id",
      as: "staffProfile",
    });

    User.hasOne(models.EventOrganiserProfile, {
      foreignKey: "user_id",
      as: "eventOrganiserProfile",
    });

    // User <-> Event (Many-to-Many)
    User.belongsToMany(models.Event, {
      through: models.EventEnrollment,
      foreignKey: "user_id",
      otherKey: "event_id",
      as: "enrolledEvents",
    });
  }
}

export default (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profile_picture_url: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
        get() {
          const email = this.getDataValue("email");
          if (!email) return null;

          return getGravatarUrl(email);
        },
      },
      role: {
        type: DataTypes.ENUM("admin", "organiser", "staff", "student"),
        allowNull: false,
        defaultValue: "student",
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      two_factor_secret: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      two_factor_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      two_factor_recovery_codes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      underscored: true,
      timestamps: true,
      defaultScope: {
        attributes: {
          exclude: [
            "password",
            "two_factor_secret",
            "two_factor_recovery_codes",
          ],
        },
      },
      scopes: {
        withSecrets: {
          attributes: {
            include: ["password", "two_factor_secret"],
          },
        },
      },
    },
  );

  return User;
};
