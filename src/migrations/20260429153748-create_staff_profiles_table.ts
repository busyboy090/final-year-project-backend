'use strict';

import { DataTypes, Sequelize } from 'sequelize';

// Types
import type { QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('staff_profiles', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false
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

      staff_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },

      faculty_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          key: "id",
          model: "faculties"
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
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

      position: {
        type: DataTypes.STRING,
        allowNull: false
      },

      staff_type: {
        type: DataTypes.ENUM("academic-staff","non-academic-staff"),
        allowNull: false
      },

      phone: {
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
    await queryInterface.dropTable('staff_profiles');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_staff_profiles_staff_type";');
  },
};