# xtomd Python Package

A simple Python module for converting X/Twitter URLs to Markdown using the xtomd.com API.

## Installation

```bash
pip install xtomd
```

Or from source:

```bash
git clone https://github.com/xtomd/xtomd-python.git
cd xtomd-python
pip install -e .
```

## Quick Start

```python
import xtomd

# Convert a tweet or article
markdown = xtomd.convert("https://x.com/username/status/1234567890")
print(markdown)
```

## Usage

### Basic Conversion

```python
import xtomd

# Simple usage
md = xtomd.convert("https://x.com/elonmusk/status/1234567890")
print(md)
```

### With Error Handling

```python
import xtomd
import requests

try:
    markdown = xtomd.convert("https://x.com/user/status/123")
    print(markdown)
except requests.RequestException as e:
    print(f"Error: {e}")
except ValueError as e:
    print(f"Invalid response: {e}")
```

### Alias Functions

```python
import xtomd

# These are all equivalent
markdown = xtomd.convert(url)
markdown = xtomd.to_markdown(url)
markdown = xtomd.markdown(url)
```

### Direct Data Conversion

If you already have API response data, convert it directly:

```python
import xtomd

# Convert article data
article_md = xtomd.convert_article(article_data)

# Convert tweet data
tweet_md = xtomd.convert_tweet(tweet_data)
```

### Custom Timeout

```python
import xtomd

# Increase timeout to 60 seconds
markdown = xtomd.convert(url, timeout=60)
```

## Output Format

### For Articles

Articles with Draft.js content blocks are converted with:
- Title as H1
- Cover image (if available)
- Publication date
- Formatted content blocks

Example output:

```markdown
# Article Title

![Cover](https://example.com/cover.jpg)

**Published:** March 17, 2026

Article content here with **bold**, *italic*, and ~~strikethrough~~ text.

- List item 1
- List item 2

## Subheading

More content...
```

### For Tweets

Regular tweets are converted with:
- Author metadata (@handle and name)
- Publication date
- Tweet text
- Media images (if any)
- Engagement stats (likes, retweets, views)
- Quote tweets (if present)
- Link to original

Example output:

```markdown
**@username** - Full Name

_March 17, 2026_

This is a tweet with **bold** text and a link.

---

![Tweet image](https://example.com/image.jpg)

---

❤️ 1,234 likes | 🔄 567 retweets | 👁️ 89,123 views

[View on X](https://x.com/...)
```

## Markdown Formatting

The converter preserves the following formatting:

- **Bold text** (from Draft.js Bold style)
- *Italic text* (from Draft.js Italic style)
- ~~Strikethrough text~~ (from Draft.js Strikethrough style)
- Headers (H1, H2, H3, H4)
- Block quotes
- Unordered lists
- Ordered lists
- Code blocks
- Images

## API Response Structure

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
      {
        "type": "unstyled",
        "text": "Paragraph text",
        "inlineStyleRanges": [
          {"style": "Bold", "offset": 0, "length": 5}
        ],
        "entityRanges": []
      }
    ],
    "entityMap": [
      {
        "key": 0,
        "value": {"type": "IMAGE", "data": {"src": "..."}}
      }
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

## Error Handling

The package raises `requests.RequestException` for API errors and `ValueError` for invalid responses:

```python
import xtomd
import requests

try:
    markdown = xtomd.convert("https://x.com/user/status/123")
except requests.RequestException as e:
    # Handle connection errors, timeouts, HTTP errors
    print(f"API error: {e}")
except ValueError as e:
    # Handle invalid responses
    print(f"Invalid response: {e}")
```

## Examples

### Download Tweet as Markdown File

```python
import xtomd

url = "https://x.com/username/status/1234567890"
markdown = xtomd.convert(url)

with open("tweet.md", "w", encoding="utf-8") as f:
    f.write(markdown)

print("Saved to tweet.md")
```

### Batch Convert Multiple Tweets

```python
import xtomd

urls = [
    "https://x.com/user1/status/123",
    "https://x.com/user2/status/456",
    "https://x.com/user3/status/789",
]

for url in urls:
    try:
        markdown = xtomd.convert(url)
        filename = url.split("/")[-1] + ".md"
        with open(filename, "w") as f:
            f.write(markdown)
        print(f"Saved {filename}")
    except Exception as e:
        print(f"Error converting {url}: {e}")
```

### Process in a Data Pipeline

```python
import xtomd
import json

# Load tweet URLs from JSON
with open("urls.json", "r") as f:
    data = json.load(f)

# Convert to Markdown
results = []
for item in data:
    try:
        markdown = xtomd.convert(item["url"])
        results.append({
            "url": item["url"],
            "markdown": markdown,
            "status": "success"
        })
    except Exception as e:
        results.append({
            "url": item["url"],
            "error": str(e),
            "status": "failed"
        })

# Save results
with open("results.json", "w") as f:
    json.dump(results, f, indent=2)
```

## Performance

- Typical API response: 100-500ms
- Conversion time: <10ms (local)
- Memory usage: Minimal (depends on content size)

For large batch operations, consider adding delays between requests to avoid rate limiting:

```python
import xtomd
import time

urls = [...]  # List of URLs

for url in urls:
    markdown = xtomd.convert(url)
    # ... process markdown ...
    time.sleep(1)  # 1 second delay between requests
```

## Requirements

- Python 3.8+
- requests >= 2.28.0

## License

MIT

## Contributing

Contributions welcome! Please open issues and pull requests on GitHub.

## Support

For issues with the conversion logic, see the xtomd.com website.
For package issues, open an issue on GitHub.
