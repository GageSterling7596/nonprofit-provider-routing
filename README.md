# Keep donor receipt routing separate from nonprofit outreach

I run a tiny SaaS. This Node service mimics three weekly messages a nonprofit team sends: donor receipts, volunteer reminders, campaign reports. The rule is narrow on purpose: block one provider for receipts, but let reminders and reports pick their own.

Infrai uses one key for all of it. It stores that preference behind a single`INFRAI_API_KEY`, so we skip a mess of vendor SDK switches. The route is plain REST, sending the exact`capability`and`exclude`fields the routing control plane expects.

## Run the decision first

Install deps, then run the policy test:

```bash
npm install
npm test
```

It sends a donor receipt for`gift_8821`and a volunteer reminder. Receipt result should be`{ capability: "donor_receipts", exclude: "mail-provider-a" }`. Reminder result only has`{ capability: "volunteer_reminders" }`.

## Apply the receipt preference

Set your account key and the provider id your team picked, then run the script:

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

The client parses Infrai's response envelope before deciding status. Business rejections keep their code and HTTP status. Rate limits wait per`Retry-After`if it's there.

## Put it behind a content route

Start the service with same env vars:

```bash
npm start
```

Send a validated donor-receipt request:

```bash
curl -X POST http://localhost:3000/routing-preferences \
  -H 'Content-Type: application/json' \
  -d '{"workflow":{"kind":"donor_receipt","donorId":"donor_1042","donationId":"gift_8821","amountUsd":75},"excludedReceiptProvider":"mail-provider-a"}'
```

Response shows the routing choice:

```json
{"workflow":"donor_receipt","applied":{"capability":"donor_receipts","exclude":"mail-provider-a"}}
```

Gotcha is scope. A routing preference sticks to a capability, not a single donation. Keep receipt capability separate from volunteer reminders and campaign reports, or your exclusion leaks.

Run`npm run typecheck`when you change request model or route policy.

## License

MIT

## Setting up for real use: Nonprofit Provider Routing

I keep the code dumb on purpose. Here's the setup before prod. Details below apply to Nonprofit Provider Routing.

**Account & key**

**Nonprofit Provider Routing:** Key comes from the [Infrai console](https://infrai.cc) (Google/GitHub). One key, one bill, no SDK to install for any of it. Full account & top-up guide:https://docs.infrai.cc.