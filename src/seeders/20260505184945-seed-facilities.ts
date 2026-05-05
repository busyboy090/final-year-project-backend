import { QueryInterface, Sequelize } from 'sequelize';

/**
 * ADUN-EMS Facility Seeder
 * Populates the system with core infrastructure assets.
 */
export default {
  up: async (queryInterface: QueryInterface, _: typeof Sequelize) => {
    return queryInterface.bulkInsert('facilities', [
      {
        name: 'Air Conditioning',
        description: 'High-capacity cooling systems for lecture halls and auditoriums.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Projector & Screen',
        description: 'Multimedia setup including motorized screens and 4K projectors.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Public Address System',
        description: 'Integrated audio setup with wireless microphones and surround speakers.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Dedicated Wi-Fi',
        description: 'High-speed campus network access for event attendees.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'UPS & Power Backup',
        description: 'Ensures zero downtime during university events and presentations.',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface: QueryInterface, _: typeof Sequelize) => {
    return queryInterface.bulkDelete('facilities', {}, {});
  }
};