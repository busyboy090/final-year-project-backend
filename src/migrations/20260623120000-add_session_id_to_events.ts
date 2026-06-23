"use strict";

import { DataTypes } from "sequelize";
import type { QueryInterface } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("events", "session_id", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        key: "id",
        model: "academic_sessions",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("events", "session_id");
  },
};
