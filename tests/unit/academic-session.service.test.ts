import test from "node:test";
import assert from "node:assert/strict";

import db from "../../src/models/index.ts";
import { AcademicSessionService } from "../../src/services/academic-session.service.ts";

type PatchMap = Array<[Record<string, any>, string, any]>;

const withPatchedDb = async (patches: PatchMap, fn: () => Promise<void>) => {
  const originals = patches.map(([target, key]) => [target, key, target[key]] as const);

  patches.forEach(([target, key, value]) => {
    target[key] = value;
  });

  try {
    await fn();
  } finally {
    originals.forEach(([target, key, value]) => {
      target[key] = value;
    });
  }
};

test("getAllSessions returns sessions ordered by newest start date", async () => {
  let order: unknown;

  await withPatchedDb(
    [
      [
        db.AcademicSession,
        "findAll",
        async (options: any) => {
          order = options.order;
          return [{ id: 1 }];
        },
      ],
    ],
    async () => {
      const result = await AcademicSessionService.getAllSessions();
      assert.deepEqual(result, [{ id: 1 }]);
      assert.deepEqual(order, [
        ["start_date", "DESC"],
        ["id", "DESC"],
      ]);
    },
  );
});

test("getCurrentSession returns the active academic session", async () => {
  let where: unknown;

  await withPatchedDb(
    [
      [
        db.AcademicSession,
        "findOne",
        async (options: any) => {
          where = options.where;
          return { id: 2, code: "2026/2027" };
        },
      ],
    ],
    async () => {
      const result = await AcademicSessionService.getCurrentSession();
      assert.deepEqual(where, { is_active: true });
      assert.equal(result.code, "2026/2027");
    },
  );
});

test("createSession rejects invalid date ranges before writing", async () => {
  await withPatchedDb(
    [
      [
        db.AcademicSession,
        "findOne",
        async () => {
          throw new Error("should not query duplicates for invalid dates");
        },
      ],
    ],
    async () => {
      const result = await AcademicSessionService.createSession({
        name: "Invalid Session",
        code: "BAD",
        start_date: "2026-09-01",
        end_date: "2026-08-31",
      });

      assert.deepEqual(result, { ok: false, reason: "INVALID_DATE_RANGE" });
    },
  );
});

test("createSession prevents duplicate names or codes", async () => {
  await withPatchedDb(
    [
      [db.AcademicSession, "findOne", async () => ({ id: 4 })],
    ],
    async () => {
      const result = await AcademicSessionService.createSession({
        name: "2026/2027 Academic Session",
        code: "2026/2027",
        start_date: "2026-09-01",
        end_date: "2027-07-31",
      });

      assert.deepEqual(result, { ok: false, reason: "SESSION_ALREADY_EXISTS" });
    },
  );
});

test("createSession clears existing active sessions before creating a current session", async () => {
  const calls: string[] = [];
  let createdPayload: any;
  let createOptions: any;

  await withPatchedDb(
    [
      [db.AcademicSession, "findOne", async () => null],
      [
        db.AcademicSession,
        "update",
        async (payload: any, options: any) => {
          calls.push(`update:${payload.is_active}:${options.transaction}`);
          return [2];
        },
      ],
      [
        db.AcademicSession,
        "create",
        async (payload: any, options: any) => {
          createdPayload = payload;
          createOptions = options;
          calls.push(`create:${payload.is_active}:${options.transaction}`);
          return { id: 5, ...payload };
        },
      ],
      [
        db.sequelize,
        "transaction",
        async (callback: any) => callback("tx"),
      ],
    ],
    async () => {
      const result = await AcademicSessionService.createSession({
        name: "2026/2027 Academic Session",
        code: "2026/2027",
        start_date: "2026-09-01",
        end_date: "2027-07-31",
        is_active: true,
      });

      assert.equal(result.ok, true);
      assert.deepEqual(calls, ["update:false:tx", "create:true:tx"]);
      assert.ok(createdPayload.start_date instanceof Date);
      assert.ok(createdPayload.end_date instanceof Date);
      assert.equal(createOptions.transaction, "tx");
    },
  );
});

test("updateSession returns SESSION_NOT_FOUND for missing sessions", async () => {
  await withPatchedDb(
    [[db.AcademicSession, "findByPk", async () => null]],
    async () => {
      const result = await AcademicSessionService.updateSession(77, {
        name: "Missing",
      });
      assert.deepEqual(result, { ok: false, reason: "SESSION_NOT_FOUND" });
    },
  );
});

test("updateSession clears other current sessions when activated", async () => {
  const session = {
    id: 10,
    name: "2025/2026 Academic Session",
    code: "2025/2026",
    start_date: new Date("2025-09-01"),
    end_date: new Date("2026-07-31"),
    update: async (payload: any, options: any) => ({
      id: 10,
      ...payload,
      transaction: options.transaction,
    }),
  };
  let updateWhere: any;

  await withPatchedDb(
    [
      [db.AcademicSession, "findByPk", async () => session],
      [db.AcademicSession, "findOne", async () => null],
      [
        db.AcademicSession,
        "update",
        async (_payload: any, options: any) => {
          updateWhere = options.where;
          return [1];
        },
      ],
      [db.sequelize, "transaction", async (callback: any) => callback("tx")],
    ],
    async () => {
      const result = await AcademicSessionService.updateSession(10, {
        code: "2025/2026",
        is_active: true,
      });

      assert.equal(result.ok, true);
      assert.equal(result.data.transaction, "tx");
      assert.deepEqual(updateWhere.id[db.Sequelize.Op.ne], 10);
    },
  );
});

test("setCurrentSession activates one session and clears all others", async () => {
  const session = {
    id: 3,
    update: async (payload: any, options: any) => ({
      id: 3,
      ...payload,
      transaction: options.transaction,
    }),
  };
  let clearCalled = false;

  await withPatchedDb(
    [
      [db.AcademicSession, "findByPk", async () => session],
      [
        db.AcademicSession,
        "update",
        async (payload: any, options: any) => {
          clearCalled = payload.is_active === false && options.transaction === "tx";
          return [5];
        },
      ],
      [db.sequelize, "transaction", async (callback: any) => callback("tx")],
    ],
    async () => {
      const result = await AcademicSessionService.setCurrentSession(3);

      assert.equal(result.ok, true);
      assert.equal(result.data.is_active, true);
      assert.equal(clearCalled, true);
    },
  );
});

test("deleteSession refuses sessions linked to events", async () => {
  await withPatchedDb(
    [
      [db.AcademicSession, "findByPk", async () => ({ id: 2 })],
      [db.Event, "count", async () => 4],
    ],
    async () => {
      const result = await AcademicSessionService.deleteSession(2);
      assert.deepEqual(result, { ok: false, reason: "SESSION_IN_USE" });
    },
  );
});

test("deleteSession destroys unused sessions", async () => {
  let destroyed = false;

  await withPatchedDb(
    [
      [
        db.AcademicSession,
        "findByPk",
        async () => ({
          id: 2,
          destroy: async () => {
            destroyed = true;
          },
        }),
      ],
      [db.Event, "count", async () => 0],
    ],
    async () => {
      const result = await AcademicSessionService.deleteSession(2);

      assert.equal(result.ok, true);
      assert.equal(destroyed, true);
      assert.equal(result.data.message, "Academic session deleted.");
    },
  );
});
