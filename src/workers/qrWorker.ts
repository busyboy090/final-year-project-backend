import qrQueue from "../queues/qrQueue.ts";
import { sendEventRegistrationWithQR } from "../services/mail/qrMail.service.ts";

qrQueue.process(async (job: any) => {
  const payload = job.data;
  try {
    await sendEventRegistrationWithQR(payload);
    return Promise.resolve();
  } catch (err) {
    console.error("QR_WORKER_ERROR:", err);
    return Promise.reject(err);
  }
});

export default qrQueue;
