import db from "../../models/index.ts";
import type { Gender, UserRole } from "../../types/user.d.ts";

export class ProfileService {
  static async getFlattenedUserProfile(userId: number, role: UserRole) {
    const includeOptions: any[] = [];

    if (role === "student") {
      includeOptions.push({
        model: db.StudentProfile,
        as: "studentProfile",
        include: [
          { model: db.Department, as: "department" },
          { model: db.Level, as: "level" },
        ],
      });
    } else if (role === "staff") {
      includeOptions.push({
        model: db.StaffProfile,
        as: "staffProfile",
        include: [
          { model: db.Faculty, as: "faculty" },
          { model: db.Department, as: "department" },
        ],
      });
    } else if (role === "event-organiser") {
      includeOptions.push({
        model: db.EventOrganiserProfile,
        as: "eventOrganiserProfile",
        include: [
          {
            model: db.Organisation,
            as: "organisation",
            include: [
              { model: db.Department, as: "department" },
              { model: db.Faculty, as: "faculty" }
            ]
          }
        ]
      });
    }

    const user = await db.User.findByPk(userId, {
      include: includeOptions,
      attributes: {
        exclude: ["password", "two_factor_secret", "two_factor_recovery_codes"],
      },
    });

    if (!user) return null;

    const userPlain = user.get({ plain: true });
    const profileData =
      userPlain.studentProfile ||
      userPlain.staffProfile ||
      userPlain.eventOrganiserProfile;
    {
    }

    delete userPlain.studentProfile;
    delete userPlain.staffProfile;
    delete userPlain.eventOrganiserProfile;

    let needsProfileCompletion = false;

    switch (role) {
      case "student":
        needsProfileCompletion = !profileData?.matric_no;
        break;
      case "staff":
        needsProfileCompletion = !profileData?.staff_id;
        break;
      case "event-organiser":
        needsProfileCompletion = !profileData?.organiser_id;
        break;
    }

    return { ...userPlain, ...profileData, needsProfileCompletion };
  }

  static async checkUserProfiles(
    userId: number,
    role: UserRole,
  ): Promise<boolean> {
    switch (role) {
      case "student":
        return !!(await db.StudentProfile.findOne({
          where: { user_id: userId },
          attributes: ["id"],
        }));
      case "staff":
        return !!(await db.StaffProfile.findOne({
          where: { user_id: userId },
          attributes: ["id"],
        }));
      case "event-organiser":
        return !!(await db.EventOrganiserProfile.findOne({
          where: { user_id: userId },
          attributes: ["id"],
        }));
      default:
        return true;
    }
  }

  // ✅ shared private helper — all three update methods were identical except model + role
  private static async upsertProfile(
    userId: number,
    role: UserRole,
    model: any,
    data: any,
  ) {
    const transaction = await db.sequelize.transaction();
    try {
      const { first_name, last_name, phone, gender, ...profileData } = data;
      const user = await db.User.findByPk(userId, { transaction });
      if (!user) throw new Error("User not found");

      if (first_name || last_name || phone || gender) {
        const updateObj: any = {};
        if (first_name) updateObj.first_name = first_name;
        if (last_name) updateObj.last_name = last_name;
        if (phone) updateObj.phone = phone;
        if (gender) updateObj.gender = gender;
        await user.update(updateObj, { transaction });
      }

      if (user.role === "super-admin") {
        await transaction.commit();
        return await this.getFlattenedUserProfile(userId, role);
      }

      const [profile, created] = await model.findOrCreate({
        where: { user_id: userId },
        defaults: { ...profileData, user_id: userId },
        transaction,
      });

      if (!created) await profile.update(profileData, { transaction });

      await transaction.commit();
      return await this.getFlattenedUserProfile(userId, role);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async updateStudentProfile(userId: number, data: any) {
    return this.upsertProfile(userId, "student", db.StudentProfile, data);
  }

  static async updateStaffProfile(userId: number, data: any) {
    return this.upsertProfile(userId, "staff", db.StaffProfile, data);
  }

  static async updatePersonalInfo(
    userId: number,
    data: { first_name?: string; last_name?: string, gender?: Gender, phone?: string },
  ) {
    const { first_name, last_name, gender, phone } = data;

    // 1. Build the update object dynamically
    const updateObj: Partial<typeof data> = {};
    if (first_name) updateObj.first_name = first_name;
    if (last_name) updateObj.last_name = last_name;
    if (gender) updateObj.gender = gender
    if (phone) updateObj.phone = phone;

    // If no data is provided, avoid a database call
    if (Object.keys(updateObj).length === 0) {
      throw new Error("No update data provided.");
    }

    // 2. Perform the update
    const [affectedCount] = await db.User.update(updateObj, {
      where: { id: userId },
    });

    if (affectedCount === 0) {
      throw new Error("User not found.");
    }

    // 3. Fetch the updated user to get the role
    // You need to fetch the user first because 'user.role' was undefined in your snippet
    const updatedUser = await db.User.findByPk(userId);

    if (!updatedUser) {
      throw new Error("User not found after update.");
    }

    // 4. Return the flattened profile
    return await this.getFlattenedUserProfile(userId, updatedUser.role);
  }
}
