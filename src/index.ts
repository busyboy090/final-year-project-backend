import app from "./app.ts";
import env from "./config/env.ts";
import qrQueue from "./workers/qrWorker.ts";

const PORT = env.PORT;

qrQueue.on("ready", () => {
  console.log("[worker]: qrQueue worker connected to Redis and processing jobs");
});
qrQueue.on("error", (err: Error) => {
  console.error("[worker]: qrQueue connection error:", err.message);
});

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});