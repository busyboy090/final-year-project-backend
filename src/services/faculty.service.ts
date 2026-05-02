import db from "../models/index.ts";

export class FacultyService {
    /**
     * Fetch all faculties with their associated departments
     */
    static async getAllFaculties() {
        return await db.Faculty.findAll({
            include: ['departments'], // Ensure the association is defined in your models
            order: [['name', 'ASC']]
        });
    }

    /**
     * Get a single faculty by ID
     */
    static async getFacultyById(id: number) {
        return await db.Faculty.findByPk(id, { include: ['departments'] });
    }

    /**
     * Create a new faculty
     */
    static async createFaculty(data: { name: string; code: string }) {
        return await db.Faculty.create(data);
    }
}