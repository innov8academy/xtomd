#!/usr/bin/env node

// Markdown Conversion Logic

function applyInlineStyles(text, inlineStyleRanges) {
  if (!inlineStyleRanges || inlineStyleRanges.length === 0) {
    return text;
  }

  const styles = inlineStyleRanges.sort((a, b) => a.offset - b.offset);
  let result = "";
  let lastIndex = 0;

  styles.forEach((style) => {
    const start = style.offset;
    const end = style.offset + style.length;

    result += text.slice(lastIndex, start);

    const styledText = text.slice(start, end);
    let formatted = styledText;

    if (style.style === "Bold") {
      formatted = `**${styledText}**`;
    } else if (style.style === "Italic") {
      formatted = `*${styledText}*`;
    } else if (style.style === "Strikethrough") {
      formatted = `~~${styledText}~~`;
    }

    result += formatted;
    lastIndex = end;
  });

  result += text.slice(lastIndex);
  return result;
}

function convertDraftBlocks(blocks, entityMap) {
  let markdown = "";

  blocks.forEach((block) => {
    const styledText = applyInlineStyles(block.text, block.inlineStyleRanges);

    switch (block.type) {
      case "unstyled":
        if (styledText.trim()) {
          markdown += `${styledText}\n\n`;
        }
        break;
      case "header-one":
        markdown += `# ${styledText}\n\n`;
        break;
      case "header-two":
        markdown += `## ${styledText}\n\n`;
        break;
      case "header-three":
        markdown += `### ${styledText}\n\n`;
        break;
      case "header-four":
        markdown += `#### ${styledText}\n\n`;
        break;
      case "blockquote":
        markdown += `> ${styledText}\n\n`;
        break;
      case "unordered-list-item":
        markdown += `- ${styledText}\n`;
        break;
      case "ordered-list-item":
        markdown += `1. ${styledText}\n`;
        break;
      case "code-block":
        markdown += `\`\`\`\n${styledText}\n\`\`\`\n\n`;
        break;
      case "atomic":
        if (block.entityRanges && block.entityRanges.length > 0) {
          const entityRange = block.entityRanges[0];
          const entity = entityMap[entityRange.key];
          if (entity && entity.value && entity.value.data && entity.value.data.src) {
            const altText = entity.value.data.alt || "image";
            markdown += `![${altText}](${entity.value.data.src})\n\n`;
          }
        }
        break;
      default:
        if (styledText.trim()) {
          markdown += `${styledText}\n\n`;
        }
    }
  });

  return markdown.trim();
}

function convertArticle(article) {
  let markdown = "";

  if (article.title) {
    markdown += `# ${article.title}\n\n`;
  }

  if (article.coverImage) {
    markdown += `![Cover](${article.coverImage})\n\n`;
  }

  if (article.createdAt) {
    markdown += `**Published:** ${new Date(article.createdAt).toLocaleDateString()}\n\n`;
  }

  if (article.blocks && article.blocks.length > 0) {
    const blockMarkdown = convertDraftBlocks(article.blocks, article.entityMap || []);
    markdown += blockMarkdown;
  }

  return markdown.trim();
}

function convertTweet(data) {
  let markdown = "";

  if (data.author) {
    markdown += `**@${data.author.handle}** - ${data.author.name}\n\n`;
  }

  if (data.createdAt) {
    markdown += `_${new Date(data.createdAt).toLocaleDateString()}_\n\n`;
  }

  if (data.text) {
    markdown += `${data.text}\n\n`;
  }

  if (data.media && data.media.length > 0) {
    markdown += "---\n\n";
    data.media.forEach((media) => {
      if (media.type === "photo" && media.url) {
        const altText = media.altText || "media";
        markdown += `![${altText}](${media.url})\n\n`;
      }
    });
  }

  if (data.likes !== undefined || data.retweets !== undefined || data.views !== undefined) {
    markdown += "---\n\n";
    const stats = [];
    if (data.likes !== undefined) stats.push(`❤️ ${data.likes} likes`);
    if (data.retweets !== undefined) stats.push(`🔄 ${data.retweets} retweets`);
    if (data.views !== undefined) stats.push(`👁️ ${data.views} views`);
    markdown += stats.join(" | ");
    markdown += "\n\n";
  }

  if (data.quoteTweet) {
    markdown += "---\n\n**Quote Tweet:**\n\n";
    markdown += `> **@${data.quoteTweet.authorHandle}** - ${data.quoteTweet.authorName}\n>\n`;
    markdown += `> ${data.quoteTweet.text}\n\n`;
  }

  if (data.url) {
    markdown += `[View on X](${data.url})\n`;
  }

  return markdown.trim();
}

function convertToMarkdown(data) {
  if (data.article) {
    return convertArticle(data.article);
  }
  return convertTweet(data);
}

// CLI Implementation

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.error("Usage: xtomd [--json] <url>");
    console.error("");
    console.error("Options:");
    console.error("  --json    Output raw JSON instead of Markdown");
    console.error("  --help    Show this help message");
    console.error("");
    console.error("Examples:");
    console.error("  xtomd https://x.com/user/status/123");
    console.error("  xtomd --json https://x.com/user/status/123");
    process.exit(args.length === 0 ? 1 : 0);
  }

  let url = args[0];
  let outputJson = false;

  if (args[0] === "--json") {
    outputJson = true;
    url = args[1];
  }

  if (!url) {
    console.error("Error: URL is required");
    process.exit(1);
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  try {
    const response = await fetch("https://xtomd.com/api/fetch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      console.error(`Error: API returned status ${response.status}`);
      process.exit(1);
    }

    const data = await response.json();

    if (outputJson) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      const markdown = convertToMarkdown(data);
      console.log(markdown);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
