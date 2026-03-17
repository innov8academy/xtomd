#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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

// MCP Server Setup

const server = new McpServer({
  name: "xtomd",
  version: "1.0.0",
});

server.tool(
  "convert_x_to_markdown",
  {
    url: z.string().describe("X/Twitter URL to convert (e.g., https://x.com/user/status/123)"),
  },
  async ({ url }) => {
    try {
      const response = await fetch("https://xtomd.com/api/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Error: API returned status ${response.status}`,
            },
          ],
        };
      }

      const data = await response.json();
      const markdown = convertToMarkdown(data);

      return {
        content: [
          {
            type: "text",
            text: markdown,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error converting URL: ${error.message}`,
          },
        ],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
