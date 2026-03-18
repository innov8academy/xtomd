// Cloudflare Pages Function: GET /api/health
// Health check + quick usage info

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "xtomd",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      endpoints: {
        "POST /api/fetch": "Get raw JSON data from an X URL",
        "POST /api/markdown": "Get Markdown from an X URL",
        "POST /mcp": "MCP protocol endpoint (Smithery, Claude, etc.)",
        "GET /api/health": "This health check",
      },
      docs: "https://xtomd.com/.well-known/openapi.json",
      howToViewLogs: "Run: npx wrangler pages deployment tail --project-name xtomd",
    }),
    {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    }
  );
}
