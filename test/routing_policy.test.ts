import assert from "node:assert/strict";
import test from "node:test";
import { routingPreferenceFor } from "../src/routing_policy.ts";

test("excludes the selected provider only for donor receipts", () => {
  const receipt = routingPreferenceFor({
    kind: "donor_receipt",
    donorId: "donor_1042",
    donationId: "gift_8821",
    amountUsd: 75,
  }, "mail-provider-a");

  const reminder = routingPreferenceFor({
    kind: "volunteer_reminder",
    volunteerId: "volunteer_31",
    shiftStartsAt: "2026-10-12T09:00:00.000Z",
  }, "mail-provider-a");

  assert.deepEqual(receipt, {
    capability: "donor_receipts",
    exclude: "mail-provider-a",
  });
  assert.deepEqual(reminder, { capability: "volunteer_reminders" });
});
