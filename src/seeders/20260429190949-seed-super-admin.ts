'use strict';

import { QueryInterface } from 'sequelize';
import bcrypt from 'bcrypt'; // Ensure bcrypt is installed: npm install bcrypt

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    // Hash the password before seeding
    const hashedPassword = await bcrypt.hash('Admin@ADUN2026', 12);
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        first_name: 'System',
        last_name: 'Administrator',
        email: 'admin@adun-ems.name.ng',
        role: "super-admin",
        password: hashedPassword,
        two_factor_enabled: true,
        email_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      }
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('users', { email: 'admin@adun-ems.name.ng' }, {});
  }
};