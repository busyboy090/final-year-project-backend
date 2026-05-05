'use strict';

import { QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date();

    // 1. Seed Permissions (Atomic actions)
    await queryInterface.bulkInsert('permissions', [
      // System & Admin Module
      { name: 'manage_faculties', module: 'system', created_at: now, updated_at: now },
      { name: 'manage_roles', module: 'system', created_at: now, updated_at: now },
      { name: 'view_faculty_reports', module: 'system', created_at: now, updated_at: now },
      { name: 'manage_structure', module: 'system', created_at: now, updated_at: now },

      // Event Management Module (ADUN-EMS)
      { name: 'create_event', module: 'events', created_at: now, updated_at: now },
      { name: 'approve_events', module: 'events', created_at: now, updated_at: now },
      { name: 'delete_event', module: 'events', created_at: now, updated_at: now },
      { name: 'scan_tickets', module: 'events', created_at: now, updated_at: now },
      { name: 'book_tickets', module: 'events', created_at: now, updated_at: now },
      { name: 'view_events', module: 'events', created_at: now, updated_at: now },
      { name: 'manage_attendees', module: 'events', created_at: now, updated_at: now },

      // Academic & User Module
      { name: 'manage_departments', module: 'academics', created_at: now, updated_at: now },
      { name: 'manage_students', module: 'users', created_at: now, updated_at: now },
      { name: 'view_student_records', module: 'users', created_at: now, updated_at: now },
      { name: 'upload_repository', module: 'repository', created_at: now, updated_at: now },
    ]);

    // 2. Seed Roles (No longer using the JSON 'permissions' column)
    await queryInterface.bulkInsert('roles', [
      { name: 'Super Administrator', code: 'super-admin', created_at: now, updated_at: now },
      { name: 'Student Affairs', code: 'student-affairs', created_at: now, updated_at: now },
      { name: 'Faculty Administrator', code: 'faculty-admin', created_at: now, updated_at: now },
      { name: 'Department Administrator', code: 'department-admin', created_at: now, updated_at: now },
      { name: 'Event Organiser', code: 'event-organiser', created_at: now, updated_at: now },
      { name: 'SRC Executive', code: 'src-exec', created_at: now, updated_at: now },
      { name: 'Staff', code: 'staff', created_at: now, updated_at: now },
      { name: 'Student', code: 'student', created_at: now, updated_at: now }
    ]);

    // 3. Dynamic Linkage in role_permissions
    // Fetch IDs to ensure correct mapping
    const roles: any = await queryInterface.sequelize.query(`SELECT id, code FROM roles;`);
    const perms: any = await queryInterface.sequelize.query(`SELECT id, name FROM permissions;`);

    const roleMap = Object.fromEntries(roles[0].map((r: any) => [r.code, r.id]));
    const permMap = Object.fromEntries(perms[0].map((p: any) => [p.name, p.id]));

    const assignments = [
      // STUDENT: Basic access
      { role_id: roleMap['student'], permission_id: permMap['view_events'] },
      { role_id: roleMap['student'], permission_id: permMap['book_tickets'] },

      // STAFF: Similar to students
      { role_id: roleMap['staff'], permission_id: permMap['view_events'] },
      { role_id: roleMap['staff'], permission_id: permMap['book_tickets'] },

      // EVENT ORGANISER: EMS specific
      { role_id: roleMap['event-organiser'], permission_id: permMap['create_event'] },
      { role_id: roleMap['event-organiser'], permission_id: permMap['scan_tickets'] },
      { role_id: roleMap['event-organiser'], permission_id: permMap['manage_attendees'] },

      // SRC EXEC: Student leaders
      { role_id: roleMap['src-exec'], permission_id: permMap['create_event'] },
      { role_id: roleMap['src-exec'], permission_id: permMap['scan_tickets'] },
      { role_id: roleMap['src-exec'], permission_id: permMap['view_events'] },

      // FACULTY ADMIN: Academic oversight
      { role_id: roleMap['faculty-admin'], permission_id: permMap['manage_departments'] },
      { role_id: roleMap['faculty-admin'], permission_id: permMap['view_faculty_reports'] },

      // STUDENT AFFAIRS: Final approval authority
      { role_id: roleMap['student-affairs'], permission_id: permMap['approve_events'] },
      { role_id: roleMap['student-affairs'], permission_id: permMap['view_student_records'] },

      // SUPER ADMIN: All management permissions
      { role_id: roleMap['super-admin'], permission_id: permMap['manage_faculties'] },
      { role_id: roleMap['super-admin'], permission_id: permMap['manage_roles'] },
      { role_id: roleMap['super-admin'], permission_id: permMap['manage_students'] },
      { role_id: roleMap['super-admin'], permission_id: permMap['manage_structure'] },
    ];

    // Add timestamps to all assignments
    const finalAssignments = assignments.map(a => ({
      ...a,
      created_at: now,
      updated_at: now
    }));

    await queryInterface.bulkInsert('role_permissions', finalAssignments);
  },

  down: async (queryInterface: QueryInterface) => {
    // Delete in reverse order to respect foreign key constraints
    await queryInterface.bulkDelete('role_permissions', {}, {});
    await queryInterface.bulkDelete('roles', {}, {});
    await queryInterface.bulkDelete('permissions', {}, {});
  }
};