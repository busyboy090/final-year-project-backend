import { Op, Transaction } from "sequelize";
import db from "../../models/index.ts";
import * as jwt from "../../utils/jwt.ts";
import { sendSetPasswordEmail } from "../mail/setPassword.service.ts";
import bcrypt from "bcrypt";
import type {
  ListParams,
  CreateUserPayload,
  CreateUserResult,
  RegistryUserRow,
  UpdateUserBody,
} from "../../types/userManagement.d.ts";
import { serializeUserRow } from "../../helpers/userManagement.helper.ts";

export class UserManagementService {
  static async createUser(
    payload: CreateUserPayload,
  ): Promise<CreateUserResult> {
    try {
      const { first_name, last_name, email, role, organisation_id } = payload;

      return await db.sequelize.transaction(async (t: Transaction) => {
        const existingUser = await db.User.findOne({
          where: { email },
          transaction: t,
        });

        if (existingUser) {
          return {
            ok: false,
            reason: "EMAIL_EXISTS",
            message: "A user with this email already exists",
          };
        }

        const newUser = await db.User.create(
          {
            first_name,
            last_name,
            email,
            password: null,
            email_verified: false,
            is_active: true,
            profile_picture_url: null,
            role,
          },
          { transaction: t },
        );

        if (role === "event-organiser") {
          await db.EventOrganiserProfile.create(
            {
              user_id: newUser.id,
              organisation_id: organisation_id!,
            },
            { transaction: t },
          );
        }

        const setupToken = jwt.generateTempToken(
          { userId: newUser.id, email: newUser.email, type: "set_password" },
          "24h",
        );

        const emailResult = await sendSetPasswordEmail({
          to: newUser.email,
          name: first_name.trim(),
          token: setupToken,
        });

        if (!emailResult.success) {
          console.warn(
            "Failed to send password setup email for user:",
            newUser.id,
          );
          return {
            ok: true,
            reason: "EMAIL_SEND_FAILED",
            user: {
              id: newUser.id,
              first_name: newUser.first_name,
              last_name: newUser.last_name,
              email: newUser.email,
              role: newUser.role,
            },
            message: "User created, but password setup email could not be sent",
          };
        }

        return {
          ok: true,
          user: {
            id: newUser.id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            email: newUser.email,
            role: newUser.role,
          },
          message: "User created successfully. Password setup email sent.",
        };
      });
    } catch (error) {
      console.error("CREATE_USER_SERVICE_ERROR:", error);
      return {
        ok: false,
        reason: "SERVER_ERROR",
        message: "An error occurred while creating the user",
      };
    }
  }

  static async setPassword(
    userId: number,
    newPassword: string,
  ): Promise<CreateUserResult> {
    try {
      if (!newPassword || newPassword.length < 8) {
        return {
          ok: false,
          reason: "WEAK_PASSWORD",
          message: "Password must be at least 8 characters long",
        };
      }

      return await db.sequelize.transaction(async (t: Transaction) => {
        const user = await db.User.findByPk(userId, { transaction: t });
        if (!user)
          return {
            ok: false,
            reason: "USER_NOT_FOUND",
            message: "User not found",
          };

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await user.update(
          { password: hashedPassword, email_verified: true },
          { transaction: t },
        );

        return {
          ok: true,
          message:
            "Password set successfully. You can now complete your profile.",
        };
      });
    } catch (error) {
      console.error("SET_PASSWORD_SERVICE_ERROR:", error);
      return {
        ok: false,
        reason: "SERVER_ERROR",
        message: "An error occurred while setting password",
      };
    }
  }

  static async list(params: ListParams): Promise<{
    data: RegistryUserRow[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const {
      page,
      limit,
      search,
      role,
      department_id: departmentId,
      organisation_id: organisationId,
      faculty_id: facultyId,
    } = params;
    const offset = (page - 1) * limit;

    // 1. Core target filters applied directly to the base User schema
    const where: Record<string, unknown> = {};

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.or as unknown as string] = [
        { first_name: { [Op.iLike]: term } },
        { last_name: { [Op.iLike]: term } },
        { email: { [Op.iLike]: term } },
      ];
    }

    if (role && role !== "all") {
      where.role = role;
    }

    const filteringStudents = !role || role === "all" || role === "student";
    const filteringStaff = !role || role === "all" || role === "staff";
    const filteringOrganiser =
      !role || role === "all" || role === "event-organiser";

    // 2. Formulate cross-profile OR filtering logic for global unit queries
    const orConditions: any[] = [];

    if (departmentId || facultyId || organisationId) {
      if (filteringStudents && departmentId) {
        orConditions.push({ "$studentProfile.department_id$": departmentId });
      }

      if (filteringStaff) {
        const staffCond: Record<string, unknown> = {};
        if (departmentId)
          staffCond["$staffProfile.department_id$"] = departmentId;
        if (facultyId) staffCond["$staffProfile.faculty_id$"] = facultyId;
        if (Object.keys(staffCond).length > 0) orConditions.push(staffCond);
      }

      if (filteringOrganiser) {
        const orgCond: Record<string, unknown> = {};
        if (organisationId)
          orgCond["$eventOrganiserProfile.organisation.id$"] = organisationId;
        if (facultyId)
          orgCond["$eventOrganiserProfile.organisation.faculty_id$"] =
            facultyId;
        if (departmentId)
          orgCond["$eventOrganiserProfile.organisation.department_id$"] =
            departmentId;
        if (Object.keys(orgCond).length > 0) orConditions.push(orgCond);
      }

      // If a unit filter is set, apply the conditions dynamically
      if (orConditions.length > 0) {
        where[Op.or as unknown as string] = where[Op.or as unknown as string]
          ? {
              [Op.and]: [
                { [Op.or]: where[Op.or as unknown as string] },
                { [Op.or]: orConditions },
              ],
            }
          : orConditions;
      }
    }

    // 3. Define Clean Include Targets (using Left Joins to safely query combined data blocks)
    const studentProfileInclude = {
      model: db.StudentProfile,
      as: "studentProfile",
      attributes: ["department_id"],
      required: role === "student" && !!departmentId, // Only INNER JOIN if explicitly matching ONLY students
      include: [
        {
          model: db.Department,
          as: "department",
          attributes: ["id", "name"],
        },
      ],
    };

    const staffProfileInclude = {
      model: db.StaffProfile,
      as: "staffProfile",
      attributes: ["department_id", "staff_type", "faculty_id"],
      required: role === "staff" && (!!departmentId || !!facultyId), // Only INNER JOIN if explicitly matching ONLY staff
      include: [
        {
          model: db.Department,
          as: "department",
          attributes: ["id", "name"],
        },
        {
          model: db.Faculty,
          as: "faculty",
          attributes: ["id", "name"],
        },
      ],
    };

    const eventOrganiserProfileInclude = {
      model: db.EventOrganiserProfile,
      as: "eventOrganiserProfile",
      attributes: ["organisation_id"],
      required:
        role === "event-organiser" &&
        (!!organisationId || !!facultyId || !!departmentId),
      include: [
        {
          model: db.Organisation,
          as: "organisation",
          attributes: ["id", "name"],
          include: [
            {
              model: db.Department,
              as: "department",
              attributes: ["id", "name"],
            },
            {
              model: db.Faculty,
              as: "faculty",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    };

    // 4. Fire Primary Aggregated Query
    const { rows, count } = await db.User.findAndCountAll({
      where,
      distinct: true,
      col: "id",
      limit,
      offset,
      order: [["created_at", "DESC"]],
      subQuery: false,
      include: [
        studentProfileInclude,
        staffProfileInclude,
        eventOrganiserProfileInclude,
      ],
    });

    return {
      data: rows.map((u: any) => serializeUserRow(u)),
      meta: {
        page,
        limit,
        total: count,
        totalPages: limit > 0 ? Math.ceil(count / limit) : 0,
      },
    };
  }

  static async updateUser(
    targetUserId: number,
    actorUserId: number,
    body: UpdateUserBody,
  ): Promise<RegistryUserRow> {
    if (targetUserId === actorUserId && body.is_active === false) {
      throw new Error("SELF_DEACTIVATE");
    }

    return await db.sequelize.transaction(async (t: Transaction) => {
      const user = await db.User.findByPk(targetUserId, { transaction: t });
      if (!user) throw new Error("NOT_FOUND");

      if (body.email) {
        const normalized = body.email.trim().toLowerCase();
        if (normalized !== user.email) {
          const existing = await db.User.findOne({
            where: { email: normalized },
            transaction: t,
          });
          if (existing) throw new Error("EMAIL_TAKEN");
        }
      }

      const updates: any = {};
      if (body.first_name !== undefined) updates.first_name = body.first_name;
      if (body.last_name !== undefined) updates.last_name = body.last_name;
      if (body.email !== undefined)
        updates.email = body.email.trim().toLowerCase();
      if (body.is_active !== undefined) updates.is_active = body.is_active;

      await user.update(updates, { transaction: t });

      const fresh = await db.User.findByPk(targetUserId, {
        transaction: t,
        include: [
          {
            model: db.StudentProfile,
            as: "studentProfile",
            include: [
              {
                model: db.Department,
                as: "department",
                attributes: ["id", "name"],
              },
            ],
          },
          {
            model: db.StaffProfile,
            as: "staffProfile",
            include: [
              {
                model: db.Department,
                as: "department",
                attributes: ["id", "name"],
              },
            ],
          },
          { model: db.EventOrganiserProfile, as: "eventOrganiserProfile" },
        ],
      });

      return serializeUserRow(fresh);
    });
  }
}
