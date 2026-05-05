'use strict';

import { DataTypes, Sequelize } from 'sequelize';
import type { QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('event_enrollments', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },

      // Link to the User (The Student or Staff member)
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Name of the target table
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      // Link to the Event
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'events', // Name of the target table
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      // Enrollment Status
      status: {
        type: DataTypes.ENUM('confirmed', 'cancelled', 'attended'),
        allowNull: false,
        defaultValue: 'confirmed',
      },

      // Integration for Vision Detect: Store when they were spotted
      check_in_time: {
        type: DataTypes.DATE,
        allowNull: true,
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

    /**
     * UNIQUE CONSTRAINT
     * This prevents a student from enrolling in the same event twice.
     * Essential for maintaining clean data in the ADUN-EMS.
     */
    await queryInterface.addConstraint('event_enrollments', {
      fields: ['user_id', 'event_id'],
      type: 'unique',
      name: 'unique_user_event_enrollment'
    });

    // Indexes for faster lookups when generating "My Events" or "Event Attendees" lists
    await queryInterface.addIndex('event_enrollments', ['user_id']);
    await queryInterface.addIndex('event_enrollments', ['event_id']);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('event_enrollments');
  },
};