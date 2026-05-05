'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Sequelize, DataTypes } from 'sequelize';
import configs from '../config/db.ts';
import env from '../config/env.ts';

// Recreate __filename and __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

const dbConfig = (configs as any)[env.NODE_ENV || 'development'];
const db: any = {};

let sequelize: Sequelize;

if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable]!, dbConfig);
} else {
  sequelize = new Sequelize(
    dbConfig.database!,
    dbConfig.username!,
    dbConfig.password,
    dbConfig
  );
}

// Auto-loading models using dynamic import() instead of require()
const files = fs.readdirSync(__dirname).filter((file) => {
  return (
    file.indexOf('.') !== 0 &&
    file !== basename &&
    (file.slice(-3) === '.ts' || file.slice(-3) === '.js') &&
    file.indexOf('.test.ts') === -1
  );
});

for (const file of files) {
  // ESM requires file URLs for dynamic imports on Windows
  const fileUrl = pathToFileURL(path.join(__dirname, file)).href;
  const modelModule = await import(fileUrl);
  const modelDefiner = modelModule.default || modelModule;
  
  const model = modelDefiner(sequelize, DataTypes);
  db[model.name] = model;
}

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;