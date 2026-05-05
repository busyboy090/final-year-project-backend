import type { Request, Response } from "express";
import { FacilityService } from "../services/facility.service.ts";

export class FacilityController {
    /**
     * @desc    Create a new facility asset (e.g., Projector, AC)
     * @route   POST /api/v1/facilities
     */
    static async create(req: Request, res: Response) {
        try {
            const result = await FacilityService.createFacility(req.body);

            if (!result.ok) {
                if (result.reason === "ALREADY_EXISTS") {
                    return res.status(409).json({
                        success: false,
                        message: "A facility with this name already exists in the ADUN registry."
                    });
                }
                return res.status(400).json({ success: false, message: result.reason });
            }

            return res.status(201).json({
                success: true,
                message: "Facility created successfully",
                data: result.data
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    /**
     * @desc    Fetch all available facilities
     * @route   GET /api/v1/facilities
     */
    static async list(_req: Request, res: Response) {
        try {
            const result = await FacilityService.getAllFacilities();
            return res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve facilities"
            });
        }
    }

    /**
     * @desc    Fetch a single facility by ID
     * @route   GET /api/v1/facilities/:id
     */
    static async getById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            
            if (isNaN(id)) {
                return res.status(400).json({ success: false, message: "Invalid Facility ID" });
            }

            const result = await FacilityService.getFacilityById(id);

            if (!result.ok) {
                return res.status(404).json({ success: false, message: "Facility not found" });
            }

            return res.status(200).json({ success: true, data: result.data });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    /**
     * @desc    Update an existing facility
     * @route   PATCH /api/v1/facilities/:id
     */
    static async update(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);

            const result = await FacilityService.updateFacility(id, req.body);

            if (!result.ok) {
                const status = result.reason === "FACILITY_NOT_FOUND" ? 404 : 400;
                return res.status(status).json({ success: false, message: result.reason });
            }

            return res.status(200).json({
                success: true,
                message: "Facility updated successfully",
                data: result.data
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
    }
}