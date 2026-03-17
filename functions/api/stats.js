// Cloudflare Pages Function: GET /api/stats
// Returns conversion analytics from Analytics Engine

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  // Simple auth: require ?key= parameter matching env secret
  const url = new URL(context.request.url);
  const key = url.searchParams.get("key");
  const expectedKey = context.env.STATS_KEY || "xtomd-stats-2026";

  if (key !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  if (!context.env.ANALYTICS) {
    return new Response(JSON.stringify({ error: "Analytics Engine not bound" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }

  try {
    const days = parseInt(url.searchParams.get("days") || "7", 10);

    // Query: event counts by type
    const countsByType = await context.env.ANALYTICS.sql(`
      SELECT
        blob1 AS event,
        COUNT() AS count,
        SUM(double1) AS total_chars
      FROM xtomd_events
      WHERE timestamp > NOW() - INTERVAL '${days}' DAY
      GROUP BY blob1
      ORDER BY count DESC
    `);

    // Query: daily breakdown
    const daily = await context.env.ANALYTICS.sql(`
      SELECT
        toDate(timestamp) AS day,
        blob1 AS event,
        COUNT() AS count
      FROM xtomd_events
      WHERE timestamp > NOW() - INTERVAL '${days}' DAY
      GROUP BY day, blob1
      ORDER BY day DESC, count DESC
    `);

    // Query: top errors
    const errors = await context.env.ANALYTICS.sql(`
      SELECT
        blob3 AS error_title,
        COUNT() AS count
      FROM xtomd_events
      WHERE blob1 = 'convert_error'
        AND timestamp > NOW() - INTERVAL '${days}' DAY
      GROUP BY blob3
      ORDER BY count DESC
      LIMIT 10
    `);

    // Query: content type split
    const contentTypes = await context.env.ANALYTICS.sql(`
      SELECT
        blob2 AS content_type,
        COUNT() AS count
      FROM xtomd_events
      WHERE blob1 = 'convert_success'
        AND timestamp > NOW() - INTERVAL '${days}' DAY
      GROUP BY blob2
      ORDER BY count DESC
    `);

    return new Response(JSON.stringify({
      period: `last ${days} days`,
      summary: countsByType.rows || [],
      daily: daily.rows || [],
      topErrors: errors.rows || [],
      contentTypes: contentTypes.rows || [],
    }, null, 2), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
}
