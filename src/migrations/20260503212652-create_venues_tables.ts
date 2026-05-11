'use strict';

import { DataTypes, Sequelize } from 'sequelize';
import type { QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('venues', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // e.g., 'Hall', 'Outdoor', 'Classroom'
      type: {
        type: DataTypes.ENUM('hall', 'outdoor', 'classroom', 'auditorium', 'lab'),
        allowNull: false,
        defaultValue: 'hall'
      },

      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },

      // Current availability of the venue
      status: {
        type: DataTypes.ENUM('available', 'maintenance', 'occupied'),
        allowNull: false,
        defaultValue: 'available'
      },

      // Detailed description or campus area (e.g., 'Near Faculty of Science')
      location: {
        type: DataTypes.TEXT,
        allowNull: false
      },

      // Array of image URLs for the venue gallery
      images: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: []
      },

      // Single thumbnail image for listing cards
      thumbnail: {
        type: DataTypes.TEXT,
        allowNull: true
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
    await queryInterface.dropTable('venues');
  },
};