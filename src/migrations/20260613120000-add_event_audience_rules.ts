"use strict";

import { DataTypes, Sequelize } from "sequelize";
import type { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("events", "audience_scope", {
      type: DataTypes.ENUM("all", "custom"),
      allowNull: false,
      defaultValue: "all",
    });

    await queryInterface.createTable("event_audience_rules", {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          key: "id",
          model: "events",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      role: {
        type: DataTypes.ENUM("staff", "student"),
        allowNull: false,
      },

      staff_type: {
        type: DataTypes.ENUM("academic-staff", "non-academic-staff"),
        allowNull: true,
      },

      level_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          key: "id",
          model: "levels",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

      gender: {
        type: DataTypes.ENUM("male", "female", "other"),
        allowNull: true,
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
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("event_audience_rules");
    await queryInterface.removeColumn("events", "audience_scope");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_event_audience_rules_role";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_event_audience_rules_staff_type";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_event_audience_rules_gender";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_events_audience_scope";',
    );
  },
};
