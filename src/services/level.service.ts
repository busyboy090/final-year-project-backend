import db from '../models/index.ts';

/**
 * Result type for Level operations
 */
type LevelResult = {
  ok: boolean;
  data?: any;
  reason?: "LEVEL_ALREADY_EXISTS" | "LEVEL_NOT_FOUND";
};

export class LevelService {
  /**
   * Fetch all academic levels
   */
  static async getAllLevels(): Promise<any[]> {
    return await db.Level.findAll({
      order: [['id', 'ASC']]
    });
  }

  /**
   * Create a new academic level with existence check
   */
  static async createLevel(data: { name: string; code: string; category: string }): Promise<LevelResult> {
    try {
      // 1. Check for duplicate code or name
      const existingLevel = await db.Level.findOne({
        where: {
          [db.Sequelize.Op.or]: [{ code: data.code }, { name: data.name }]
        }
      });

      if (existingLevel) return { ok: false, reason: "LEVEL_ALREADY_EXISTS" };

      // 2. Create record
      const newLevel = await db.Level.create(data);
      return { ok: true, data: newLevel };
    } catch (error) {
      console.error("CREATE_LEVEL_SERVICE_ERROR:", error);
      throw error;
    }
  }
}