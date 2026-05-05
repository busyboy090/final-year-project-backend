import db from "../models/index.ts";
import type { CreateFacilityInput, UpdateFacilityInput } from "../validators/facility.schema.ts";

export class FacilityService {
    /**
     * Creates a new facility asset
     */
    static async createFacility(data: CreateFacilityInput['body']) {
        try {
            const exists = await db.Facility.findOne({ where: { name: data.name } });
            if (exists) return { ok: false, reason: "ALREADY_EXISTS" };

            const facility = await db.Facility.create(data);
            return { ok: true, data: facility };
        } catch (error) {
            console.error("FACILITY_SERVICE_ERROR:", error);
            throw error;
        }
    }

    /**
     * Fetches all registered facilities
     */
    static async getAllFacilities() {
        try {
            const facilities = await db.Facility.findAll({ order: [['name', 'ASC']] });
            return { ok: true, data: facilities };
        } catch (error) {
            console.error("GET_FACILITIES_ERROR:", error);
            throw error;
        }
    }

    /**
     * Updates an existing facility asset
     */
    static async updateFacility(id: number, data: Partial<UpdateFacilityInput['body']>) {
        try {
            // 1. Find the facility in the ADUN registry
            const facility = await db.Facility.findByPk(id);

            if (!facility) {
                return { ok: false, reason: "FACILITY_NOT_FOUND" };
            }

            // 2. Perform the update
            const updatedFacility = await facility.update(data);

            return { ok: true, data: updatedFacility };
        } catch (error) {
            console.error("UPDATE_FACILITY_SERVICE_ERROR:", error);
            throw error;
        }
    }

    /**
     * Targeted fetch for a single facility
     */
    static async getFacilityById(id: number) {
        try {
            const facility = await db.Facility.findByPk(id);
            if (!facility) return { ok: false, reason: "FACILITY_NOT_FOUND" };
            return { ok: true, data: facility };
        } catch (error) {
            console.error("GET_FACILITY_BY_ID_ERROR:", error);
            throw error;
        }
    }
}