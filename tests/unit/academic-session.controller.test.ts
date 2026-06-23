import test from "node:test";
import assert from "node:assert/strict";

import { AcademicSessionController } from "../../src/controllers/academic-session.controller.ts";
import { AcademicSessionService } from "../../src/services/academic-session.service.ts";

const createResponse = () => {
  const response: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return response;
};

const withPatchedService = async (
  key: keyof typeof AcademicSessionService,
  value: any,
  fn: () => Promise<void>,
) => {
  const original = (AcademicSessionService as any)[key];
  (AcademicSessionService as any)[key] = value;

  try {
    await fn();
  } finally {
    (AcademicSessionService as any)[key] = original;
  }
};

test("getAllSessions returns session list and count", async () => {
  await withPatchedService("getAllSessions", async () => [{ id: 1 }, { id: 2 }], async () => {
    const res = createResponse();

    await AcademicSessionController.getAllSessions({} as any, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.count, 2);
    assert.equal(res.body.data.length, 2);
  });
});

test("getCurrentSession returns the current session or null", async () => {
  await withPatchedService("getCurrentSession", async () => ({ id: 7, code: "2027/2028" }), async () => {
    const res = createResponse();

    await AcademicSessionController.getCurrentSession({} as any, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.code, "2027/2028");
  });
});

test("createSession maps duplicate sessions to 409", async () => {
  await withPatchedService(
    "createSession",
    async () => ({ ok: false, reason: "SESSION_ALREADY_EXISTS" }),
    async () => {
      const res = createResponse();

      await AcademicSessionController.createSession({ body: {} } as any, res);

      assert.equal(res.statusCode, 409);
      assert.equal(res.body.success, false);
      assert.equal(res.body.reason, "SESSION_ALREADY_EXISTS");
    },
  );
});

test("updateSession maps missing sessions to 404", async () => {
  await withPatchedService(
    "updateSession",
    async () => ({ ok: false, reason: "SESSION_NOT_FOUND" }),
    async () => {
      const res = createResponse();

      await AcademicSessionController.updateSession(
        { params: { id: "3" }, body: {} } as any,
        res,
      );

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.reason, "SESSION_NOT_FOUND");
    },
  );
});

test("setCurrentSession returns updated active session", async () => {
  await withPatchedService(
    "setCurrentSession",
    async (id: number) => ({ ok: true, data: { id, is_active: true } }),
    async () => {
      const res = createResponse();

      await AcademicSessionController.setCurrentSession(
        { params: { id: "9" } } as any,
        res,
      );

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.data.id, 9);
      assert.equal(res.body.data.is_active, true);
    },
  );
});

test("deleteSession maps in-use sessions to 409", async () => {
  await withPatchedService(
    "deleteSession",
    async () => ({ ok: false, reason: "SESSION_IN_USE" }),
    async () => {
      const res = createResponse();

      await AcademicSessionController.deleteSession(
        { params: { id: "9" } } as any,
        res,
      );

      assert.equal(res.statusCode, 409);
      assert.match(res.body.message, /linked to it/i);
    },
  );
});
