import { createServer } from "node:http";
import { z } from "zod";
import { InfraiError, InfraiRoutingClient } from "./infrai_routing_client.ts";
import { routingPreferenceFor, workflowSchema } from "./routing_policy.ts";

const requestSchema = z.object({
  workflow: workflowSchema,
  excludedReceiptProvider: z.string().min(1),
}).strict();

export function createNonprofitContentServer(client: InfraiRoutingClient) {
  return createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/routing-preferences") {
      sendJson(response, 404, { error: "Route not found" });
      return;
    }

    try {
      const input = requestSchema.parse(await readJson(request));
      const preference = routingPreferenceFor(
        input.workflow,
        input.excludedReceiptProvider,
      );
      await client.setPreference(preference);
      sendJson(response, 200, {
        workflow: input.workflow.kind,
        applied: preference,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendJson(response, 400, { error: "Invalid request", issues: error.issues });
        return;
      }
      if (error instanceof InfraiError) {
        sendJson(response, error.status >= 400 && error.status < 500 ? error.status : 502, {
          error: error.code,
          message: error.message,
        });
        return;
      }
      sendJson(response, 500, { error: "Request could not be completed" });
    }
  });
}

async function readJson(request: import("node:http").IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(
  response: import("node:http").ServerResponse,
  status: number,
  body: unknown,
): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");

  const port = Number(process.env.PORT ?? "3000");
  createNonprofitContentServer(new InfraiRoutingClient(apiKey)).listen(port, () => {
    console.log(`Nonprofit content service listening on http://localhost:${port}`);
  });
}
