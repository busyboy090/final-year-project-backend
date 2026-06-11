import qrQueue from "../queues/qrQueue.ts";
import { sendEventRegistrationWithQR } from "../services/mail/qrMail.service.ts";
import { sendEventCancellationEmail } from "../services/mail/cancellation.service.ts";
import { sendEventReminderEmail } from "../services/mail/reminder.service.ts";

qrQueue.process(async (job: any) => {
  const jobType = job.data?.jobType || job.opts?.jobType || "registration";
  const payload = job.data?.payload || job.data;
  try {
    if (jobType === "registration" || jobType === "regeneration") {
      await sendEventRegistrationWithQR(payload);
      return Promise.resolve();
    }

    if (jobType === "cancellation") {
      await sendEventCancellationEmail(payload);
      return Promise.resolve();
    }

    if (jobType === "reminder") {
      await sendEventReminderEmail(payload);
      return Promise.resolve();
    }

    // Unknown job type: attempt to send as registration fallback
    await sendEventRegistrationWithQR(payload);
    return Promise.resolve();
  } catch (err) {
    console.error("QR_WORKER_ERROR:", err);
    return Promise.reject(err);
  }
});

export default qrQueue;
