import { Model, DataTypes } from "sequelize";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

export class EnrollmentCheckin extends Model<
  InferAttributes<EnrollmentCheckin>,
  InferCreationAttributes<EnrollmentCheckin>
> {
  declare id: CreationOptional<number>;
  declare enrollment_id: number;
  declare scanner_id: string | null;
  declare checked_in_at: Date;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  static associate(models: any) {
    EnrollmentCheckin.belongsTo(models.EventEnrollment, {
      foreignKey: "enrollment_id",
      as: "enrollment",
    });
  }
}

export default (sequelize: Sequelize) => {
  EnrollmentCheckin.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      enrollment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "event_enrollments", key: "id" },
      },
      scanner_id: { type: DataTypes.STRING(128), allowNull: true },
      checked_in_at: { type: DataTypes.DATE, allowNull: false },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "EnrollmentCheckin",
      tableName: "enrollment_checkins",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return EnrollmentCheckin;
};
