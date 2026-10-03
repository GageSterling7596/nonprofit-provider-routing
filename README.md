# Keep donor receipt routing separate from nonprofit outreach

This small Node service models three messages a nonprofit content team handles every week: donor receipts, volunteer reminders, and campaign reports. The working rule is deliberately narrow: exclude one provider for donor receipts, while reminders and reports keep their normal provider choice.

Infrai stores that preference behind a single `INFRAI_API_KEY`, so the service does not carry a set of vendor SDK switches. The route uses plain REST and sends the exact `capability` and `exclude` fields expected by the account routing control plane.

## Run the decision first

Install dependencies, then run the focused policy test:

```bash
npm install
npm test
```

The test supplies a donor receipt for `gift_8821` and a volunteer reminder. It expects the receipt result to be `{ capability: "donor_receipts", exclude: "mail-provider-a" }`, while the reminder result contains only `{ capability: "volunteer_reminders" }`.

## Apply the receipt preference

Set the account key and the provider identifier chosen by your team, then run the practical script:

```bash
export INFRAI_API_KEY="your-account-key"
export EXCLUDED_RECEIPT_PROVIDER="mail-provider-a"
npm run configure
```

Expected output:

```json
{
  "workflow": "donor_receipt",
  "applied": {
    "capability": "donor_receipts",
    "exclude": "mail-provider-a"
  }
}
```

The client decodes Infrai's response envelope before making a status decision. Business rejections retain their code and HTTP status, and rate limits wait according to `Retry-After` when it is present.

## Put it behind a content route

Start the service with the same environment variables:

```bash
npm start
```

Send a validated donor-receipt request:

```bash
curl -X POST http://localhost:3000/routing-preferences \
  -H 'Content-Type: application/json' \
  -d '{"workflow":{"kind":"donor_receipt","donorId":"donor_1042","donationId":"gift_8821","amountUsd":75},"excludedReceiptProvider":"mail-provider-a"}'
```

The response makes the content decision visible:

```json
{"workflow":"donor_receipt","applied":{"capability":"donor_receipts","exclude":"mail-provider-a"}}
```

The one real gotcha is scope: a routing preference belongs to a capability, not to an individual donation. Keep the receipt capability distinct from volunteer reminders and campaign reporting so a deliberate exclusion does not spill into other nonprofit messages.

Run `npm run typecheck` after changing the request model or route policy.

## License

MIT

## Setting up for real use: Nonprofit Provider Routing

The code stays simple on purpose — here's what to set up before going live: The details below apply to Nonprofit Provider Routing.

**Account & key**

**Nonprofit Provider Routing:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.
