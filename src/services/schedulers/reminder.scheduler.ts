import db from "../../models/index.ts";
import qrQueue from "../../queues/qrQueue.ts";

// Simple scheduler to enqueue reminder emails for events starting within the next X hours
export const enqueueEventReminders = async (hoursBefore = 24) => {
  const now = new Date();
  const target = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);

  const events = await db.Event.findAll({
    where: {
      status: "approved",
      start_date: { [db.Sequelize.Op.between]: [now, target] },
    },
    include: [],
  });

  for (const event of events) {
    // find enrollments that haven't received reminders
    const enrollments = await db.EventEnrollment.findAll({
      where: { event_id: event.id, reminder_sent_at: null },
    });

    for (const enrollment of enrollments) {
      const user = await db.User.findByPk(enrollment.user_id);
      if (!user) continue;

      const payload = {
        to: user.email ?? "no-reply",
        firstName: user.first_name ?? "",
        eventTitle: String(event.title),
        eventDate: String(event.start_date),
        venue: "",
      };

      // enqueue reminder job
      if (qrQueue && typeof qrQueue.add === "function") {
        await qrQueue.add({ jobType: "reminder", payload }, { attempts: 2 });
      }

      // mark reminder_sent_at to avoid duplicate sends
      await enrollment.update({ reminder_sent_at: new Date() } as any);
    }
  }
};

export default enqueueEventReminders;
