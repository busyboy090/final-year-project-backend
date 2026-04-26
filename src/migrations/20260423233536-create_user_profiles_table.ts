// 'use strict';

// import { DataTypes, Sequelize } from 'sequelize';

// // Types
// import type { QueryInterface } from 'sequelize';

// /** @type {import('sequelize-cli').Migration} */
// export default {
//   up: async (queryInterface: QueryInterface) => {
//     await queryInterface.createTable('user_profiles', {
//       id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         primaryKey: true,
//         autoIncrement: true,
//       },

//       user_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         unique: true,
//         references: {
//           key: "id",
//           model: "users"
//         },
//         onDelete: "CASCADE",
//         onUpdate: "CASCADE"
//       },

//       department_id:{
//         type: DataTypes.INTEGER,
//         allowNull: true,
//         references: {
//           key: "id",
//           model: "departments"
//         },
//         onDelete: "SET NULL",
//         onUpdate: "CASCADE"
//       },

//       level_id: {
//         type: DataTypes.INTEGER,
//         allowNull: true,
//         references: {
//           key: "id",
//           model: "levels"
//         },
//         onDelete: "SET NULL",
//         onUpdate: "CASCADE"
//       },

//       profile_picture_url: {
//         type: DataTypes.TEXT,
//         allowNull: true
//       },

//       dob: {
//         type: DataTypes.DATEONLY,
//         allowNull: false
//       },

//       gender: {
//         type: DataTypes.ENUM("male","female"),
//         allowNull: false
//       },

//       created_at: {
//         allowNull: false,
//         type: DataTypes.DATE,
//         defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
//       },

//       updated_at: {
//         allowNull: false,
//         type: DataTypes.DATE,
//         defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
//       },
//     });
//   },

//   down: async (queryInterface: QueryInterface) => {
//     await queryInterface.dropTable('user_profiles');
//   },
// };