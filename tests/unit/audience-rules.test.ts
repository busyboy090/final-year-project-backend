import test from "node:test";
import assert from "node:assert/strict";

import {
  canManageAllEvents,
  eventMatchesAudienceProfile,
  normalizeAudienceRules,
  type AudienceUserProfile,
} from "../../src/services/event/audience-rules.ts";

test("normalizeAudienceRules strips invalid cross-role fields and removes duplicates", () => {
  const rules = normalizeAudienceRules([
    {
      role: "staff",
      staff_type: "academic-staff",
      level_id: 400,
      gender: "female",
    },
    {
      role: "staff",
      staff_type: "academic-staff",
      level_id: 300,
      gender: "female",
    },
    {
      role: "student",
      staff_type: "non-academic-staff",
      level_id: 4,
      gender: null,
    },
  ]);

  assert.deepEqual(rules, [
    {
      role: "staff",
      staff_type: "academic-staff",
      level_id: null,
      gender: "female",
    },
    {
      role: "student",
      staff_type: null,
      level_id: 4,
      gender: null,
    },
  ]);
});

test("canManageAllEvents allows admins and event organisers to bypass audience filters", () => {
  assert.equal(
    canManageAllEvents({
      role: "super-admin",
      gender: null,
      staff_type: null,
      level_id: null,
    }),
    true,
  );
  assert.equal(
    canManageAllEvents({
      role: "event-organiser",
      gender: null,
      staff_type: null,
      level_id: null,
    }),
    true,
  );
  assert.equal(
    canManageAllEvents({
      role: "student",
      gender: "male",
      staff_type: null,
      level_id: 1,
    }),
    false,
  );
});

test("eventMatchesAudienceProfile allows non-custom events for staff and students", () => {
  const profile: AudienceUserProfile = {
    role: "student",
    gender: "female",
    staff_type: null,
    level_id: 2,
  };

  assert.equal(
    eventMatchesAudienceProfile({ audience_scope: "all", audienceRules: [] }, profile),
    true,
  );
});

test("eventMatchesAudienceProfile matches academic staff by staff type and gender", () => {
  const event = {
    audience_scope: "custom",
    audienceRules: [
      {
        role: "staff",
        staff_type: "academic-staff",
        level_id: null,
        gender: "female",
      },
    ],
  };

  assert.equal(
    eventMatchesAudienceProfile(event, {
      role: "staff",
      gender: "female",
      staff_type: "academic-staff",
      level_id: null,
    }),
    true,
  );
  assert.equal(
    eventMatchesAudienceProfile(event, {
      role: "staff",
      gender: "female",
      staff_type: "non-academic-staff",
      level_id: null,
    }),
    false,
  );
  assert.equal(
    eventMatchesAudienceProfile(event, {
      role: "staff",
      gender: "male",
      staff_type: "academic-staff",
      level_id: null,
    }),
    false,
  );
});

test("eventMatchesAudienceProfile matches student by level and gender", () => {
  const event = {
    audience_scope: "custom",
    audienceRules: [
      {
        role: "student",
        staff_type: null,
        level_id: 4,
        gender: "female",
      },
    ],
  };

  assert.equal(
    eventMatchesAudienceProfile(event, {
      role: "student",
      gender: "female",
      staff_type: null,
      level_id: 4,
    }),
    true,
  );
  assert.equal(
    eventMatchesAudienceProfile(event, {
      role: "student",
      gender: "female",
      staff_type: null,
      level_id: 3,
    }),
    false,
  );
});

test("eventMatchesAudienceProfile treats null rule dimensions as wildcard", () => {
  const event = {
    audience_scope: "custom",
    audienceRules: [
      {
        role: "student",
        staff_type: null,
        level_id: null,
        gender: null,
      },
    ],
  };

  assert.equal(
    eventMatchesAudienceProfile(event, {
      role: "student",
      gender: "other",
      staff_type: null,
      level_id: 1,
    }),
    true,
  );
});
