'use strict';

import { DataTypes, Sequelize } from 'sequelize';

// Types
import type { QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('admin_profiles', {
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
          model: "users"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },

      department_id:{
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          key: "id",
          model: "departments"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },

      faculty_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          key: "id",
          model: "faculties"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },

      is_super_admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false
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
    await queryInterface.dropTable('admin_profiles');
  },
};