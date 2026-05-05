'use strict';

import { DataTypes, Sequelize } from 'sequelize';

// Types
import type { QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('venue_facilities', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      venue_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'venues',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      facility_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'facilities',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: "CASCADE"
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
      }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('venue_facilities');
  },
};