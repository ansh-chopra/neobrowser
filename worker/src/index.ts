/**
 * NeoBrowser API Proxy Worker
 *
 * Proxies requests to the Google Gemini API with authentication,
 * rate limiting, and CORS handling.
 */

export interface Env {
  GEMINI_API_KEY: string;
  APP_API_KEY: string;
  ALLOWED_ORIGIN: string;
}

// ---------------------------------------------------------------------------
// Rate limiter (in-memory, per-isolate)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60;

const rateLimitMap = new Map<string, RateLimitEntry>();

function isRateLimited(apiKey: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(apiKey);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(apiKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

/** Periodically prune expired entries so the map doesn't grow unbounded. */
function pruneRateLimitMap(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1/models";
const GEMINI_BETA_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function corsHeaders(origin: string, allowedOrigin: string): HeadersInit {
  const effectiveOrigin =
    origin === allowedOrigin || allowedOrigin === "*" ? origin : allowedOrigin;

  return {
    "Access-Control-Allow-Origin": effectiveOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  extraHeaders: HeadersInit = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleChat(
  request: Request,
  env: Env,
  cors: HeadersInit,
): Promise<Response> {
  const body = await request.json<{
    model?: string;
    contents: unknown;
    generationConfig?: unknown;
    safetySettings?: unknown;
    systemInstruction?: unknown;
  }>();

  const model = body.model ?? "gemini-2.0-flash";

  const geminiPayload: Record<string, unknown> = {
    contents: body.contents,
  };
  if (body.generationConfig) geminiPayload.generationConfig = body.generationConfig;
  if (body.safetySettings) geminiPayload.safetySettings = body.safetySettings;
  if (body.systemInstruction) geminiPayload.systemInstruction = body.systemInstruction;

  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const geminiResponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(geminiPayload),
  });

  const geminiBody = await geminiResponse.text();

  return new Response(geminiBody, {
    status: geminiResponse.status,
    headers: {
      "Content-Type": "application/json",
      ...cors,
    },
  });
}

async function handleSearch(
  request: Request,
  env: Env,
  cors: HeadersInit,
): Promise<Response> {
  const body = await request.json<{
    model?: string;
    query: string;
    generationConfig?: unknown;
    safetySettings?: unknown;
  }>();

  if (!body.query || typeof body.query !== "string") {
    return jsonResponse({ error: "Missing or invalid 'query' field" }, 400, cors);
  }

  const model = body.model ?? "gemini-2.0-flash";

  const geminiPayload: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: body.query }],
      },
    ],
    tools: [{ googleSearch: {} }],
  };
  if (body.generationConfig) geminiPayload.generationConfig = body.generationConfig;
  if (body.safetySettings) geminiPayload.safetySettings = body.safetySettings;

  // Use v1beta for search (supports tools like googleSearch)
  const url = `${GEMINI_BETA_URL}/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const geminiResponse = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(geminiPayload),
  });

  const geminiBody = await geminiResponse.text();

  return new Response(geminiBody, {
    status: geminiResponse.status,
    headers: {
      "Content-Type": "application/json",
      ...cors,
    },
  });
}

function handleHealth(cors: HeadersInit): Response {
  return jsonResponse(
    {
      status: "ok",
      service: "neobrowser-api",
      timestamp: new Date().toISOString(),
    },
    200,
    cors,
  );
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") ?? "";
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN);

    // Prune stale rate-limit entries on every request (cheap operation)
    pruneRateLimitMap();

    // ---- Preflight ----
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // ---- Health (no auth required) ----
    if (url.pathname === "/v1/health" && request.method === "GET") {
      return handleHealth(cors);
    }

    // ---- Auth check ----
    // TODO: Replace simple API key check with RevenueCat subscription
    //       verification once subscription system is integrated.
    const clientKey = request.headers.get("x-api-key");
    if (!clientKey || clientKey !== env.APP_API_KEY) {
      return jsonResponse({ error: "Unauthorized" }, 401, cors);
    }

    // ---- Rate limiting ----
    if (isRateLimited(clientKey)) {
      return jsonResponse(
        { error: "Rate limit exceeded. Try again in 60 seconds." },
        429,
        cors,
      );
    }

    // ---- Route dispatch ----
    try {
      if (url.pathname === "/v1/chat" && request.method === "POST") {
        return await handleChat(request, env, cors);
      }

      if (url.pathname === "/v1/search" && request.method === "POST") {
        return await handleSearch(request, env, cors);
      }

      return jsonResponse({ error: "Not found" }, 404, cors);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal server error";
      console.error("Worker error:", message);
      return jsonResponse({ error: message }, 500, cors);
    }
  },
} satisfies ExportedHandler<Env>;
