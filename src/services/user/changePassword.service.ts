// src/services/UserService.ts
import bcrypt from "bcrypt";
import db from "../../models/index.ts";

export default async function changePassword(
  userId: number,
  data: { current_p: string; new_p: string },
) {
  const { current_p, new_p } = data;

  // 1. Fetch user including the password hash
  const user = await db.User.scope("withSecrets").findByPk(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  // 2. Verify current password
  const isMatch = await bcrypt.compare(current_p, user.password);
  if (!isMatch) {
    throw new Error("Incorrect current password.");
  }

  // 3. Prevent using the same password
  const isSameAsOld = await bcrypt.compare(new_p, user.password);
  if (isSameAsOld) {
    throw new Error("New password cannot be the same as the current one.");
  }

  // 4. Hash the new password
  const hashedPassword = await bcrypt.hash(new_p, 10);

  // 5. Update and save
  user.password = hashedPassword;
  await user.save();

  return { message: "Password updated successfully" };
}
