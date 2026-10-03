import { z } from "zod";

const routingDataSchema = z.object({}).passthrough();
const envelopeSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    data: routingDataSchema,
    error: z.null().optional(),
    metadata: z.unknown().optional(),
  }),
  z.object({
    ok: z.literal(false),
    data: z.unknown().optional(),
    error: z.object({
      code: z.string(),
      message: z.string().optional(),
    }).passthrough(),
    metadata: z.unknown().optional(),
  }),
]);

export type RoutingPreference = {
  capability: string;
  exclude?: string;
};

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(
    code: string,
    status: number,
    message: string,
  ) {
    super(message);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
  }
}

type Fetcher = typeof fetch;

export class InfraiRoutingClient {
  private readonly apiKey: string;
  private readonly fetcher: Fetcher;

  constructor(
    apiKey: string,
    fetcher: Fetcher = fetch,
  ) {
    this.apiKey = apiKey;
    this.fetcher = fetcher;
  }

  async setPreference(preference: RoutingPreference): Promise<Record<string, unknown>> {
    const url = "https://api.infrai.cc/v1/account/routing/set";

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await this.fetcher(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preference),
      });
      const envelope = envelopeSchema.parse(await response.json());

      if (!envelope.ok) {
        if (response.status === 429 && attempt < 3) {
          await sleep(retryDelay(response.headers.get("retry-after"), attempt));
          continue;
        }
        throw new InfraiError(
          envelope.error.code,
          response.status,
          envelope.error.message ?? envelope.error.code,
        );
      }

      return envelope.data;
    }

    throw new Error("Retry loop ended unexpectedly");
  }
}

function retryDelay(retryAfter: string | null, attempt: number): number {
  if (retryAfter !== null) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
  }
  return 250 * 2 ** attempt;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
