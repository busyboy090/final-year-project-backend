import test from "node:test";
import assert from "node:assert/strict";

import {
  eventSchema,
  updateEventSchema,
  updateEventStatusSchema,
} from "../../src/validators/event/create.schema.ts";

const validCreateBody = {
  title: "Annual Academic Research Symposium",
  description: "A detailed academic symposium for faculty, staff, and students.",
  venue_id: "1",
  session_id: "2",
  capacity: "50",
  category: "Academic Conference",
  thumbnail: {},
  startDate: "2026-07-01",
  startTime: "10:00",
  endDate: "2026-07-01",
  endTime: "12:00",
  audience_scope: "all",
  audience_rules: "[]",
};

test("eventSchema accepts valid create payloads and parses audience rules", async () => {
  const result = await eventSchema.parseAsync({
    body: {
      ...validCreateBody,
      audience_scope: "custom",
      audience_rules:
        '[{"role":"student","staff_type":null,"level_id":4,"gender":"female"}]',
    },
  });

  assert.equal(result.body.session_id, "2");
  assert.deepEqual(result.body.audience_rules, [
    {
      role: "student",
      staff_type: null,
      level_id: 4,
      gender: "female",
    },
  ]);
});

test("eventSchema rejects invalid date ranges", async () => {
  await assert.rejects(
    () =>
      eventSchema.parseAsync({
        body: {
          ...validCreateBody,
          startDate: "2026-07-01",
          startTime: "12:00",
          endDate: "2026-07-01",
          endTime: "10:00",
        },
      }),
    (error: any) =>
      error.issues.some((issue: any) =>
        String(issue.message).includes("End date and time must be after"),
      ),
  );
});

test("eventSchema rejects custom audiences without at least one rule", async () => {
  await assert.rejects(
    () =>
      eventSchema.parseAsync({
        body: {
          ...validCreateBody,
          audience_scope: "custom",
          audience_rules: "[]",
        },
      }),
    (error: any) =>
      error.issues.some((issue: any) =>
        String(issue.message).includes("Select at least one audience rule"),
      ),
  );
});

test("eventSchema rejects cross-role audience rule fields", async () => {
  await assert.rejects(
    () =>
      eventSchema.parseAsync({
        body: {
          ...validCreateBody,
          audience_scope: "custom",
          audience_rules:
            '[{"role":"staff","staff_type":"academic-staff","level_id":4,"gender":null}]',
        },
      }),
    (error: any) =>
      error.issues.some((issue: any) =>
        String(issue.message).includes("Staff audience rules cannot include"),
      ),
  );
});

test("updateEventSchema accepts partial session and schedule updates", async () => {
  const result = await updateEventSchema.parseAsync({
    params: { id: "12" },
    body: {
      session_id: "3",
      startDate: "2026-08-01",
      startTime: "09:00",
      endDate: "2026-08-01",
      endTime: "11:00",
    },
  });

  assert.equal(result.params.id, 12);
  assert.equal(result.body.session_id, "3");
});

test("updateEventStatusSchema only accepts approved or rejected statuses", async () => {
  await assert.doesNotReject(() =>
    updateEventStatusSchema.parseAsync({
      params: { id: "8" },
      body: { status: "approved" },
    }),
  );

  await assert.rejects(() =>
    updateEventStatusSchema.parseAsync({
      params: { id: "8" },
      body: { status: "cancelled" },
    }),
  );
});
