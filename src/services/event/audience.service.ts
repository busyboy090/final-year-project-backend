import db from "../../models/index.ts";
import {
  canManageAllEvents,
  eventMatchesAudienceProfile,
  normalizeAudienceRules,
  type AudienceRuleInput,
  type AudienceScope,
  type AudienceUserProfile,
} from "./audience-rules.ts";

type AudienceCheckResult = {
  ok: boolean;
  reason?: "EVENT_NOT_FOUND" | "AUDIENCE_RESTRICTED";
};

export class EventAudienceService {
  static normalizeRules(rules: AudienceRuleInput[] = []): AudienceRuleInput[] {
    return normalizeAudienceRules(rules);
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
    return canManageAllEvents(profile);
  }

  static eventMatchesProfile(event: any, profile: AudienceUserProfile | null) {
    return eventMatchesAudienceProfile(event, profile);
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
