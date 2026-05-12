import { Op, Transaction } from "sequelize";
import db from "../../models/index.ts";

export type RegistryUserRow = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  profile_picture_url: string | null;
  is_active: boolean;
  email_verified: boolean;
  roles: { id: number; code: string; name: string }[];
  department_id: number | null;
  department_name: string;
};

type ListParams = {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  department_id?: number;
};

/**
 * flattens the nested Sequelize model into a clean UI-ready object
 */
function serializeUserRow(user: any): RegistryUserRow {
  const roles =
    user.roles?.map((r: any) => ({
      id: r.id,
      code: r.code,
      name: r.name,
    })) ?? [];

  // Determine department from polymorphic profiles
  let departmentName: string | null = null;
  let departmentId: number | null = null;

  const profile = user.studentProfile || user.staffProfile || user.adminProfile;

  if (profile?.department) {
    departmentName = profile.department.name;
    departmentId = profile.department.id;
  }

  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    profile_picture_url: user.profile_picture_url,
    is_active: user.is_active,
    email_verified: user.email_verified,
    roles,
    department_id: departmentId,
    department_name: departmentName ?? "—",
  };
}

export class UserManagementService {
  /**
   * Retrieves a paginated list of users with their roles and profiles
   */
  static async list(params: ListParams): Promise<{
    data: RegistryUserRow[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, search, role, department_id: departmentId } = params;
    const offset = (page - 1) * limit;

    const where: any = {};

    // 1. Handle Global Search
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { first_name: { [Op.iLike]: term } },
        { last_name: { [Op.iLike]: term } },
        { email: { [Op.iLike]: term } },
      ];
    }

    // 2. Handle Role Filtering
    const roleInclude: any = {
      model: db.Role,
      as: "roles",
      through: { attributes: [] },
      attributes: ["id", "code", "name"],
    };

    if (role && role !== "all") {
      roleInclude.where = { code: role };
      roleInclude.required = true; // Changes to INNER JOIN to filter by role
    }

    // 3. Department Filtering Logic
    // If a departmentId is provided, we filter across all three profile types
    const departmentWhere = departmentId ? { department_id: departmentId } : undefined;

    const { rows, count } = await db.User.findAndCountAll({
      where,
      distinct: true,
      col: "id", 
      limit,
      offset,
      order: [["created_at", "DESC"]],
      subQuery: false,
      include: [
        roleInclude,
        {
          model: db.StudentProfile,
          as: "studentProfile",
          attributes: ["department_id"],
          where: departmentWhere,
          required: false,
          include: [{ model: db.Department, as: "department", attributes: ["id", "name"] }],
        },
        {
          model: db.StaffProfile,
          as: "staffProfile",
          attributes: ["department_id"],
          where: departmentWhere,
          required: false,
          include: [{ model: db.Department, as: "department", attributes: ["id", "name"] }],
        },
        {
          model: db.AdminProfile,
          as: "adminProfile",
          attributes: ["department_id"],
          where: departmentWhere,
          required: false,
          include: [{ model: db.Department, as: "department", attributes: ["id", "name"] }],
        },
      ],
    });

    // 4. Post-fetch Filtering (Sequelize limitation with OR across multiple includes)
    // If filtering by department, we must ensure the user has at least one of the profiles
    let finalRows = rows;
    if (departmentId) {
      finalRows = rows.filter((u:any) => u.studentProfile || u.staffProfile || u.adminProfile);
    }

    const data = finalRows.map((u: any) => serializeUserRow(u));
    const total = typeof count === "number" ? count : (count as any).length || 0;

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

  /**
   * Updates basic user info and handles constraints
   */
  static async updateUser(
    targetUserId: number,
    actorUserId: number,
    body: { first_name?: string; last_name?: string; email?: string; is_active?: boolean }
  ): Promise<RegistryUserRow> {
    // Prevent self-deactivation
    if (targetUserId === actorUserId && body.is_active === false) {
      throw new Error("SELF_DEACTIVATE");
    }

    return await db.sequelize.transaction(async (t: Transaction) => {
      const user = await db.User.findByPk(targetUserId, { transaction: t });
      if (!user) throw new Error("NOT_FOUND");

      // Email uniqueness check
      if (body.email) {
        const normalized = body.email.trim().toLowerCase();
        if (normalized !== user.email) {
          const existing = await db.User.findOne({ 
            where: { email: normalized },
            transaction: t 
          });
          if (existing) throw new Error("EMAIL_TAKEN");
        }
      }

      const updates: any = {};
      if (body.first_name !== undefined) updates.first_name = body.first_name;
      if (body.last_name !== undefined) updates.last_name = body.last_name;
      if (body.email !== undefined) updates.email = body.email.trim().toLowerCase();
      if (body.is_active !== undefined) updates.is_active = body.is_active;

      await user.update(updates, { transaction: t });

      const fresh = await db.User.findByPk(targetUserId, {
        transaction: t,
        include: [
          {
            model: db.Role,
            as: "roles",
            through: { attributes: [] },
            attributes: ["id", "code", "name"],
          },
          {
            model: db.StudentProfile,
            as: "studentProfile",
            include: [{ model: db.Department, as: "department", attributes: ["id", "name"] }],
          },
          {
            model: db.StaffProfile,
            as: "staffProfile",
            include: [{ model: db.Department, as: "department", attributes: ["id", "name"] }],
          },
          {
            model: db.AdminProfile,
            as: "adminProfile",
            include: [{ model: db.Department, as: "department", attributes: ["id", "name"] }],
          },
        ],
      });

      return serializeUserRow(fresh);
    });
  }
}