import { InfraiRoutingClient } from "./infrai_routing_client.ts";
import { routingPreferenceFor } from "./routing_policy.ts";

const apiKey = process.env.INFRAI_API_KEY;
const excludedProvider = process.env.EXCLUDED_RECEIPT_PROVIDER;

if (!apiKey) throw new Error("Set INFRAI_API_KEY before running this script");
if (!excludedProvider) throw new Error("Set EXCLUDED_RECEIPT_PROVIDER before running this script");

const receipt = {
  kind: "donor_receipt" as const,
  donorId: "donor_1042",
  donationId: "gift_8821",
  amountUsd: 75,
};
const preference = routingPreferenceFor(receipt, excludedProvider);
await new InfraiRoutingClient(apiKey).setPreference(preference);

console.log(JSON.stringify({ workflow: receipt.kind, applied: preference }, null, 2));
