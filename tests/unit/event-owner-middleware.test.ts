import test from "node:test";
import assert from "node:assert/strict";

import db from "../../src/models/index.ts";
import { verifyEventOwner } from "../../src/middlewares/event.ts";

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

const withPatchedEventLookup = async (value: any, fn: () => Promise<void>) => {
  const original = db.Event.findByPk;
  db.Event.findByPk = async () => value;

  try {
    await fn();
  } finally {
    db.Event.findByPk = original;
  }
};

test("verifyEventOwner rejects requests without an event id", async () => {
  const res = createResponse();
  let nextCalled = false;

  await verifyEventOwner({ params: {}, query: {}, user: { userId: 1 } } as any, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(nextCalled, false);
});

test("verifyEventOwner returns 404 when event does not exist", async () => {
  await withPatchedEventLookup(null, async () => {
    const res = createResponse();
    let nextCalled = false;

    await verifyEventOwner(
      { params: { id: "10" }, query: {}, user: { userId: 1 } } as any,
      res,
      () => {
        nextCalled = true;
      },
    );

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Event not found");
    assert.equal(nextCalled, false);
  });
});

test("verifyEventOwner lets super-admins bypass ownership exactly once", async () => {
  await withPatchedEventLookup({ id: 10, created_by: 99 }, async () => {
    const res = createResponse();
    let nextCount = 0;

    await verifyEventOwner(
      { params: { id: "10" }, query: {}, user: { userId: 1, role: "super-admin" } } as any,
      res,
      () => {
        nextCount += 1;
      },
    );

    assert.equal(nextCount, 1);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body, undefined);
  });
});

test("verifyEventOwner allows event creators", async () => {
  await withPatchedEventLookup({ id: 10, created_by: 4 }, async () => {
    const res = createResponse();
    let nextCalled = false;

    await verifyEventOwner(
      { params: { id: "10" }, query: {}, user: { userId: 4, role: "event-organiser" } } as any,
      res,
      () => {
        nextCalled = true;
      },
    );

    assert.equal(nextCalled, true);
    assert.equal(res.body, undefined);
  });
});

test("verifyEventOwner rejects non-owner organisers", async () => {
  await withPatchedEventLookup({ id: 10, created_by: 4 }, async () => {
    const res = createResponse();
    let nextCalled = false;

    await verifyEventOwner(
      { params: { id: "10" }, query: {}, user: { userId: 5, role: "event-organiser" } } as any,
      res,
      () => {
        nextCalled = true;
      },
    );

    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /permission/i);
    assert.equal(nextCalled, false);
  });
});
