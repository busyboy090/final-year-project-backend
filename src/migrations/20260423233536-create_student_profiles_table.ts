'use strict';

import { DataTypes, Sequelize } from 'sequelize';

// Types
import type { QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('student_profiles', {
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

      matric_no: {
        type: DataTypes.STRING,
        allowNull: false
      },

      department_id:{
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          key: "id",
          model: "departments"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },

      level_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          key: "id",
          model: "levels"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      },

      gender: {
        type: DataTypes.ENUM("male","female","other"),
        allowNull: false
      },

      title: {
        type: DataTypes.STRING,
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
    await queryInterface.dropTable('student_profiles');
  },
};