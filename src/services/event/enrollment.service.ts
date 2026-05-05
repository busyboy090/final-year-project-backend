import db from '../../models/index.ts';

type EnrollmentResult = {
  ok: boolean;
  data?: any;
  reason?: "EVENT_NOT_FOUND" | "EVENT_NOT_APPROVED" | "ALREADY_ENROLLED" | "EVENT_FULL" | "INTERNAL_SERVER_ERROR";
};

export class EnrollmentService {
  /**
   * Enrolls a student or staff member in an event
   */
  static async enrollInEvent(eventId: number, userId: number): Promise<EnrollmentResult> {
    try {
      // 1. Verify event exists and is approved
      const event = await db.Event.findByPk(eventId);
      if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };
      if (event.status !== 'approved') return { ok: false, reason: "EVENT_NOT_APPROVED" };

      // 2. Prevent duplicate enrollment
      const existing = await db.EventEnrollment.findOne({
        where: { event_id: eventId, user_id: userId }
      });
      if (existing) return { ok: false, reason: "ALREADY_ENROLLED" };

      // 3. Check venue capacity limits
      const count = await db.EventEnrollment.count({ where: { event_id: eventId } });
      if (event.capacity && count >= event.capacity) {
        return { ok: false, reason: "EVENT_FULL" };
      }

      // 4. Create enrollment record
      const enrollment = await db.EventEnrollment.create({
        event_id: eventId,
        user_id: userId,
        status: 'confirmed'
      });

      return { ok: true, data: enrollment };
    } catch (error) {
      console.error("ENROLLMENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Fetches the authenticated user's personal event schedule
   */
  static async getMyEnrollments(userId: number) {
    return await db.EventEnrollment.findAll({
      where: { user_id: userId },
      include: [{ 
        model: db.Event, 
        as: 'event',
        include: ['eventVenue'] 
      }]
    });
  }
}