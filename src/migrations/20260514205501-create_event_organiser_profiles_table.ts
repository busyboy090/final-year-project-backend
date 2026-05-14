"use strict";
import { DataTypes, Sequelize } from "sequelize";
import type { QueryInterface } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("event_organiser_profiles", {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          key: "id",
          model: "users",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      organiser_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        comment: "Unique identifier assigned to the organiser e.g. ORG-0001",
      },

      title: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "e.g. Mr, Mrs, Dr",
      },

      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      organisation: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Department, club, or unit organizing the event",
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("event_organiser_profiles");
  },
};
