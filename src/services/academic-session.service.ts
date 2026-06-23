import db from "../models/index.ts";

type SessionPayload = {
  name: string;
  code: string;
  start_date: string | Date;
  end_date: string | Date;
  is_active?: boolean;
};

type SessionResult = {
  ok: boolean;
  data?: any;
  reason?:
    | "SESSION_ALREADY_EXISTS"
    | "SESSION_NOT_FOUND"
    | "INVALID_DATE_RANGE"
    | "SESSION_IN_USE";
};

const normalizePayload = (payload: Partial<SessionPayload>) => {
  const data: any = { ...payload };

  if (payload.start_date) data.start_date = new Date(payload.start_date);
  if (payload.end_date) data.end_date = new Date(payload.end_date);
  if (typeof payload.is_active !== "undefined") {
    data.is_active = Boolean(payload.is_active);
  }

  return data;
};

const hasInvalidDateRange = (payload: Partial<SessionPayload>) => {
  if (!payload.start_date || !payload.end_date) return false;

  const start = new Date(payload.start_date);
  const end = new Date(payload.end_date);

  return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end;
};

export class AcademicSessionService {
  static async getAllSessions(): Promise<any[]> {
    return db.AcademicSession.findAll({
      order: [
        ["start_date", "DESC"],
        ["id", "DESC"],
      ],
    });
  }

  static async getCurrentSession(): Promise<any | null> {
    return db.AcademicSession.findOne({
      where: { is_active: true },
      order: [["start_date", "DESC"]],
    });
  }

  static async createSession(payload: SessionPayload): Promise<SessionResult> {
    if (hasInvalidDateRange(payload)) {
      return { ok: false, reason: "INVALID_DATE_RANGE" };
    }

    const existingSession = await db.AcademicSession.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ code: payload.code }, { name: payload.name }],
      },
    });

    if (existingSession) return { ok: false, reason: "SESSION_ALREADY_EXISTS" };

    const session = await db.sequelize.transaction(async (transaction: any) => {
      if (payload.is_active) {
        await db.AcademicSession.update(
          { is_active: false },
          { where: {}, transaction },
        );
      }

      return db.AcademicSession.create(normalizePayload(payload), { transaction });
    });

    return { ok: true, data: session };
  }

  static async updateSession(
    id: number,
    payload: Partial<SessionPayload>,
  ): Promise<SessionResult> {
    const session = await db.AcademicSession.findByPk(id);
    if (!session) return { ok: false, reason: "SESSION_NOT_FOUND" };

    if (hasInvalidDateRange({
      start_date: payload.start_date ?? session.start_date,
      end_date: payload.end_date ?? session.end_date,
      name: session.name,
      code: session.code,
    })) {
      return { ok: false, reason: "INVALID_DATE_RANGE" };
    }

    if (payload.name || payload.code) {
      const existingSession = await db.AcademicSession.findOne({
        where: {
          id: { [db.Sequelize.Op.ne]: id },
          [db.Sequelize.Op.or]: [
            ...(payload.code ? [{ code: payload.code }] : []),
            ...(payload.name ? [{ name: payload.name }] : []),
          ],
        },
      });

      if (existingSession) return { ok: false, reason: "SESSION_ALREADY_EXISTS" };
    }

    const updatedSession = await db.sequelize.transaction(async (transaction: any) => {
      if (payload.is_active) {
        await db.AcademicSession.update(
          { is_active: false },
          { where: { id: { [db.Sequelize.Op.ne]: id } }, transaction },
        );
      }

      return session.update(normalizePayload(payload), { transaction });
    });

    return { ok: true, data: updatedSession };
  }

  static async setCurrentSession(id: number): Promise<SessionResult> {
    const session = await db.AcademicSession.findByPk(id);
    if (!session) return { ok: false, reason: "SESSION_NOT_FOUND" };

    const updatedSession = await db.sequelize.transaction(async (transaction: any) => {
      await db.AcademicSession.update(
        { is_active: false },
        { where: {}, transaction },
      );

      return session.update({ is_active: true }, { transaction });
    });

    return { ok: true, data: updatedSession };
  }

  static async deleteSession(id: number): Promise<SessionResult> {
    const session = await db.AcademicSession.findByPk(id);
    if (!session) return { ok: false, reason: "SESSION_NOT_FOUND" };

    const eventCount = await db.Event.count({ where: { session_id: id } });
    if (eventCount > 0) return { ok: false, reason: "SESSION_IN_USE" };

    await session.destroy();
    return { ok: true, data: { message: "Academic session deleted." } };
  }
}
