import type { Request, Response } from 'express';
import { OrganisationService } from '../services/organisation.service.ts';

export class OrganisationController {
  /**
   * GET /organisations
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, name, faculty_id, department_id } = req.query;

      const result = await OrganisationService.getAllOrganisations({
        page:          Number(page),
        limit:         Number(limit),
        name:          name          as string | undefined,
        faculty_id:    faculty_id    ? Number(faculty_id)    : undefined,
        department_id: department_id ? Number(department_id) : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Organisations retrieved successfully',
        data:    result.organisations,
        meta: {
          total:      result.total,
          page:       Number(page),
          limit:      Number(limit),
          totalPages: Math.ceil(result.total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("GET_ALL_ORGANISATIONS_ERROR:", error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * GET /organisations/:id
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id     = Number(req.params.id);
      const result = await OrganisationService.getOrganisationById(id);

      if (!result.ok) {
        res.status(404).json({
          success: false,
          message: `Organisation with ID ${id} not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Organisation retrieved successfully',
        data:    result.data,
      });
    } catch (error) {
      console.error("GET_ORGANISATION_BY_ID_ERROR:", error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * POST /organisations
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await OrganisationService.createOrganisation(req.body);

      if (!result.ok) {
        const status =
          result.reason === "ORGANISATION_ALREADY_EXISTS" ? 409 :
          result.reason === "FACULTY_NOT_FOUND"           ? 404 :
          result.reason === "DEPARTMENT_NOT_FOUND"        ? 404 : 400;

        const message =
          result.reason === "ORGANISATION_ALREADY_EXISTS"
            ? `An organisation named "${req.body.name}" already exists`
            : result.reason === "FACULTY_NOT_FOUND"
            ? `Faculty with ID ${req.body.faculty_id} not found`
            : result.reason === "DEPARTMENT_NOT_FOUND"
            ? `Department with ID ${req.body.department_id} not found`
            : 'Bad request';

        res.status(status).json({ success: false, message });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Organisation created successfully',
        data:    result.data,
      });
    } catch (error) {
      console.error("CREATE_ORGANISATION_ERROR:", error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * PATCH /organisations/:id
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id     = Number(req.params.id);
      const result = await OrganisationService.updateOrganisation(id, req.body);

      if (!result.ok) {
        const status =
          result.reason === "ORGANISATION_NOT_FOUND"      ? 404 :
          result.reason === "ORGANISATION_ALREADY_EXISTS" ? 409 :
          result.reason === "FACULTY_NOT_FOUND"           ? 404 :
          result.reason === "DEPARTMENT_NOT_FOUND"        ? 404 : 400;

        const message =
          result.reason === "ORGANISATION_NOT_FOUND"
            ? `Organisation with ID ${id} not found`
            : result.reason === "ORGANISATION_ALREADY_EXISTS"
            ? `An organisation named "${req.body.name}" already exists`
            : result.reason === "FACULTY_NOT_FOUND"
            ? `Faculty with ID ${req.body.faculty_id} not found`
            : result.reason === "DEPARTMENT_NOT_FOUND"
            ? `Department with ID ${req.body.department_id} not found`
            : 'Bad request';

        res.status(status).json({ success: false, message });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Organisation updated successfully',
        data:    result.data,
      });
    } catch (error) {
      console.error("UPDATE_ORGANISATION_ERROR:", error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * DELETE /organisations/:id
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id     = Number(req.params.id);
      const result = await OrganisationService.deleteOrganisation(id);

      if (!result.ok) {
        res.status(404).json({
          success: false,
          message: `Organisation with ID ${id} not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Organisation deleted successfully',
      });
    } catch (error) {
      console.error("DELETE_ORGANISATION_ERROR:", error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}