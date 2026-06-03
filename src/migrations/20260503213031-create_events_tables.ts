"use strict";

import { DataTypes, Sequelize } from "sequelize";

// Types
import type { QueryInterface } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("events", {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      category: {
        type: DataTypes.ENUM(
          "Academic Conference",
          "Workshop",
          "Cultural Event",
          "Sports Match",
          "Exhibition/Expo",
          "Social Gathering/Party",
        ),
        allowNull: false,
      },

      duration: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      thumbnail: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      organisation_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          key: "id",
          model: "organisations",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

      venue_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          key: "id",
          model: "venues",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          key: "id",
          model: "users",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
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
    await queryInterface.dropTable("events");
  },
};
