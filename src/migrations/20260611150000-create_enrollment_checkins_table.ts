"use strict";

import { DataTypes, Sequelize } from "sequelize";
import type { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("enrollment_checkins", {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      enrollment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "event_enrollments", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      scanner_id: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      checked_in_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("enrollment_checkins", ["enrollment_id"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("enrollment_checkins");
  },
};
