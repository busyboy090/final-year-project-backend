import { QueryInterface, Sequelize } from 'sequelize';

/**
 * ADUN-EMS Events Seeder
 */
export default {
  up: async (queryInterface: QueryInterface, _: typeof Sequelize) => {
    await queryInterface.bulkInsert('events', [
      // Academic Conferences
      {
        title: 'ADUN Annual Engineering Research Symposium',
        description:
          'A flagship academic conference bringing together faculty, students, and industry experts to present cutting-edge research in engineering disciplines. Topics include embedded systems, software architecture, and civil infrastructure.',
        category: 'Academic Conference',
        duration: 480,
        thumbnail: 'https://placehold.co/800x450?text=Engineering+Symposium',
        organisation_id: 1,
        venue_id: 1,
        start_date: new Date('2025-03-10T09:00:00Z'),
        end_date: new Date('2025-03-10T17:00:00Z'),
        capacity: 300,
        created_by: 1,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'National Cybersecurity Conference — ADUN Chapter',
        description:
          'A joint conference with industry partners focusing on emerging threats in cyberspace, digital forensics, and secure software development practices for Nigerian institutions.',
        category: 'Academic Conference',
        duration: 360,
        thumbnail: 'https://placehold.co/800x450?text=Cybersecurity+Conference',
        organisation_id: 2,
        venue_id: 2,
        start_date: new Date('2025-04-22T08:30:00Z'),
        end_date: new Date('2025-04-22T14:30:00Z'),
        capacity: 200,
        created_by: 1,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Workshops
      {
        title: 'Full-Stack Web Development Bootcamp',
        description:
          'A hands-on workshop covering modern web development with React, Node.js, and PostgreSQL. Participants will build and deploy a production-ready application by the end of the session.',
        category: 'Workshop',
        duration: 300,
        thumbnail: 'https://placehold.co/800x450?text=Web+Dev+Bootcamp',
        organisation_id: 1,
        venue_id: 1,
        start_date: new Date('2025-02-15T10:00:00Z'),
        end_date: new Date('2025-02-15T15:00:00Z'),
        capacity: 60,
        created_by: 1,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Technical Report Writing for Final Year Students',
        description:
          'A practical writing workshop for final year students, covering APA citation, chapter structuring, literature review techniques, and how to present system designs clearly.',
        category: 'Workshop',
        duration: 180,
        thumbnail: 'https://placehold.co/800x450?text=Report+Writing+Workshop',
        organisation_id: 3,
        venue_id: 2,
        start_date: new Date('2025-01-20T09:00:00Z'),
        end_date: new Date('2025-01-20T12:00:00Z'),
        capacity: 120,
        created_by: 1,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'UI/UX Design Fundamentals with Figma',
        description:
          'An introductory workshop on user interface and experience design. Participants will learn design principles, wireframing, prototyping, and usability testing using Figma.',
        category: 'Workshop',
        duration: 240,
        thumbnail: 'https://placehold.co/800x450?text=UI+UX+Figma+Workshop',
        organisation_id: 1,
        venue_id: 1,
        start_date: new Date('2025-05-08T10:00:00Z'),
        end_date: new Date('2025-05-08T14:00:00Z'),
        capacity: 50,
        created_by: 1,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Cultural Events
      {
        title: 'ADUN Cultural Day 2025',
        description:
          'An annual celebration of Nigeria\'s rich cultural heritage featuring traditional attire, music, dance performances, food, and art exhibitions representing the diverse ethnic groups within the ADUN community.',
        category: 'Cultural Event',
        duration: 420,
        thumbnail: 'https://placehold.co/800x450?text=ADUN+Cultural+Day',
        organisation_id: 4,
        venue_id: 2,
        start_date: new Date('2025-06-14T10:00:00Z'),
        end_date: new Date('2025-06-14T17:00:00Z'),
        capacity: 500,
        created_by: 1,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Drama Night: Voices of the Delta',
        description:
          'A theatrical performance by the ADUN Arts & Culture Society presenting original plays that explore contemporary issues facing young Nigerians — identity, education, and resilience.',
        category: 'Cultural Event',
        duration: 150,
        thumbnail: 'https://placehold.co/800x450?text=Drama+Night',
        organisation_id: 4,
        venue_id: 1,
        start_date: new Date('2025-03-28T18:00:00Z'),
        end_date: new Date('2025-03-28T20:30:00Z'),
        capacity: 250,
        created_by: 1,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Sports Matches
      {
        title: 'Inter-Faculty Football Championship — Final',
        description:
          'The grand finale of the ADUN Inter-Faculty Football Championship. The Faculty of Engineering faces off against the Faculty of Management Sciences in a highly anticipated closing match.',
        category: 'Sports Match',
        duration: 120,
        thumbnail: 'https://placehold.co/800x450?text=Football+Championship',
        organisation_id: 5,
        venue_id: 2,
        start_date: new Date('2025-04-05T15:00:00Z'),
        end_date: new Date('2025-04-05T17:00:00Z'),
        capacity: 500,
        created_by: 1,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'ADUN vs Delta State University Volleyball Friendly',
        description:
          'A friendly volleyball match between ADUN and DELSU as part of the inter-university sports exchange programme aimed at fostering healthy competition and inter-institutional relationships.',
        category: 'Sports Match',
        duration: 90,
        thumbnail: 'https://placehold.co/800x450?text=Volleyball+Friendly',
        organisation_id: 5,
        venue_id: 1,
        start_date: new Date('2025-05-17T13:00:00Z'),
        end_date: new Date('2025-05-17T14:30:00Z'),
        capacity: 200,
        created_by: 1,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Exhibitions / Expos
      {
        title: 'Final Year Project Exhibition 2025',
        description:
          'The annual showcase of final year engineering and science projects. Students present their capstone systems, prototypes, and research findings to faculty panels, industry judges, and the general public.',
        category: 'Exhibition/Expo',
        duration: 360,
        thumbnail: 'https://placehold.co/800x450?text=FYP+Exhibition',
        organisation_id: 1,
        venue_id: 2,
        start_date: new Date('2025-06-20T09:00:00Z'),
        end_date: new Date('2025-06-20T15:00:00Z'),
        capacity: 400,
        created_by: 1,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'ADUN Tech & Innovation Expo',
        description:
          'A student-led technology exhibition featuring startup pitches, hardware demos, AI projects, and mobile applications developed by ADUN students. Open to the public and industry stakeholders.',
        category: 'Exhibition/Expo',
        duration: 480,
        thumbnail: 'https://placehold.co/800x450?text=Tech+Innovation+Expo',
        organisation_id: 2,
        venue_id: 1,
        start_date: new Date('2025-07-10T08:00:00Z'),
        end_date: new Date('2025-07-10T16:00:00Z'),
        capacity: 200,
        created_by: 1,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Social Gatherings
      {
        title: 'New Student Orientation & Welcome Mixer',
        description:
          'A social welcome event for freshmen and transfer students. Includes an orientation tour, introductions to student union bodies, icebreaker activities, and a catered reception.',
        category: 'Social Gathering/Party',
        duration: 180,
        thumbnail: 'https://placehold.co/800x450?text=Welcome+Mixer',
        organisation_id: 3,
        venue_id: 2,
        start_date: new Date('2025-01-06T15:00:00Z'),
        end_date: new Date('2025-01-06T18:00:00Z'),
        capacity: 500,
        created_by: 1,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'End-of-Semester Bonfire Night',
        description:
          'A student social gathering to mark the end of the first semester. Features a bonfire, live music from campus bands, food vendors, and games — a beloved ADUN tradition.',
        category: 'Social Gathering/Party',
        duration: 240,
        thumbnail: 'https://placehold.co/800x450?text=Bonfire+Night',
        organisation_id: 4,
        venue_id: 1,
        start_date: new Date('2025-02-01T19:00:00Z'),
        end_date: new Date('2025-02-01T23:00:00Z'),
        capacity: 300,
        created_by: 1,
        status: 'rejected',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface: QueryInterface, _: typeof Sequelize) => {
    await queryInterface.bulkDelete('events', {}, {});
  },
};