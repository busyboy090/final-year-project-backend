
// Types
import type { QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    // 1. Insert Faculties
    await queryInterface.bulkInsert('faculties', [
      { id: 1, name: 'Faculty of Science', code: 'FOS', created_at: new Date(), updated_at: new Date() },
      { id: 2, name: 'Faculty of Arts, Management and Social Sciences', code: 'FAMSS', created_at: new Date(), updated_at: new Date() },
      { id: 3, name: 'Faculty of Engineering and Technology', code: 'FEET', created_at: new Date(), updated_at: new Date() },
      { id: 4, name: 'Faculty of Maritime Studies', code: 'FMS', created_at: new Date(), updated_at: new Date() },
      { id: 5, name: 'Faculty of Law', code: 'FOL', created_at: new Date(), updated_at: new Date() }
    ]);

    // 2. Insert Departments
    // Using hardcoded IDs here is safer for initial seeding to ensure relationship consistency
    await queryInterface.bulkInsert('departments', [
      // Science (ID: 1)
      { name: 'Software Engineering', code: 'SEN', faculty_id: 1, created_at: new Date(), updated_at: new Date() },
      { name: 'Computer Science', code: 'CSC', faculty_id: 1, created_at: new Date(), updated_at: new Date() },
      { name: 'Cyber Security', code: 'CYS', faculty_id: 1, created_at: new Date(), updated_at: new Date() },
      { name: 'Forensic Science', code: 'FSC', faculty_id: 1, created_at: new Date(), updated_at: new Date() },
      
      // Engineering (ID: 3)
      { name: 'Electrical and Electronics Engineering', code: 'EEE', faculty_id: 3, created_at: new Date(), updated_at: new Date() },
      { name: 'Mechanical Engineering', code: 'MEE', faculty_id: 3, created_at: new Date(), updated_at: new Date() },
      { name: 'Civil Engineering', code: 'CVE', faculty_id: 3, created_at: new Date(), updated_at: new Date() },

      // Management (ID: 2)
      { name: 'Accounting', code: 'ACC', faculty_id: 2, created_at: new Date(), updated_at: new Date() },
      { name: 'Business Administration', code: 'BUS', faculty_id: 2, created_at: new Date(), updated_at: new Date() },
      { name: 'Economics', code: 'ECO', faculty_id: 2, created_at: new Date(), updated_at: new Date() },

      // Maritime (ID: 4)
      { name: 'Nautical Science', code: 'NSC', faculty_id: 4, created_at: new Date(), updated_at: new Date() }
    ]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Reversing the order to respect Foreign Key constraints
    await queryInterface.bulkDelete('departments', {}, {});
    await queryInterface.bulkDelete('faculties', {}, {});
  }
};