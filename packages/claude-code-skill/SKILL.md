---
name: xtomd
description: Converts X/Twitter URLs to Markdown using xtomd.com API. Use when the user shares an X link, when web_fetch fails on x.com URLs, or when you need to read and process X article content and tweets.
allowed-tools:
  - Bash(curl *)
  - Bash(node *)
  - Read
  - Write
---

## Overview

This skill detects X/Twitter URLs in conversation and converts them to Markdown using the xtomd.com API. Use this when:

- User shares an X URL and wants Markdown version
- web_fetch fails on x.com URLs
- You need to read and analyze X article or tweet content
- User asks to save X content as Markdown

## How It Works

1. Detect X/Twitter URLs (format: `https://x.com/...` or `https://twitter.com/...`)
2. Call `https://xtomd.com/api/fetch` with POST request containing the URL
3. Convert the JSON response to Markdown
4. Present to user or save to file

## Usage Examples

### Basic Conversion
When user shares an X URL, convert it:
```bash
curl -s -X POST https://xtomd.com/api/fetch \
  -H "Content-Type: application/json" \
  -d '{"url":"https://x.com/username/status/1234567890"}' | \
  node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
function applyInlineStyles(text, inlineStyleRanges) {
  if (!inlineStyleRanges || inlineStyleRanges.length === 0) return text;
  const styles = inlineStyleRanges.sort((a, b) => a.offset - b.offset);
  let result = '';
  let lastIndex = 0;
  styles.forEach((style) => {
    result += text.slice(lastIndex, style.offset);
    const styledText = text.slice(style.offset, style.offset + style.length);
    if (style.style === 'Bold') result += \`**\${styledText}**\`;
    else if (style.style === 'Italic') result += \`*\${styledText}*\`;
    else if (style.style === 'Strikethrough') result += \`~~\${styledText}~~\`;
    else result += styledText;
    lastIndex = style.offset + style.length;
  });
  result += text.slice(lastIndex);
  return result;
}
function convertDraftBlocks(blocks, entityMap) {
  let markdown = '';
  blocks.forEach((block) => {
    const styledText = applyInlineStyles(block.text, block.inlineStyleRanges);
    switch (block.type) {
      case 'unstyled':
        if (styledText.trim()) markdown += \`\${styledText}\n\n\`;
        break;
      case 'header-one': markdown += \`# \${styledText}\n\n\`; break;
      case 'header-two': markdown += \`## \${styledText}\n\n\`; break;
      case 'header-three': markdown += \`### \${styledText}\n\n\`; break;
      case 'header-four': markdown += \`#### \${styledText}\n\n\`; break;
      case 'blockquote': markdown += \`> \${styledText}\n\n\`; break;
      case 'unordered-list-item': markdown += \`- \${styledText}\n\`; break;
      case 'ordered-list-item': markdown += \`1. \${styledText}\n\`; break;
      case 'code-block': markdown += \`\\\`\\\`\\\`\n\${styledText}\n\\\`\\\`\\\`\n\n\`; break;
      case 'atomic':
        if (block.entityRanges && block.entityRanges.length > 0) {
          const entity = entityMap[block.entityRanges[0].key];
          if (entity?.value?.data?.src) {
            markdown += \`![image](\${entity.value.data.src})\n\n\`;
          }
        }
        break;
      default:
        if (styledText.trim()) markdown += \`\${styledText}\n\n\`;
    }
  });
  return markdown.trim();
}
function convertArticle(article) {
  let markdown = '';
  if (article.title) markdown += \`# \${article.title}\n\n\`;
  if (article.coverImage) markdown += \`![Cover](\${article.coverImage})\n\n\`;
  if (article.createdAt) markdown += \`**Published:** \${new Date(article.createdAt).toLocaleDateString()}\n\n\`;
  if (article.blocks?.length > 0) markdown += convertDraftBlocks(article.blocks, article.entityMap || []);
  return markdown.trim();
}
function convertTweet(data) {
  let markdown = '';
  if (data.author) markdown += \`**@\${data.author.handle}** - \${data.author.name}\n\n\`;
  if (data.createdAt) markdown += \`_\${new Date(data.createdAt).toLocaleDateString()}_\n\n\`;
  if (data.text) markdown += \`\${data.text}\n\n\`;
  if (data.media?.length > 0) {
    markdown += '---\n\n';
    data.media.forEach((m) => {
      if (m.type === 'photo' && m.url) markdown += \`![media](\${m.url})\n\n\`;
    });
  }
  if (data.likes !== undefined || data.retweets !== undefined || data.views !== undefined) {
    markdown += '---\n\n';
    const stats = [];
    if (data.likes !== undefined) stats.push(\`❤️ \${data.likes} likes\`);
    if (data.retweets !== undefined) stats.push(\`🔄 \${data.retweets} retweets\`);
    if (data.views !== undefined) stats.push(\`👁️ \${data.views} views\`);
    markdown += stats.join(' | ') + '\n\n';
  }
  if (data.quoteTweet) {
    markdown += '---\n\n**Quote Tweet:**\n\n';
    markdown += \`> **@\${data.quoteTweet.authorHandle}** - \${data.quoteTweet.authorName}\n>\n\`;
    markdown += \`> \${data.quoteTweet.text}\n\n\`;
  }
  if (data.url) markdown += \`[View on X](\${data.url})\n\`;
  return markdown.trim();
}
const markdown = data.article ? convertArticle(data.article) : convertTweet(data);
console.log(markdown);
"
```

### Save to File
Convert and save X content as Markdown:
```bash
curl -s -X POST https://xtomd.com/api/fetch \
  -H "Content-Type: application/json" \
  -d '{"url":"https://x.com/username/status/1234567890"}' > /tmp/response.json

node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/response.json', 'utf-8'));
// [conversion logic here]
const markdown = convertToMarkdown(data);
fs.writeFileSync('article.md', markdown);
"
```

## Markdown Conversion Rules

### For Articles (X Posts with article data):
- Title → H1
- Author/date/source as metadata
- Cover image as ![Cover](url)
- Draft.js blocks converted to Markdown:
  - `unstyled` → paragraph
  - `header-two` → ##
  - `header-three` → ###
  - `blockquote` → >
  - `unordered-list-item` → -
  - `ordered-list-item` → 1.
  - `code-block` → \`\`\`
  - `atomic` → ![image](url) from entityMap

### For Tweets (regular posts without article):
- Author handle and name
- Creation date
- Tweet text
- Media images
- Engagement stats (likes, retweets, views)
- Quote tweet as blockquote

### Inline Styles:
- Bold → **text**
- Italic → *text*
- Strikethrough → ~~text~~

## API Response Format

The xtomd.com API returns JSON with this structure:

```json
{
  "text": "tweet text",
  "author": {"name": "Name", "handle": "handle"},
  "createdAt": "2024-01-01T12:00:00Z",
  "url": "https://x.com/...",
  "likes": 100,
  "retweets": 50,
  "views": 5000,
  "article": {
    "title": "Article Title",
    "coverImage": "https://...",
    "createdAt": "2024-01-01T12:00:00Z",
    "blocks": [
      {"type": "unstyled", "text": "...", "inlineStyleRanges": [], "entityRanges": []}
    ],
    "entityMap": [
      {"key": 0, "value": {"type": "IMAGE", "data": {"src": "..."}}}
    ]
  },
  "media": [
    {"type": "photo", "url": "...", "altText": "..."}
  ],
  "quoteTweet": {
    "text": "...",
    "authorHandle": "...",
    "authorName": "..."
  }
}
```

## Tips

- Always check if user shares X/Twitter URLs and offer to convert them
- If web_fetch fails on x.com, use this skill as fallback
- Save converted content to .md file for preservation
- Include source URL in converted Markdown for traceability
- Handle both x.com and twitter.com URLs
