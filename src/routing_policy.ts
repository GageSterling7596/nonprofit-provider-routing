import { z } from "zod";
import type { RoutingPreference } from "./infrai_routing_client.ts";

export const workflowSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("donor_receipt"),
    donorId: z.string().min(1),
    donationId: z.string().min(1),
    amountUsd: z.number().positive(),
  }).strict(),
  z.object({
    kind: z.literal("volunteer_reminder"),
    volunteerId: z.string().min(1),
    shiftStartsAt: z.string().datetime(),
  }).strict(),
  z.object({
    kind: z.literal("campaign_report"),
    campaignId: z.string().min(1),
    reportingPeriod: z.string().min(1),
  }).strict(),
]);

export type NonprofitWorkflow = z.infer<typeof workflowSchema>;

export const workflowCapabilities: Record<NonprofitWorkflow["kind"], string> = {
  donor_receipt: "donor_receipts",
  volunteer_reminder: "volunteer_reminders",
  campaign_report: "campaign_reporting",
};

export function routingPreferenceFor(
  workflow: NonprofitWorkflow,
  excludedReceiptProvider: string,
): RoutingPreference {
  const capability = workflowCapabilities[workflow.kind];
  return workflow.kind === "donor_receipt"
    ? { capability, exclude: excludedReceiptProvider }
    : { capability };
}
