// Cloudflare Pages Function: POST /api/fetch
// Uses FXTwitter API to get full article content including Draft.js blocks

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const CACHE_TTL = 300;

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      name: "xtomd /api/fetch",
      method: "POST",
      description: "Fetch raw JSON data from an X (Twitter) URL",
      usage: { url: "https://x.com/user/status/123" },
      docs: "https://xtomd.com/.well-known/openapi.json",
    }),
    {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    }
  );
}

export async function onRequestPost(context) {
  const startTime = Date.now();
  const reqInfo = getRequestInfo(context.request);

  try {
    const body = await context.request.json();
    const url = body.url;

    if (!url) {
      logRequest(reqInfo, "fetch", null, "error", "missing_url", startTime);
      return jsonError("Missing 'url' in request body", 400);
    }

    const parsed = parseXUrl(url);
    if (!parsed) {
      logRequest(reqInfo, "fetch", url, "error", "invalid_url", startTime);
      return jsonError("Invalid X/Twitter URL. Provide a link like https://x.com/user/status/123", 400);
    }

    // Check cache first
    const cacheKey = `https://xarticle-cache.internal/${parsed.type}/${parsed.id}`;
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) {
      const cachedData = await cached.json();
      logRequest(reqInfo, "fetch", url, "success", "cache_hit", startTime);
      return jsonResponse({ ...cachedData, cached: true });
    }

    // Fetch via FXTwitter API (returns full article content)
    const result = await fetchFromFxTwitter(parsed);

    if (!result) {
      logRequest(reqInfo, "fetch", url, "error", "upstream_failed", startTime);
      return jsonError("Could not fetch content from X. The post may be private, deleted, or require authentication.", 502);
    }

    // Cache the result
    const cacheResponse = new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", "Cache-Control": `s-maxage=${CACHE_TTL}` },
    });
    context.waitUntil(cache.put(cacheKey, cacheResponse));

    logRequest(reqInfo, "fetch", url, "success", result.article ? "article" : "tweet", startTime);
    return jsonResponse(result);
  } catch (err) {
    logRequest(reqInfo, "fetch", null, "error", err.message, startTime);
    console.error("Worker error:", err);
    return jsonError("Internal server error: " + err.message, 500);
  }
}

// ---------------------------------------------------------------------------
// URL Parsing
// ---------------------------------------------------------------------------

function parseXUrl(url) {
  try {
    const u = new URL(url);
    if (!["x.com", "twitter.com", "www.x.com", "www.twitter.com"].includes(u.hostname)) {
      return null;
    }

    const parts = u.pathname.split("/").filter(Boolean);

    // /user/status/ID
    if (parts.length >= 3 && parts[1] === "status") {
      return { type: "tweet", user: parts[0], id: parts[2] };
    }

    // /user/article/ID or /user/articles/ID
    if (parts.length >= 3 && (parts[1] === "article" || parts[1] === "articles")) {
      return { type: "article", user: parts[0], id: parts[2] };
    }

    // /i/article/ID
    if (parts.length >= 3 && parts[0] === "i" && (parts[1] === "article" || parts[1] === "articles")) {
      return { type: "article", user: null, id: parts[2] };
    }

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// FXTwitter API
// ---------------------------------------------------------------------------

async function fetchFromFxTwitter(parsed) {
  // FXTwitter API endpoint
  const apiUrl = `https://api.fxtwitter.com/${parsed.user || "i"}/status/${parsed.id}`;

  const resp = await fetch(apiUrl, {
    headers: {
      "User-Agent": "XArticleToMD/1.0",
      "Accept": "application/json",
    },
  });

  if (!resp.ok) {
    console.log("FXTwitter returned", resp.status);
    return null;
  }

  const data = await resp.json();
  if (!data.tweet) return null;

  const tweet = data.tweet;

  return {
    // Tweet metadata
    text: tweet.text || "",
    rawText: tweet.raw_text?.text || "",
    author: {
      name: tweet.author?.name || "",
      handle: tweet.author?.screen_name || parsed.user || "",
      avatarUrl: tweet.author?.avatar_url || "",
      description: tweet.author?.description || "",
    },
    createdAt: tweet.created_at || "",
    url: tweet.url || `https://x.com/${parsed.user}/status/${parsed.id}`,
    likes: tweet.likes || 0,
    retweets: tweet.retweets || 0,
    replies: tweet.replies || 0,
    views: tweet.views || 0,
    bookmarks: tweet.bookmarks || 0,

    // Article data (the key part!)
    article: tweet.article ? {
      id: tweet.article.id,
      title: tweet.article.title || "",
      previewText: tweet.article.preview_text || "",
      coverImage: tweet.article.cover_media?.media_info?.original_img_url || "",
      createdAt: tweet.article.created_at || "",
      // Full article content as Draft.js blocks
      blocks: tweet.article.content?.blocks || [],
      entityMap: tweet.article.content?.entityMap || {},
    } : null,

    // Media
    media: (tweet.media?.all || []).map(m => ({
      type: m.type,
      url: m.url,
      thumbnail: m.thumbnail_url,
      altText: m.altText || "",
    })),

    // For regular tweets (non-article)
    isNoteTweet: tweet.is_note_tweet || false,

    // Quote tweet
    quoteTweet: tweet.quote ? {
      text: tweet.quote.text || "",
      authorName: tweet.quote.author?.name || "",
      authorHandle: tweet.quote.author?.screen_name || "",
    } : null,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// ---------------------------------------------------------------------------
// Request Logging — visible via `wrangler pages deployment tail`
// ---------------------------------------------------------------------------

function getRequestInfo(request) {
  const ua = request.headers.get("User-Agent") || "unknown";
  const referer = request.headers.get("Referer") || "none";
  const cf = request.cf || {};
  return {
    country: cf.country || "unknown",
    city: cf.city || "unknown",
    userAgent: ua.slice(0, 120),
    referer,
    source: classifySource(ua, referer),
  };
}

function classifySource(ua, referer) {
  const ual = ua.toLowerCase();
  // MCP / Smithery clients
  if (ual.includes("smithery") || ual.includes("mcp")) return "mcp-client";
  // Known AI agents
  if (ual.includes("claude") || ual.includes("anthropic")) return "claude";
  if (ual.includes("openai") || ual.includes("chatgpt")) return "openai";
  if (ual.includes("crewai")) return "crewai";
  if (ual.includes("langchain")) return "langchain";
  // Bot/crawler
  if (ual.includes("bot") || ual.includes("crawler") || ual.includes("spider")) return "bot";
  // Browser (from the website)
  if (referer && referer.includes("xtomd.com")) return "website";
  // curl / httpie / scripts
  if (ual.includes("curl") || ual.includes("httpie") || ual.includes("python-requests")) return "script";
  return "unknown";
}

function logRequest(info, endpoint, url, status, detail, startTime) {
  const duration = Date.now() - startTime;
  console.log(JSON.stringify({
    t: new Date().toISOString(),
    ep: endpoint,
    src: info.source,
    status,
    detail,
    url: url ? url.slice(0, 100) : null,
    country: info.country,
    ua: info.userAgent.slice(0, 60),
    ms: duration,
  }));
}
