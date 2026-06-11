"use strict";

import { DataTypes } from "sequelize";
import type { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("event_enrollments", "reminder_sent_at", {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex("event_enrollments", ["reminder_sent_at"], {
      name: "idx_event_enrollments_reminder_sent_at",
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex(
      "event_enrollments",
      "idx_event_enrollments_reminder_sent_at",
    );
    await queryInterface.removeColumn("event_enrollments", "reminder_sent_at");
  },
};
