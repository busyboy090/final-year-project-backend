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

  /**
   * Mark user as checked-in to an event
   */
  static async checkInToEvent(enrollmentId: number, userId: number): Promise<EnrollmentResult> {
    try {
      const enrollment = await db.EventEnrollment.findByPk(enrollmentId);
      if (!enrollment) return { ok: false, reason: "EVENT_NOT_FOUND" };

      // Verify ownership
      if (enrollment.user_id !== userId) {
        return { ok: false, reason: "INTERNAL_SERVER_ERROR" };
      }

      // Update check-in time
      await enrollment.update({
        check_in_time: new Date(),
        status: 'attended'
      });

      return { ok: true, data: enrollment };
    } catch (error) {
      console.error("CHECK_IN_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Cancel enrollment (unenroll from event)
   */
  static async cancelEnrollment(enrollmentId: number, userId: number): Promise<EnrollmentResult> {
    try {
      const enrollment = await db.EventEnrollment.findByPk(enrollmentId);
      if (!enrollment) return { ok: false, reason: "EVENT_NOT_FOUND" };

      // Verify ownership
      if (enrollment.user_id !== userId) {
        return { ok: false, reason: "INTERNAL_SERVER_ERROR" };
      }

      // Update status to cancelled
      await enrollment.update({ status: 'cancelled' });

      return { ok: true, data: { message: "Enrollment cancelled", enrollment } };
    } catch (error) {
      console.error("CANCEL_ENROLLMENT_SERVICE_ERROR:", error);
      throw error;
    }
  }

  /**
   * Get event attendance statistics
   */
  static async getEventAttendanceStats(eventId: number): Promise<EnrollmentResult> {
    try {
      const event = await db.Event.findByPk(eventId);
      if (!event) return { ok: false, reason: "EVENT_NOT_FOUND" };

      const totalEnrollments = await db.EventEnrollment.count({ where: { event_id: eventId } });
      const attended = await db.EventEnrollment.count({ 
        where: { event_id: eventId, status: 'attended' } 
      });
      const cancelled = await db.EventEnrollment.count({ 
        where: { event_id: eventId, status: 'cancelled' } 
      });

      const stats = {
        event_id: eventId,
        total_enrolled: totalEnrollments,
        total_attended: attended,
        total_cancelled: cancelled,
        no_show: totalEnrollments - attended - cancelled,
        attendance_rate: totalEnrollments > 0 ? ((attended / totalEnrollments) * 100).toFixed(2) : 0
      };

      return { ok: true, data: stats };
    } catch (error) {
      console.error("ATTENDANCE_STATS_SERVICE_ERROR:", error);
      throw error;
    }
  }
}