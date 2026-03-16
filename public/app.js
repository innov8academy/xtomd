// X Article to Markdown — Client-side logic
(function () {
  "use strict";

  const urlInput = document.getElementById("url-input");
  const convertBtn = document.getElementById("convert-btn");
  const statusEl = document.getElementById("status");
  const statusText = document.getElementById("status-text");
  const outputSection = document.getElementById("output-section");
  const markdownOutput = document.getElementById("markdown-output");
  const copyBtn = document.getElementById("copy-btn");
  const downloadBtn = document.getElementById("download-btn");
  const charCount = document.getElementById("char-count");

  // -----------------------------------------------------------------------
  // Event Listeners
  // -----------------------------------------------------------------------

  convertBtn.addEventListener("click", handleConvert);
  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleConvert();
  });
  copyBtn.addEventListener("click", handleCopy);
  downloadBtn.addEventListener("click", handleDownload);

  // No auto-convert — user clicks Convert or presses Enter

  // -----------------------------------------------------------------------
  // Main Conversion Flow
  // -----------------------------------------------------------------------

  async function handleConvert() {
    const url = urlInput.value.trim();

    if (!url) {
      showStatus("Please paste an X (Twitter) URL", "error");
      return;
    }

    if (!isValidXUrl(url)) {
      showStatus("Invalid URL. Use a link like https://x.com/user/status/123...", "error");
      return;
    }

    setLoading(true);
    showStatus("Fetching content from X...", "info");
    outputSection.hidden = true;

    try {
      const resp = await fetch("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        showStatus(data.error || "Failed to fetch content", "error");
        return;
      }

      let markdown;
      try {
        markdown = convertToMarkdown(data);
      } catch (convErr) {
        console.error("Markdown conversion error:", convErr);
        showStatus("Conversion error: " + convErr.message, "error");
        return;
      }

      if (!markdown || markdown.trim().length < 10) {
        showStatus("Could not extract meaningful content. The post may require login or be unsupported.", "error");
        return;
      }

      markdownOutput.value = markdown;
      outputSection.hidden = false;
      charCount.textContent = `${formatNumber(markdown.length)} chars`;
      showStatus(
        data.article
          ? `Article converted: "${data.article.title}"${data.cached ? " (cached)" : ""}`
          : `Tweet converted${data.cached ? " (cached)" : ""}`,
        "success"
      );
    } catch (err) {
      console.error("Conversion error:", err);
      showStatus("Network error. Could not reach the server.", "error");
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------------------------------------------------
  // Markdown Conversion
  // -----------------------------------------------------------------------

  function convertToMarkdown(data) {
    if (data.article) {
      return convertArticle(data);
    }
    return convertTweet(data);
  }

  // -- X Article (Draft.js blocks → Markdown) --
  function convertArticle(data) {
    const article = data.article;
    let md = "";

    // Title
    if (article.title) {
      md += `# ${article.title}\n\n`;
    }

    // Metadata
    if (data.author?.name) {
      md += `**Author**: ${data.author.name} ([@${data.author.handle}](https://x.com/${data.author.handle}))\n`;
    }
    if (article.createdAt) {
      md += `**Date**: ${new Date(article.createdAt).toISOString().split("T")[0]}\n`;
    }
    md += `**Source**: ${data.url}\n\n`;
    md += `---\n\n`;

    // Cover image
    if (article.coverImage) {
      md += `![Cover](${article.coverImage})\n\n`;
    }

    // Convert entityMap from array [{key, value}] to object {key: value}
    let entityMap = {};
    if (Array.isArray(article.entityMap)) {
      for (const entry of article.entityMap) {
        if (entry.key !== undefined && entry.value) {
          entityMap[entry.key] = entry.value;
        }
      }
    } else if (article.entityMap && typeof article.entityMap === "object") {
      entityMap = article.entityMap;
    }

    // Convert Draft.js blocks to Markdown
    if (article.blocks && article.blocks.length > 0) {
      md += convertDraftBlocks(article.blocks, entityMap);
    }

    return md;
  }

  // -- Regular Tweet → Markdown --
  function convertTweet(data) {
    let md = "";

    // Metadata
    if (data.author?.name) {
      md += `**Author**: ${data.author.name} ([@${data.author.handle}](https://x.com/${data.author.handle}))\n`;
    }
    if (data.createdAt) {
      const date = new Date(data.createdAt).toISOString().split("T")[0];
      md += `**Date**: ${date}\n`;
    }
    md += `**Source**: ${data.url}\n`;

    // Engagement stats
    const stats = [];
    if (data.likes) stats.push(`${formatNumber(data.likes)} likes`);
    if (data.retweets) stats.push(`${formatNumber(data.retweets)} retweets`);
    if (data.views) stats.push(`${formatNumber(data.views)} views`);
    if (stats.length > 0) {
      md += `**Engagement**: ${stats.join(" | ")}\n`;
    }

    md += `\n---\n\n`;

    // Tweet text
    if (data.text) {
      md += data.text + "\n";
    }

    // Media
    if (data.media && data.media.length > 0) {
      md += "\n";
      for (const m of data.media) {
        if (m.type === "photo" || m.type === "image") {
          const cleanUrl = cleanImageUrl(m.url);
          md += `![${m.altText || "Image"}](${cleanUrl})\n\n`;
        } else if (m.type === "video" || m.type === "gif") {
          md += `[Video](${m.url})\n\n`;
        }
      }
    }

    // Quote tweet
    if (data.quoteTweet) {
      md += `\n> **@${data.quoteTweet.authorHandle}** (${data.quoteTweet.authorName}):\n`;
      md += `> ${data.quoteTweet.text}\n\n`;
    }

    return md;
  }

  // -----------------------------------------------------------------------
  // Draft.js Blocks → Markdown
  // -----------------------------------------------------------------------

  function convertDraftBlocks(blocks, entityMap) {
    let md = "";
    let lastWasList = false;

    for (const block of blocks) {
      const isList = block.type === "unordered-list-item" || block.type === "ordered-list-item";

      // Add blank line between list and non-list
      if (!isList && lastWasList) {
        md += "\n";
      }
      lastWasList = isList;

      // Skip atomic blocks (usually embedded media — we handle images via entityMap)
      if (block.type === "atomic") {
        const imgMd = resolveAtomicBlock(block, entityMap);
        if (imgMd) {
          md += imgMd + "\n\n";
        }
        continue;
      }

      // Get styled text
      let text = applyInlineStyles(block.text, block.inlineStyleRanges);

      // Apply entity links
      text = applyEntityLinks(text, block.entityRanges, entityMap);

      if (!text.trim()) continue;

      switch (block.type) {
        case "header-one":
          md += `## ${stripMd(text)}\n\n`; // ## because # is the article title
          break;
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
        default: // "unstyled"
          md += `${text}\n\n`;
      }
    }

    return md;
  }

  function applyInlineStyles(text, styleRanges) {
    if (!styleRanges || styleRanges.length === 0) return text;

    // Build a character-level style map, then wrap contiguous styled ranges
    // This avoids index-shifting issues with overlapping ranges
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

      // Find contiguous range with same style combination
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

  function applyEntityLinks(text, entityRanges, entityMap) {
    if (!entityRanges || entityRanges.length === 0 || !entityMap) return text;
    // Entity links are already in the styled text, but we can't easily map back
    // after style markers were inserted. For now, append links as footnotes if present.
    // This is a safe fallback that doesn't corrupt the text.
    return text;
  }

  function resolveAtomicBlock(block, entityMap) {
    if (!block.entityRanges || block.entityRanges.length === 0 || !entityMap) return null;

    const entity = entityMap[block.entityRanges[0].key];
    if (!entity) return null;

    if (entity.type === "IMAGE" || entity.type === "PHOTO") {
      const url = entity.data?.src || entity.data?.url || entity.data?.media_url_https || "";
      if (url) return `![Image](${url})`;
    }

    if (entity.type === "LINK") {
      return `[${entity.data?.url || "Link"}](${entity.data?.url || ""})`;
    }

    // DIVIDER type (horizontal rule)
    if (entity.type === "DIVIDER") {
      return "---";
    }

    return null;
  }

  function stripMd(text) {
    // Remove markdown bold/italic from headings (they're already bold by being headings)
    return text.replace(/\*\*/g, "").replace(/\*/g, "");
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  function cleanImageUrl(url) {
    if (!url) return url;
    // Normalize twimg URLs: strip ?name=orig, use ?name=large for reliability
    try {
      const u = new URL(url);
      if (u.hostname === "pbs.twimg.com") {
        u.searchParams.set("name", "large");
        return u.toString();
      }
    } catch {}
    return url;
  }

  function isValidXUrl(url) {
    try {
      const u = new URL(url);
      return ["x.com", "twitter.com", "www.x.com", "www.twitter.com"].includes(u.hostname);
    } catch {
      return false;
    }
  }

  function formatNumber(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return String(n);
  }

  function showStatus(message, type) {
    statusText.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.hidden = false;
  }

  function setLoading(loading) {
    convertBtn.disabled = loading;
    convertBtn.classList.toggle("loading", loading);
    const textEl = convertBtn.querySelector(".btn-text");
    if (textEl) textEl.textContent = loading ? "Converting..." : "Convert";
  }

  async function handleCopy() {
    const text = markdownOutput.value;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied!";
      copyBtn.classList.add("copied");
      setTimeout(() => {
        copyBtn.textContent = "Copy";
        copyBtn.classList.remove("copied");
      }, 2000);
    } catch {
      markdownOutput.select();
      document.execCommand("copy");
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
    }
  }

  function handleDownload() {
    const text = markdownOutput.value;
    if (!text) return;

    // Use article title or "x-article" as filename
    const titleMatch = text.match(/^# (.+)$/m);
    const filename = titleMatch
      ? titleMatch[1].slice(0, 60).replace(/[^a-zA-Z0-9 -]/g, "").replace(/\s+/g, "-").toLowerCase() + ".md"
      : "x-article.md";

    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
})();
