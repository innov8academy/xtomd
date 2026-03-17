// Cloudflare Pages Function: POST /api/event
// Logs conversion events to Cloudflare Analytics Engine

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const event = body.event;

    if (!event) {
      return new Response(JSON.stringify({ error: "Missing 'event'" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // Write to Analytics Engine
    // blob1 = event type, blob2 = content type, blob3 = error title, blob4 = user agent
    // double1 = char count (for successful conversions)
    if (context.env.ANALYTICS) {
      context.env.ANALYTICS.writeDataPoint({
        blobs: [
          event,                              // blob1: event type (convert_success, convert_error, copy, download)
          body.contentType || "",              // blob2: "article" or "tweet"
          body.errorTitle || "",               // blob3: error title if failed
          (context.request.headers.get("user-agent") || "").slice(0, 100), // blob4: UA
        ],
        doubles: [
          body.charCount || 0,                // double1: markdown char count
        ],
        indexes: [event],                     // index on event type for fast queries
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
}
