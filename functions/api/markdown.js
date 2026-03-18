// Cloudflare Pages Function: POST /api/markdown
// Returns Markdown directly — designed for AI agents, CLI tools, and MCP servers.
// Calls the /api/fetch endpoint internally, then converts JSON → Markdown server-side.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      name: "xtomd /api/markdown",
      method: "POST",
      description: "Convert an X (Twitter) URL to Markdown",
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
      logRequest(reqInfo, "markdown", null, "error", "missing_url", startTime);
      return new Response(JSON.stringify({ error: "Missing 'url' in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // Call the existing /api/fetch endpoint internally
    const origin = new URL(context.request.url).origin;
    const fetchResp = await fetch(`${origin}/api/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!fetchResp.ok) {
      const err = await fetchResp.json();
      logRequest(reqInfo, "markdown", url, "error", `upstream_${fetchResp.status}`, startTime);
      return new Response(JSON.stringify(err), {
        status: fetchResp.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const data = await fetchResp.json();
    const markdown = convertToMarkdown(data);

    logRequest(reqInfo, "markdown", url, "success", data.article ? "article" : "tweet", startTime);

    // Return based on Accept header
    const accept = context.request.headers.get("Accept") || "";
    if (accept.includes("text/markdown") || accept.includes("text/plain")) {
      return new Response(markdown, {
        headers: { "Content-Type": "text/markdown; charset=utf-8", ...CORS_HEADERS },
      });
    }

    // Default: JSON with markdown field
    return new Response(JSON.stringify({ markdown, url: data.url, author: data.author }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    logRequest(reqInfo, "markdown", null, "error", err.message, startTime);
    return new Response(JSON.stringify({ error: "Internal server error: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
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
    userAgent: ua.slice(0, 120),
    referer,
    source: classifySource(ua, referer),
  };
}

function classifySource(ua, referer) {
  const ual = ua.toLowerCase();
  if (ual.includes("smithery") || ual.includes("mcp")) return "mcp-client";
  if (ual.includes("claude") || ual.includes("anthropic")) return "claude";
  if (ual.includes("openai") || ual.includes("chatgpt")) return "openai";
  if (ual.includes("crewai")) return "crewai";
  if (ual.includes("langchain")) return "langchain";
  if (ual.includes("bot") || ual.includes("crawler") || ual.includes("spider")) return "bot";
  if (referer && referer.includes("xtomd.com")) return "website";
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

// ---------------------------------------------------------------------------
// Markdown Conversion (server-side port of app.js logic)
// ---------------------------------------------------------------------------

function convertToMarkdown(data) {
  if (data.article) return convertArticle(data);
  return convertTweet(data);
}

function convertArticle(data) {
  const article = data.article;
  let md = "";

  if (article.title) md += `# ${article.title}\n\n`;

  if (data.author?.name) {
    md += `**Author**: ${data.author.name} ([@${data.author.handle}](https://x.com/${data.author.handle}))\n`;
  }
  if (article.createdAt) {
    md += `**Date**: ${new Date(article.createdAt).toISOString().split("T")[0]}\n`;
  }
  md += `**Source**: ${data.url}\n\n---\n\n`;

  if (article.coverImage) md += `![Cover](${article.coverImage})\n\n`;

  // Normalize entityMap
  let entityMap = {};
  if (Array.isArray(article.entityMap)) {
    for (const entry of article.entityMap) {
      if (entry.key !== undefined && entry.value) entityMap[entry.key] = entry.value;
    }
  } else if (article.entityMap && typeof article.entityMap === "object") {
    entityMap = article.entityMap;
  }

  if (article.blocks && article.blocks.length > 0) {
    md += convertDraftBlocks(article.blocks, entityMap);
  }

  return md;
}

function convertTweet(data) {
  let md = "";

  if (data.author?.name) {
    md += `**Author**: ${data.author.name} ([@${data.author.handle}](https://x.com/${data.author.handle}))\n`;
  }
  if (data.createdAt) {
    md += `**Date**: ${new Date(data.createdAt).toISOString().split("T")[0]}\n`;
  }
  md += `**Source**: ${data.url}\n`;

  const stats = [];
  if (data.likes) stats.push(`${formatNum(data.likes)} likes`);
  if (data.retweets) stats.push(`${formatNum(data.retweets)} retweets`);
  if (data.views) stats.push(`${formatNum(data.views)} views`);
  if (stats.length > 0) md += `**Engagement**: ${stats.join(" | ")}\n`;

  md += `\n---\n\n`;

  if (data.text) md += data.text + "\n";

  if (data.media && data.media.length > 0) {
    md += "\n";
    for (const m of data.media) {
      if (m.type === "photo" || m.type === "image") {
        md += `![${m.altText || "Image"}](${m.url})\n\n`;
      } else if (m.type === "video" || m.type === "gif") {
        md += `[Video](${m.url})\n\n`;
      }
    }
  }

  if (data.quoteTweet) {
    md += `\n> **@${data.quoteTweet.authorHandle}** (${data.quoteTweet.authorName}):\n`;
    md += `> ${data.quoteTweet.text}\n\n`;
  }

  return md;
}

function convertDraftBlocks(blocks, entityMap) {
  let md = "";
  let lastWasList = false;

  for (const block of blocks) {
    const isList = block.type === "unordered-list-item" || block.type === "ordered-list-item";
    if (!isList && lastWasList) md += "\n";
    lastWasList = isList;

    if (block.type === "atomic") {
      const imgMd = resolveAtomicBlock(block, entityMap);
      if (imgMd) md += imgMd + "\n\n";
      continue;
    }

    let text = applyInlineStyles(block.text, block.inlineStyleRanges);
    if (!text.trim()) continue;

    switch (block.type) {
      case "header-one":
      case "header-two":
        md += `## ${stripMd(text)}\n\n`;
        break;
      case "header-three":
        md += `### ${stripMd(text)}\n\n`;
        break;
      case "blockquote":
        md += `> ${text}\n\n`;
        break;
      case "unordered-list-item":
        md += `- ${text}\n`;
        break;
      case "ordered-list-item":
        md += `1. ${text}\n`;
        break;
      case "code-block":
        md += "```\n" + block.text + "\n```\n\n";
        break;
      default:
        md += `${text}\n\n`;
    }
  }
  return md;
}

function applyInlineStyles(text, styleRanges) {
  if (!styleRanges || styleRanges.length === 0) return text;
  const len = text.length;
  const bold = new Uint8Array(len);
  const italic = new Uint8Array(len);
  const strike = new Uint8Array(len);

  for (const range of styleRanges) {
    const end = Math.min(range.offset + range.length, len);
    for (let i = range.offset; i < end; i++) {
      if (range.style === "Bold") bold[i] = 1;
      else if (range.style === "Italic") italic[i] = 1;
      else if (range.style === "Strikethrough") strike[i] = 1;
    }
  }

  let result = "";
  let i = 0;
  while (i < len) {
    const b = bold[i], it = italic[i], s = strike[i];
    let j = i;
    while (j < len && bold[j] === b && italic[j] === it && strike[j] === s) j++;
    let segment = text.slice(i, j);
    if (s) segment = `~~${segment}~~`;
    if (it) segment = `*${segment}*`;
    if (b) segment = `**${segment}**`;
    result += segment;
    i = j;
  }
  return result;
}

function resolveAtomicBlock(block, entityMap) {
  if (!block.entityRanges || block.entityRanges.length === 0 || !entityMap) return null;
  const entity = entityMap[block.entityRanges[0].key];
  if (!entity) return null;
  if (entity.type === "IMAGE" || entity.type === "PHOTO") {
    const url = entity.data?.src || entity.data?.url || entity.data?.media_url_https || "";
    if (url) return `![Image](${url})`;
  }
  if (entity.type === "LINK") return `[${entity.data?.url || "Link"}](${entity.data?.url || ""})`;
  if (entity.type === "DIVIDER") return "---";
  return null;
}

function stripMd(text) {
  return text.replace(/\*\*/g, "").replace(/\*/g, "");
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}
