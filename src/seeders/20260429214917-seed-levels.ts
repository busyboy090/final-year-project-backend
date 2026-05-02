'use strict';

import { QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date();

    await queryInterface.bulkInsert('levels', [
      { name: '100 Level', code: '100L', category: "under-grade", created_at: now, updated_at: now },
      { name: '200 Level', code: '200L', category: "under-grade", created_at: now, updated_at: now },
      { name: '300 Level', code: '300L', category: "under-grade", created_at: now, updated_at: now },
      { name: '400 Level', code: '400L', category: "under-grade", created_at: now, updated_at: now },
      { name: '500 Level', code: '500L', category: "under-grade", created_at: now, updated_at: now },
      { name: 'Postgraduate', code: 'PG', category: "post-grade", created_at: now, updated_at: now },
      { name: 'Alumni', code: 'ALUM', category: "alumni", created_at: now, updated_at: now }
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('levels', {}, {});
  }
};