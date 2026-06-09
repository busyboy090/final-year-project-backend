import { QueryInterface, Sequelize } from 'sequelize';

/**
 * ADUN-EMS Venue Seeder
 */
export default {
  up: async (queryInterface: QueryInterface, _: typeof Sequelize) => {
    await queryInterface.bulkInsert('venues', [
      {
        name: 'Law Auditorium',
        capacity: 300,
        type: 'auditorium',
        thumbnail: null,
        images: null,
        location: 'Near Faculty of Law',
        status: 'available',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: "Multi Purpose Hall",
        type: 'hall',
        capacity: 500,
        thumbnail: null,
        images: null,
        location: 'Near Faculty of Science',
        status: 'available',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    await queryInterface.bulkInsert('venue_facilities', [
      // Law Auditorium (venue_id: 1)
      { venue_id: 1, facility_id: 1, created_at: new Date(), updated_at: new Date() }, // Air Conditioning
      { venue_id: 1, facility_id: 2, created_at: new Date(), updated_at: new Date() }, // Projector & Screen
      { venue_id: 1, facility_id: 3, created_at: new Date(), updated_at: new Date() }, // Public Address System
      { venue_id: 1, facility_id: 4, created_at: new Date(), updated_at: new Date() }, // Dedicated Wi-Fi

      // Multi Purpose Hall (venue_id: 2)
      { venue_id: 2, facility_id: 1, created_at: new Date(), updated_at: new Date() }, // Air Conditioning
      { venue_id: 2, facility_id: 3, created_at: new Date(), updated_at: new Date() }, // Public Address System
      { venue_id: 2, facility_id: 5, created_at: new Date(), updated_at: new Date() }, // UPS & Power Backup
    ])
  },

  down: async (queryInterface: QueryInterface, _: typeof Sequelize) => {
    await queryInterface.bulkDelete('venues', {}, {});
    await queryInterface.bulkDelete('venue_facilities', {}, {});
  }
};