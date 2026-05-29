import type { RegistryUserRow } from "../types/userManagement";

export function serializeUserRow(user: any): RegistryUserRow {
  // ✅ role is a plain column, not a junction array
  const role = user.role ?? null;

  const profile =
    user.studentProfile        ||
    user.staffProfile          ||
    user.eventOrganiserProfile;

  let departmentName: string | null = null;
  let departmentId: number | null = null;

  if (profile?.department) {
    departmentName = profile.department.name;
    departmentId   = profile.department.id;
  }

  return {
    id:                  user.id,
    first_name:          user.first_name,
    last_name:           user.last_name,
    email:               user.email,
    profile_picture_url: user.profile_picture_url,
    is_active:           user.is_active,
    email_verified:      user.email_verified,
    role,
    department_id:       departmentId,
    department_name:     departmentName ?? "—",
    organisation_id:    profile?.organisation_id ?? null,
    organisation_name:  profile?.organisation?.name ?? "—",
    faculty_id:       profile?.faculty_id ?? null,
    faculty_name:     profile?.faculty?.name ?? "—",
  };
}