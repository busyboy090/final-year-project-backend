import db from "../../models/index.ts";

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

type AudienceUserProfile = {
  role: string;
  gender: AudienceGender | null;
  staff_type: StaffType | null;
  level_id: number | null;
};

type AudienceCheckResult = {
  ok: boolean;
  reason?: "EVENT_NOT_FOUND" | "AUDIENCE_RESTRICTED";
};

export class EventAudienceService {
  static normalizeRules(rules: AudienceRuleInput[] = []): AudienceRuleInput[] {
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

  static async replaceRules(
    eventId: number,
    audienceScope: AudienceScope,
    rules: AudienceRuleInput[] = [],
    options: any = {},
  ) {
    await db.EventAudienceRule.destroy({
      where: { event_id: eventId },
      transaction: options.transaction,
    });

    if (audienceScope !== "custom") return;

    const rows = this.normalizeRules(rules).map((rule) => ({
      event_id: eventId,
      role: rule.role,
      staff_type: rule.staff_type ?? null,
      level_id: rule.level_id ?? null,
      gender: rule.gender ?? null,
    }));

    if (rows.length > 0) {
      await db.EventAudienceRule.bulkCreate(rows, {
        transaction: options.transaction,
      });
    }
  }

  static async getUserAudienceProfile(
    userId: number,
  ): Promise<AudienceUserProfile | null> {
    const user = await db.User.findByPk(userId, {
      include: [
        {
          model: db.StudentProfile,
          as: "studentProfile",
          attributes: ["level_id"],
          required: false,
        },
        {
          model: db.StaffProfile,
          as: "staffProfile",
          attributes: ["staff_type"],
          required: false,
        },
      ],
    });

    if (!user) return null;

    return {
      role: user.role,
      gender: user.gender ?? null,
      staff_type: user.staffProfile?.staff_type ?? null,
      level_id: user.studentProfile?.level_id ?? null,
    };
  }

  static canManageAllEvents(profile: AudienceUserProfile | null) {
    return (
      profile?.role === "super-admin" ||
      profile?.role === "event-organiser"
    );
  }

  static eventMatchesProfile(event: any, profile: AudienceUserProfile | null) {
    if (!profile) return false;
    if (this.canManageAllEvents(profile)) return true;
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

  static async canUserAccessEvent(
    eventId: number,
    userId: number,
  ): Promise<AudienceCheckResult> {
    const event = await db.Event.findByPk(eventId, {
      include: [{ model: db.EventAudienceRule, as: "audienceRules" }],
    });

    if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };

    const profile = await this.getUserAudienceProfile(userId);
    if (this.eventMatchesProfile(event, profile)) return { ok: true };

    return { ok: false, reason: "AUDIENCE_RESTRICTED" };
  }

  static async filterEventsForUser(events: any[], userId?: number) {
    if (!userId) return events;

    const profile = await this.getUserAudienceProfile(userId);
    if (this.canManageAllEvents(profile)) return events;

    return events.filter((event) => this.eventMatchesProfile(event, profile));
  }
}
