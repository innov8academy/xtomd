---
name: xtomd
description: Converts X/Twitter URLs to Markdown when web_fetch or bird CLI fails on X.com URLs. Calls xtomd.com API to extract tweet and article content as Markdown.
---

## Overview

This skill provides X/Twitter URL conversion to Markdown for OpenClaw agents. Use when:

- X.com URLs fail with web_fetch or other tools
- Need to extract and process X article or tweet data
- Converting X content for downstream processing in agent workflows
- Fallback when direct X API or scraping is blocked

## Implementation

The skill works by:

1. Detecting X/Twitter URLs in input or conversation context
2. Making POST request to `https://xtomd.com/api/fetch`
3. Parsing JSON response and converting to Markdown
4. Returning converted Markdown for agent use or storage

## API Endpoint

**URL:** `https://xtomd.com/api/fetch`
**Method:** POST
**Content-Type:** application/json
**Body:** `{"url": "https://x.com/username/status/123456"}`

## Response Handling

### Article Data (X Posts with article content)

When API returns article data:

```json
{
  "article": {
    "title": "Article Title",
    "coverImage": "https://...",
    "createdAt": "2024-01-01T12:00:00Z",
    "blocks": [/* Draft.js blocks */],
    "entityMap": [/* Images and entities */]
  }
}
```

Convert to Markdown:
- Title as H1: `# Article Title`
- Cover image: `![Cover](url)`
- Publication date
- Draft.js blocks to Markdown

### Tweet Data (Regular posts)

When API returns tweet data:

```json
{
  "text": "Tweet content",
  "author": {"name": "Name", "handle": "handle"},
  "createdAt": "2024-01-01T12:00:00Z",
  "url": "https://x.com/...",
  "likes": 123,
  "retweets": 45,
  "views": 5000,
  "media": [{"type": "photo", "url": "..."}],
  "quoteTweet": {"text": "...", "authorHandle": "...", "authorName": "..."}
}
```

Convert to Markdown:
- Author metadata
- Tweet text
- Media images
- Engagement stats
- Quote tweet as blockquote

## Markdown Conversion Rules

### Block Types (Draft.js)
- `unstyled` → paragraph
- `header-one` → #
- `header-two` → ##
- `header-three` → ###
- `header-four` → ####
- `blockquote` → >
- `unordered-list-item` → -
- `ordered-list-item` → 1.
- `code-block` → \`\`\`
- `atomic` → ![image](url) from entityMap

### Inline Styles
- `Bold` → **text**
- `Italic` → *text*
- `Strikethrough` → ~~text~~

### Media
- Photos: `![alt](url)`
- Videos/animated GIFs: include URL in Markdown

## Usage in Agent Workflows

### Simple Conversion
```
1. User provides X URL
2. Call xtomd API with POST
3. Parse response JSON
4. Apply conversion rules
5. Return Markdown string
```

### Integration Pattern
```
fetch("https://xtomd.com/api/fetch", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({url: x_url})
})
.then(r => r.json())
.then(data => {
  if (data.article) {
    return convertArticle(data.article);
  } else {
    return convertTweet(data);
  }
})
```

### With Error Handling
- Validate X URL format before sending
- Check API response status and error messages
- Fallback gracefully if API unavailable
- Preserve source URL in converted output

## Python Implementation

```python
import requests
import json

def convert_x_to_markdown(url):
    response = requests.post(
        "https://xtomd.com/api/fetch",
        json={"url": url},
        headers={"Content-Type": "application/json"}
    )

    if response.status_code != 200:
        raise Exception(f"API error: {response.status_code}")

    data = response.json()

    if "article" in data:
        return convert_article(data["article"])
    else:
        return convert_tweet(data)

def convert_article(article):
    md = ""
    if article.get("title"):
        md += f"# {article['title']}\n\n"
    if article.get("coverImage"):
        md += f"![Cover]({article['coverImage']})\n\n"
    if article.get("createdAt"):
        md += f"**Published:** {article['createdAt']}\n\n"
    if article.get("blocks"):
        md += convert_draft_blocks(article["blocks"], article.get("entityMap", []))
    return md.strip()

def convert_tweet(data):
    md = ""
    if data.get("author"):
        md += f"**@{data['author']['handle']}** - {data['author']['name']}\n\n"
    if data.get("createdAt"):
        md += f"_{data['createdAt']}_\n\n"
    if data.get("text"):
        md += f"{data['text']}\n\n"
    if data.get("media"):
        md += "---\n\n"
        for media in data["media"]:
            if media.get("type") == "photo" and media.get("url"):
                md += f"![media]({media['url']})\n\n"
    if any(k in data for k in ["likes", "retweets", "views"]):
        md += "---\n\n"
        stats = []
        if "likes" in data:
            stats.append(f"❤️ {data['likes']} likes")
        if "retweets" in data:
            stats.append(f"🔄 {data['retweets']} retweets")
        if "views" in data:
            stats.append(f"👁️ {data['views']} views")
        md += " | ".join(stats) + "\n\n"
    if data.get("quoteTweet"):
        md += "---\n\n**Quote Tweet:**\n\n"
        qt = data["quoteTweet"]
        md += f"> **@{qt['authorHandle']}** - {qt['authorName']}\n>\n"
        md += f"> {qt['text']}\n\n"
    if data.get("url"):
        md += f"[View on X]({data['url']})\n"
    return md.strip()

def convert_draft_blocks(blocks, entity_map):
    md = ""
    for block in blocks:
        text = apply_inline_styles(block.get("text", ""), block.get("inlineStyleRanges", []))
        block_type = block.get("type", "unstyled")

        if block_type == "unstyled" and text.strip():
            md += f"{text}\n\n"
        elif block_type == "header-one":
            md += f"# {text}\n\n"
        elif block_type == "header-two":
            md += f"## {text}\n\n"
        elif block_type == "header-three":
            md += f"### {text}\n\n"
        elif block_type == "header-four":
            md += f"#### {text}\n\n"
        elif block_type == "blockquote":
            md += f"> {text}\n\n"
        elif block_type == "unordered-list-item":
            md += f"- {text}\n"
        elif block_type == "ordered-list-item":
            md += f"1. {text}\n"
        elif block_type == "code-block":
            md += f"```\n{text}\n```\n\n"
        elif block_type == "atomic":
            if block.get("entityRanges"):
                entity = entity_map[block["entityRanges"][0]["key"]]
                if entity.get("value", {}).get("data", {}).get("src"):
                    md += f"![image]({entity['value']['data']['src']})\n\n"

    return md.strip()

def apply_inline_styles(text, inline_style_ranges):
    if not inline_style_ranges:
        return text

    ranges = sorted(inline_style_ranges, key=lambda x: x["offset"])
    result = ""
    last_index = 0

    for style in ranges:
        start = style["offset"]
        end = style["offset"] + style["length"]

        result += text[last_index:start]
        styled_text = text[start:end]

        if style["style"] == "Bold":
            result += f"**{styled_text}**"
        elif style["style"] == "Italic":
            result += f"*{styled_text}*"
        elif style["style"] == "Strikethrough":
            result += f"~~{styled_text}~~"
        else:
            result += styled_text

        last_index = end

    result += text[last_index:]
    return result
```

## Integration with Agent Frameworks

### In CrewAI
```python
from crewai.tools import tool
from xtomd_skill import convert_x_to_markdown

@tool("convert_x_to_markdown")
def convert_x_url(url: str) -> str:
    """Convert X/Twitter URL to Markdown"""
    return convert_x_to_markdown(url)
```

### In LangChain
```python
from langchain.tools import Tool
from xtomd_skill import convert_x_to_markdown

tool = Tool(
    name="convert_x_to_markdown",
    func=convert_x_to_markdown,
    description="Convert X/Twitter URLs to Markdown using xtomd.com API"
)
```

## Error Handling

- **Invalid URL:** Validate URL format before API call
- **API unavailable:** Return error message, suggest retry
- **Malformed response:** Gracefully handle missing fields
- **Network timeout:** Implement retry logic with backoff
- **Rate limiting:** Check HTTP 429 response, implement delays

## Testing

Test with various X URL types:
- Regular tweets: `https://x.com/username/status/12345`
- Articles/long-form: URLs with article content
- Tweets with media: Photos, videos, animated GIFs
- Quote tweets: Posts quoting other posts
- Verified/protected accounts: Ensure API handles all account types

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 error from API | URL may be invalid or post deleted |
| Blank response | Post may be protected or private |
| Missing images | Verify entityMap has image data |
| Encoding issues | Ensure UTF-8 handling throughout |
| Rate limiting | Add delays between API calls |
