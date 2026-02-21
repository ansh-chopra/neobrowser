# NeoBrowser API Worker

Cloudflare Worker that proxies requests to the Google Gemini API with authentication, rate limiting, and CORS handling.

## Endpoints

| Method | Path          | Description                        |
|--------|---------------|------------------------------------|
| GET    | `/v1/health`  | Health check (no auth required)    |
| POST   | `/v1/chat`    | Proxy to Gemini generateContent    |
| POST   | `/v1/search`  | AI-powered search via Gemini       |

## Setup

```bash
cd worker
npm install
```

### Configure secrets

```bash
# Google Gemini API key
npx wrangler secret put GEMINI_API_KEY

# Shared secret the app sends in the x-api-key header
npx wrangler secret put APP_API_KEY
```

### Local development

```bash
npm run dev
```

When running locally, wrangler will prompt you for secret values or you can create a `.dev.vars` file:

```
GEMINI_API_KEY=your-gemini-key
APP_API_KEY=your-app-key
```

### Deploy

```bash
npm run deploy
```

### Custom domain

To serve the worker at `api.neobrowser.app`:

1. Make sure `neobrowser.app` is added as a zone in your Cloudflare account.
2. In the Cloudflare dashboard, go to **Workers & Pages > neobrowser-api > Settings > Triggers**.
3. Add a Custom Domain: `api.neobrowser.app`.
4. Cloudflare will automatically create the required DNS record.

The route is already configured in `wrangler.toml`.
