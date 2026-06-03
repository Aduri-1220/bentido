import { serve } from "inngest/next";
import { inngest, inngestFunctions } from "@/lib/inngest";

/**
 * Inngest serve endpoint. The Inngest service (cloud or `npx inngest-cli dev`)
 * sends jobs here; signature verification is handled by the SDK using
 * INNGEST_SIGNING_KEY in production.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});
