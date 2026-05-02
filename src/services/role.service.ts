import db from "../models/index.ts";

class RoleService {
    /**
     * Fetch all roles with their associated permissions
     */
    async getAllRoles() {
        return await db.Role.findAll({
            include: [
                {
                    model: db.Permission,
                    as: 'permissions',
                    attributes: ['id', 'name', 'module', 'description'],
                    through: { attributes: [] } // Hides the junction table data in the response
                }
            ]
        });
    }

    /**
     * Fetch a specific role by its code (e.g., 'student', 'super-admin')
     */
    async getRoleByCode(code: string) {
        return await db.Role.findOne({
            where: { code },
            include: [
                {
                    model: db.Permission,
                    as: 'permissions',
                    attributes: ['name', 'module'],
                    through: { attributes: [] }
                }
            ]
        });
    }

    /**
     * Check if a role has a specific permission
     */
    async hasPermission(roleId: number, permissionName: string): Promise<boolean> {
        const role = await db.Role.findByPk(roleId, {
            include: [
                {
                    model: db.Permission,
                    as: 'permissions',
                    where: { name: permissionName },
                    required: true // Ensures the query only returns if the permission exists
                }
            ]
        });

        return !!role;
    }

    /**
     * Assign a permission to a role
     */
    async assignPermission(roleId: number, permissionId: number) {
        return await db.RolePermission.create({
            role_id: roleId,
            permission_id: permissionId
        });
    }

    /**
     * Remove a permission from a role
     */
    async revokePermission(roleId: number, permissionId: number) {
        return await db.RolePermission.destroy({
            where: {
                role_id: roleId,
                permission_id: permissionId
            }
        });
    }
}

export default new RoleService();