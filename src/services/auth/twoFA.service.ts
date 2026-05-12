import db from "../../models/index.ts";

export const TwoFAService = {
  updateToggle: async (userId: number, isEnabled: boolean) => {
    // Perform the update
    const [affectedCount] = await db.User.update(
      { two_factor_enabled: isEnabled },
      { where: { id: userId } }
    );

    if (affectedCount === 0) return null;

    // Fetch and return the updated user record
    return await db.User.findByPk(userId, {
      attributes: ['id', 'two_factor_enabled', 'email']
    });
  },
};