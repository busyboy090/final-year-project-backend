// Types
import type { QueryInterface } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    // 1. Insert Faculties
    await queryInterface.bulkInsert("faculties", [
      { name: "Faculty of Science", code: "FOS", created_at: new Date(), updated_at: new Date() },
      { name: "Faculty of Arts, Management and Social Sciences", code: "FAMSS", created_at: new Date(), updated_at: new Date() },
      { name: "Faculty of Engineering and Technology", code: "FEET", created_at: new Date(), updated_at: new Date() },
      { name: "Faculty of Maritime Studies", code: "FMS", created_at: new Date(), updated_at: new Date() },
      { name: "Faculty of Law", code: "FOL", created_at: new Date(), updated_at: new Date() },
    ]);

    // 2. Insert Departments
    await queryInterface.bulkInsert("departments", [
      // Faculty of Science (faculty_id: 1)
      { name: "Software Engineering", code: "SEN", type: "Academic", faculty_id: 1, created_at: new Date(), updated_at: new Date() },
      { name: "Computer Science", code: "CSC", type: "Academic", faculty_id: 1, created_at: new Date(), updated_at: new Date() },
      { name: "Cyber Security", code: "CYS", type: "Academic", faculty_id: 1, created_at: new Date(), updated_at: new Date() },
      { name: "Forensic Science", code: "FSC", type: "Academic", faculty_id: 1, created_at: new Date(), updated_at: new Date() },
      // Faculty of Engineering (faculty_id: 3)
      { name: "Electrical and Electronics Engineering", code: "EEE", type: "Academic", faculty_id: 3, created_at: new Date(), updated_at: new Date() },
      { name: "Mechanical Engineering", code: "MEE", type: "Academic", faculty_id: 3, created_at: new Date(), updated_at: new Date() },
      { name: "Civil Engineering", code: "CVE", type: "Academic", faculty_id: 3, created_at: new Date(), updated_at: new Date() },
      // Faculty of Management (faculty_id: 2)
      { name: "Accounting", code: "ACC", type: "Academic", faculty_id: 2, created_at: new Date(), updated_at: new Date() },
      { name: "Business Administration", code: "BUS", type: "Academic", faculty_id: 2, created_at: new Date(), updated_at: new Date() },
      { name: "Economics", code: "ECO", type: "Academic", faculty_id: 2, created_at: new Date(), updated_at: new Date() },
      // Faculty of Maritime (faculty_id: 4)
      { name: "Nautical Science", code: "NSC", type: "Academic", faculty_id: 4, created_at: new Date(), updated_at: new Date() },
      // Administrative / Support
      { name: "ICT Department", code: "ICT", type: "Administrative", faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "Student Affairs", code: "STA", type: "Administrative", faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "Student Union Government", code: "SUG", type: "Student Union", faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "Library", code: "LIB", type: "Support Unit", faculty_id: null, created_at: new Date(), updated_at: new Date() },
    ]);

    // 3. Insert Organisations
    await queryInterface.bulkInsert("organisations", [
      // Faculty-level organisations (no specific department)
      { name: "Faculty of Science", department_id: null, faculty_id: 1, created_at: new Date(), updated_at: new Date() },
      { name: "Faculty of Engineering and Technology", department_id: null, faculty_id: 3, created_at: new Date(), updated_at: new Date() },
      { name: "Faculty of Arts, Management and Social Sciences", department_id: null, faculty_id: 2, created_at: new Date(), updated_at: new Date() },
      { name: "Faculty of Maritime Studies", department_id: null, faculty_id: 4, created_at: new Date(), updated_at: new Date() },
      { name: "Faculty of Law", department_id: null, faculty_id: 5, created_at: new Date(), updated_at: new Date() },

      // Department-level organisations
      { name: "Software Engineering", department_id: 1, faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "Computer Science", department_id: 2, faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "Cyber Security", department_id: 3, faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "Electrical Engineering", department_id: 5, faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "Mechanical Engineering", department_id: 6, faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "Accounting", department_id: 8, faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "Business Administration", department_id: 9, faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "Nautical Science", department_id: 11, faculty_id: null, created_at: new Date(), updated_at: new Date() },

      // University-wide organisations (no department or faculty)
      { name: "Student Union Government (SUG)", department_id: 14, faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "ADUN Press Club", department_id: null, faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "ADUN Drama and Arts Society", department_id: null, faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "ADUN Sports Association", department_id: null, faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "ADUN Debate Society", department_id: null, faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "ADUN Muslim Students Society (MSS)", department_id: null, faculty_id: null, created_at: new Date(), updated_at: new Date() },
      { name: "ADUN Christian Fellowship", department_id: null, faculty_id: null, created_at: new Date(), updated_at: new Date() },
    ]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Reverse order to respect FK constraints
    await queryInterface.bulkDelete("organisations", {}, {});
    await queryInterface.bulkDelete("departments", {}, {});
    await queryInterface.bulkDelete("faculties", {}, {});
  },
};