'use strict';

import { DataTypes, Sequelize } from 'sequelize';
import type { QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('permissions', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      // The unique code name used in middleware (e.g., 'edit_repository')
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      // A friendly description for the admin dashboard
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Grouping permissions (e.g., 'event_management', 'user_management')
      module: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('permissions');
  },
};