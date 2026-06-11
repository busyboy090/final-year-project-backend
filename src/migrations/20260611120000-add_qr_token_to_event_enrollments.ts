"use strict";

import { DataTypes, Sequelize } from "sequelize";
import type { QueryInterface } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    // Add persistent qr_token and qr_issued_at columns to event_enrollments
    await queryInterface.addColumn("event_enrollments", "qr_token", {
      type: DataTypes.STRING(128),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn("event_enrollments", "qr_issued_at", {
      type: DataTypes.DATE,
      allowNull: true,
    });

    // Index for quick lookup by token
    await queryInterface.addIndex("event_enrollments", ["qr_token"], {
      name: "idx_event_enrollments_qr_token",
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex(
      "event_enrollments",
      "idx_event_enrollments_qr_token",
    );
    await queryInterface.removeColumn("event_enrollments", "qr_issued_at");
    await queryInterface.removeColumn("event_enrollments", "qr_token");
  },
};
