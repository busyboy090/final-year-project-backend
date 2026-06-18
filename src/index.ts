import app from "./app.ts";
import env from "./config/env.ts";

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
