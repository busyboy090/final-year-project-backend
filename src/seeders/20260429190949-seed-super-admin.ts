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
        email: 'busayojosiah@gmail.com',
        password: hashedPassword,
        two_factor_enabled: true,
        email_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      }
    ]);

    await queryInterface.bulkInsert('admin_profiles', [
      {
        user_id: 1,
        is_super_admin: true,
        faculty_id: null,
        department_id: null,
        created_at: now,
        updated_at: now,
      }
    ]);

    await queryInterface.bulkInsert("user_roles", [
      {
        user_id: 1,
        role_id: 1,
        created_at: now,
        updated_at: now,
      }
    ])
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('users', { email: 'busayojosiah@gmail.com' }, {});
  }
};