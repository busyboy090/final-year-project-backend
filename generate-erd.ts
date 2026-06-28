import SequelizeErd from "sequelize-erd";
import db from "./src/models/index.ts";
import fs from "fs";
import path from "path";

console.log("Starting...");

try {
  const svg = await SequelizeErd({
    source: db.sequelize,
  });

  const outputPath = path.resolve("./ERD.svg");
  fs.writeFileSync(outputPath, svg);

  console.log("ERD saved to:", outputPath);
} catch (error) {
  console.error("Error:", error);
}