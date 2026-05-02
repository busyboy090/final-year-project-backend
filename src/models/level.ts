import { Model, DataTypes } from 'sequelize';
import type { 
  Sequelize, 
  InferAttributes, 
  InferCreationAttributes, 
  CreationOptional 
} from 'sequelize';

export class Level extends Model<InferAttributes<Level>, InferCreationAttributes<Level>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare code: string;
  declare category: "under-grade" | "post-grade" | "alumni" | "pre-degree";

  // Timestamps
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  // static associate(models: any) {
  //   // A level might be associated with student profiles or specific event restrictions
  //   // Example: Level.hasMany(models.StudentProfile, { foreignKey: 'level_id', as: 'students' });
  // }
}

export default (sequelize: Sequelize) => {
  Level.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      category: {
        type: DataTypes.ENUM("under-grade","post-grade","alumni","pre-degree"),
        allowNull: false
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'Level',
      tableName: 'levels',
      underscored: true,
      timestamps: true,
    }
  );

  return Level;
};