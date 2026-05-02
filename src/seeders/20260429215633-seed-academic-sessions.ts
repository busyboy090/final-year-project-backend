'use strict';

import { QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const now = new Date();

    await queryInterface.bulkInsert('academic_sessions', [
      {
        name: '2024/2025 Academic Session',
        code: '2024/2025',
        start_date: new Date('2024-09-01'),
        end_date: new Date('2025-07-31'),
        is_active: false,
        created_at: now,
        updated_at: now
      },
      {
        name: '2025/2026 Academic Session',
        code: '2025/2026',
        start_date: new Date('2025-09-01'),
        end_date: new Date('2026-07-31'),
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkDelete('academic_sessions', {}, {});
  }
};