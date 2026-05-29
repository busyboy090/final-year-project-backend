"use strict";

import { QueryInterface } from "sequelize";
import bcrypt from "bcrypt";

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date();
    const defaultPassword = await bcrypt.hash("Password@ADUN2026", 12);

    // ─── 1. USERS ─────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert("users", [
      // Super Admin (already existing)
      {
        id: 1,
        first_name: "System",
        last_name: "Administrator",
        email: "admin@adun-ems.name.ng",
        role: "super-admin",
        gender: null,
        phone: null,
        password: await bcrypt.hash("Admin@ADUN2026", 12),
        two_factor_enabled: true,
        email_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // ── Staff ────────────────────────────────────────────────────────────────
      {
        id: 2,
        first_name: "Emeka",
        last_name: "Okafor",
        email: "e.okafor@adun-ems.name.ng",
        role: "staff",
        gender: "male",
        phone: "+2348031234567",
        password: defaultPassword,
        two_factor_enabled: false,
        email_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        first_name: "Ngozi",
        last_name: "Adeyemi",
        gender: "female",
        email: "n.adeyemi@adun-ems.name.ng",
        role: "staff",
        phone: "+2348059876543",
        password: defaultPassword,
        two_factor_enabled: false,
        email_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // ── Students ─────────────────────────────────────────────────────────────
      {
        id: 4,
        first_name: "Chukwuemeka",
        last_name: "Nwosu",
        gender: "male",
        email: "21/sw/001@adun-ems.name.ng",
        role: "student",
        password: defaultPassword,
        two_factor_enabled: false,
        email_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 5,
        first_name: "Amina",
        last_name: "Bello",
        gender: "female",
        email: "21/cs/002@adun-ems.name.ng",
        role: "student",
        password: defaultPassword,
        two_factor_enabled: false,
        email_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 6,
        first_name: "Tunde",
        last_name: "Fashola",
        gender: "male",
        email: "22/ee/003@adun-ems.name.ng",
        role: "student",
        password: defaultPassword,
        two_factor_enabled: false,
        email_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // ── Event Organisers ─────────────────────────────────────────────────────
      {
        id: 7,
        first_name: "Sola",
        last_name: "Martins",
        gender: "female",
        email: "sug.president@adun-ems.name.ng",
        role: "event-organiser",
        password: defaultPassword,
        two_factor_enabled: false,
        phone: "+2348071112233",
        email_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 8,
        first_name: "Kelechi",
        last_name: "Eze",
        gender: "male",
        email: "sensa.president@adun-ems.name.ng",
        role: "event-organiser",
        phone: "+2348072223344",
        password: defaultPassword,
        two_factor_enabled: false,
        email_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 9,
        first_name: "Fatima",
        last_name: "Umar",
        gender: "female",
        email: "student.affairs@adun-ems.name.ng",
        role: "event-organiser",
        phone: "+2348073334455",
        password: defaultPassword,
        two_factor_enabled: false,
        email_verified: true,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    // ─── 2. STAFF PROFILES ────────────────────────────────────────────────────
    // department_id refs: 1=SEN, 2=CSC, 12=ICT, 13=Student Affairs
    // faculty_id refs: 1=FOS, 3=FEET
    await queryInterface.bulkInsert("staff_profiles", [
      {
        user_id: 2,
        staff_id: "ADUN/STAFF/SEN/001",
        faculty_id: 1, // Faculty of Science
        department_id: 1, // Software Engineering
        staff_type: "academic-staff",
        created_at: now,
        updated_at: now,
      },
      {
        user_id: 3,
        staff_id: "ADUN/STAFF/STA/002",
        faculty_id: null, // Administrative — no faculty
        department_id: 13, // Student Affairs
        staff_type: "non-academic-staff",
        created_at: now,
        updated_at: now,
      },
    ]);

    // ─── 3. STUDENT PROFILES ──────────────────────────────────────────────────
    // department_id refs: 1=SEN, 2=CSC, 5=EEE
    // level_id: adjust to match your actual levels seed (100–500)
    await queryInterface.bulkInsert("student_profiles", [
      {
        user_id: 4,
        matric_no: "ADUN/FS/SEN/22/001",
        department_id: 1, // Software Engineering
        level_id: 4, // 400L (final year)
        created_at: now,
        updated_at: now,
      },
      {
        user_id: 5,
        matric_no: "ADUN/FS/CS/22/002",
        department_id: 2, // Computer Science
        level_id: 4, // 400L
        created_at: now,
        updated_at: now,
      },
      {
        user_id: 6,
        matric_no: "ADUN/FS/EE/22/004",
        department_id: 5, // Electrical & Electronics Engineering
        level_id: 3, // 300L
        created_at: now,
        updated_at: now,
      },
    ]);

    // ─── 4. EVENT ORGANISER PROFILES ─────────────────────────────────────────
    // organiser_id refs from organisations seed:
    //   13 = Student Union Government (SUG)
    //   6  = SENSA
    //   14 = Student Affairs (dept-linked org)
    await queryInterface.bulkInsert("event_organiser_profiles", [
      {
        user_id: 7,
        organisation_id: 13, // Student Union Government
        created_at: now,
        updated_at: now,
      },
      {
        user_id: 8,
        organisation_id: 6, // SENSA
        created_at: now,
        updated_at: now,
      },
      {
        user_id: 9,
        organisation_id: null, // University-wide / admin organiser
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  // ─── DOWN ──────────────────────────────────────────────────────────────────
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("event_organiser_profiles", {}, {});
    await queryInterface.bulkDelete("student_profiles", {}, {});
    await queryInterface.bulkDelete("staff_profiles", {}, {});
    await queryInterface.bulkDelete("users", {}, {});
  },
};
