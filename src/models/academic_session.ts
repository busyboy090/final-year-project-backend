import { Model, DataTypes } from 'sequelize';
import type { 
  Sequelize, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional,
} from 'sequelize';

export class AcademicSession extends Model<InferAttributes<AcademicSession>, InferCreationAttributes<AcademicSession>> {
  declare id: CreationOptional<number>;
  declare name: string; // e.g., "2025/2026 Academic Session"
  declare code: string;
  declare start_date: Date;
  declare end_date: Date;
  declare is_active: boolean;

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  static associate(models: any) {
    AcademicSession.hasMany(models.Event, {
      foreignKey: 'session_id',
      as: 'events'
    });
  }
}

export default (sequelize: Sequelize) => {
  AcademicSession.init(
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
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'AcademicSession',
      tableName: 'academic_sessions', // Ensure this matches your migration
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return AcademicSession;
};
