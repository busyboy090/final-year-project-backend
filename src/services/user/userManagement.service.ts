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
      const { first_name, last_name, email, role } = payload;

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

        // ✅ create initial profile based on single role
        // switch (role) {
        //   case "staff":
        //     await db.StaffProfile.create({
        //       user_id:       newUser.id,
        //       department_id: department_id || null,
        //       staff_type:    staff_type    || null,
        //     }, { transaction: t });
        //     break;

        //   case "event-organiser":
        //     await db.EventOrganiserProfile.create(
        //       { user_id: newUser.id },
        //       { transaction: t },
        //     );
        //     break

        //   // student profile created when they complete their profile
        //   default:
        //     break;
        // }

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
    const { page, limit, search, role, department_id: departmentId } = params;
    const offset = (page - 1) * limit;
    const where: any = {};

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { first_name: { [Op.iLike]: term } },
        { last_name: { [Op.iLike]: term } },
        { email: { [Op.iLike]: term } },
      ];
    }

    // ✅ role is just a column filter like any other
    if (role && role !== "all") {
      where.role = role;
    }

    const departmentWhere = departmentId
      ? { department_id: departmentId }
      : undefined;

    const { rows, count } = await db.User.findAndCountAll({
      where,
      distinct: true,
      col: "id",
      limit,
      offset,
      order: [["created_at", "DESC"]],
      subQuery: false,
      include: [
        {
          model: db.StudentProfile,
          as: "studentProfile",
          attributes: ["department_id"],
          where: departmentWhere,
          required: false,
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
          attributes: ["department_id", "staff_type"],
          where: departmentWhere,
          required: false,
          include: [
            {
              model: db.Department,
              as: "department",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: db.EventOrganiserProfile,
          as: "eventOrganiserProfile",
          required: false,
        },
      ],
    });

    let finalRows = rows;
    if (departmentId) {
      finalRows = rows.filter((u: any) => u.studentProfile || u.staffProfile);
    }

    const data = finalRows.map((u: any) => serializeUserRow(u));
    const total =
      typeof count === "number" ? count : (count as any).length || 0;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
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
          { model: db.EventOrganiserProfile, as: "eventOrganiserProfile" }
        ],
      });

      return serializeUserRow(fresh);
    });
  }
}
