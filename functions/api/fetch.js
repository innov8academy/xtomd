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

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const url = body.url;

    if (!url) {
      return jsonError("Missing 'url' in request body", 400);
    }

    const parsed = parseXUrl(url);
    if (!parsed) {
      return jsonError("Invalid X/Twitter URL. Provide a link like https://x.com/user/status/123", 400);
    }

    // Check cache first
    const cacheKey = `https://xarticle-cache.internal/${parsed.type}/${parsed.id}`;
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) {
      const cachedData = await cached.json();
      return jsonResponse({ ...cachedData, cached: true });
    }

    // Fetch via FXTwitter API (returns full article content)
    const result = await fetchFromFxTwitter(parsed);

    if (!result) {
      return jsonError("Could not fetch content from X. The post may be private, deleted, or require authentication.", 502);
    }

    // Cache the result
    const cacheResponse = new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", "Cache-Control": `s-maxage=${CACHE_TTL}` },
    });
    context.waitUntil(cache.put(cacheKey, cacheResponse));

    return jsonResponse(result);
  } catch (err) {
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
