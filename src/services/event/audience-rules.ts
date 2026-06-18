export type AudienceRole = "staff" | "student";
export type AudienceScope = "all" | "custom";
export type AudienceGender = "male" | "female" | "other";
export type StaffType = "academic-staff" | "non-academic-staff";

export type AudienceRuleInput = {
  role: AudienceRole;
  staff_type?: StaffType | null;
  level_id?: number | null;
  gender?: AudienceGender | null;
};

export type AudienceUserProfile = {
  role: string;
  gender: AudienceGender | null;
  staff_type: StaffType | null;
  level_id: number | null;
};

export function normalizeAudienceRules(
  rules: AudienceRuleInput[] = [],
): AudienceRuleInput[] {
  const seen = new Set<string>();

  return rules
    .map((rule) => ({
      role: rule.role,
      staff_type: rule.role === "staff" ? rule.staff_type ?? null : null,
      level_id: rule.role === "student" ? rule.level_id ?? null : null,
      gender: rule.gender ?? null,
    }))
    .filter((rule) => {
      const key = [
        rule.role,
        rule.staff_type ?? "any-staff",
        rule.level_id ?? "any-level",
        rule.gender ?? "any-gender",
      ].join(":");

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function canManageAllEvents(profile: AudienceUserProfile | null) {
  return (
    profile?.role === "super-admin" ||
    profile?.role === "event-organiser"
  );
}

export function eventMatchesAudienceProfile(
  event: any,
  profile: AudienceUserProfile | null,
) {
  if (!profile) return false;
  if (canManageAllEvents(profile)) return true;
  if (event.audience_scope !== "custom") return true;
  if (!["staff", "student"].includes(profile.role)) return false;

  const rules = event.audienceRules ?? [];
  if (!Array.isArray(rules) || rules.length === 0) return false;

  return rules.some((rule: any) => {
    if (rule.role !== profile.role) return false;
    if (rule.gender && rule.gender !== profile.gender) return false;

    if (rule.role === "staff") {
      return !rule.staff_type || rule.staff_type === profile.staff_type;
    }

    if (rule.role === "student") {
      return !rule.level_id || Number(rule.level_id) === profile.level_id;
    }

    return false;
  });
}
