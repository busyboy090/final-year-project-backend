import db from "../../models/index.ts";
import type { UserRole } from "../../types/user.d.ts";

export class ProfileService {
    /**
     * Retrieves the full profile of a user based on a specific role.
     * This handles conditional fetching from student, staff, or admin tables.
     */
    static async getFlattenedUserProfile(userId: number, role: UserRole) {
        const includeOptions: any[] = [];

        if (role === 'student') {
            includeOptions.push({
                model: db.StudentProfile,
                as: 'studentProfile',
                include: [
                    { model: db.Department, as: 'department' },
                    { model: db.Level, as: 'level' }
                ]
            });
        } else if (role === 'staff' || role === 'event-organiser') {
            includeOptions.push({
                model: db.StaffProfile,
                as: 'staffProfile',
                include: [
                    { model: db.Faculty, as: 'faculty' },
                    { model: db.Department, as: 'department' }
                ]
            });
        } else if (['super-admin', 'faculty-admin', 'department-admin', 'src-exec'].includes(role)) {
            includeOptions.push({
                model: db.AdminProfile,
                as: 'adminProfile'
            });
        }

        const user = await db.User.findByPk(userId, {
            include: includeOptions,
            attributes: { exclude: ['password', 'two_factor_secret', 'two_factor_recovery_codes'] }
        });

        if (!user) return null;

        const userPlain = user.get({ plain: true });
        const profileData = userPlain.studentProfile || userPlain.staffProfile || userPlain.adminProfile || {};

        delete userPlain.studentProfile;
        delete userPlain.staffProfile;
        delete userPlain.adminProfile;

        return { ...userPlain, ...profileData };
    }

    /**
     * Checks if all assigned roles have their corresponding profile records.
     * Returns true only if every role that requires a profile has one.
     */
    static async checkAllUserProfiles(userId: number, roles: string[]): Promise<boolean> {
        if (!roles || roles.length === 0) return false;

        const profileChecks = await Promise.all(roles.map(async (role) => {
            let profile = null;

            switch (role) {
                case 'student':
                    profile = await db.StudentProfile.findOne({ where: { user_id: userId }, attributes: ['id'] });
                    break;
                case 'staff':
                case 'event-organiser':
                    profile = await db.StaffProfile.findOne({ where: { user_id: userId }, attributes: ['id'] });
                    break;
                case 'super-admin':
                case 'faculty-admin':
                case 'department-admin':
                case 'src-exec':
                    profile = await db.AdminProfile.findOne({ where: { user_id: userId }, attributes: ['id'] });
                    break;
                default:
                    // Roles that don't require an extra profile table are auto-verified
                    return true;
            }
            return !!profile;
        }));

        return profileChecks.every(exists => exists === true);
    }

    /**
     * Atomic update for User and StudentProfile data.
     */
    static async updateStudentProfile(userId: number, data: any) {
        const transaction = await db.sequelize.transaction();
        try {
            const { first_name, last_name, ...profileData } = data;
            const user = await db.User.findByPk(userId, { transaction });
            if (!user) throw new Error("User not found");

            if (first_name || last_name) {
                const updateObj: any = {};
                if (first_name) updateObj.first_name = first_name;
                if (last_name) updateObj.last_name = last_name;
                await user.update(updateObj, { transaction });
            }

            const [profile, created] = await db.StudentProfile.findOrCreate({
                where: { user_id: userId },
                defaults: { ...profileData, user_id: userId },
                transaction
            });

            if (!created) await profile.update(profileData, { transaction });

            await transaction.commit();
            return await this.getFlattenedUserProfile(userId, 'student');
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async updateAvatar(userId: number, url: string) {
        const [affectedCount] = await db.User.update(
            { profile_picture_url: url },
            { where: { id: userId } }
        );
        if (affectedCount === 0) throw new Error("User not found.");
        return { success: true, url };
    }
}