"""
xtomd - Convert X/Twitter URLs to Markdown

A simple Python module for converting X/Twitter URLs to Markdown using the xtomd.com API.

Usage:
    import xtomd
    md = xtomd.convert("https://x.com/user/status/123")
    print(md)
"""

import requests
from datetime import datetime
from typing import Optional, Dict, Any, List


API_URL = "https://xtomd.com/api/fetch"


def convert(url: str, timeout: int = 30) -> str:
    """
    Convert an X/Twitter URL to Markdown.

    Args:
        url: The X/Twitter URL to convert
        timeout: Request timeout in seconds

    Returns:
        Markdown formatted string

    Raises:
        requests.RequestException: If the API request fails
        ValueError: If the response is invalid
    """
    response = requests.post(
        API_URL,
        json={"url": url},
        headers={"Content-Type": "application/json"},
        timeout=timeout
    )

    if response.status_code != 200:
        raise requests.RequestException(
            f"API returned status {response.status_code}: {response.text}"
        )

    data = response.json()
    return _convert_to_markdown(data)


def convert_article(article: Dict[str, Any]) -> str:
    """
    Convert article data to Markdown.

    Args:
        article: Article data from API response

    Returns:
        Markdown formatted string
    """
    markdown = ""

    if article.get("title"):
        markdown += f"# {article['title']}\n\n"

    if article.get("coverImage"):
        markdown += f"![Cover]({article['coverImage']})\n\n"

    if article.get("createdAt"):
        published_date = _parse_date(article["createdAt"])
        markdown += f"**Published:** {published_date}\n\n"

    if article.get("blocks"):
        blocks_markdown = _convert_draft_blocks(
            article["blocks"],
            article.get("entityMap", [])
        )
        markdown += blocks_markdown

    return markdown.strip()


def convert_tweet(data: Dict[str, Any]) -> str:
    """
    Convert tweet data to Markdown.

    Args:
        data: Tweet data from API response

    Returns:
        Markdown formatted string
    """
    markdown = ""

    if data.get("author"):
        author = data["author"]
        markdown += f"**@{author.get('handle', 'unknown')}** - {author.get('name', '')}\n\n"

    if data.get("createdAt"):
        tweet_date = _parse_date(data["createdAt"])
        markdown += f"_{tweet_date}_\n\n"

    if data.get("text"):
        markdown += f"{data['text']}\n\n"

    if data.get("media"):
        markdown += "---\n\n"
        for media in data["media"]:
            if media.get("type") == "photo" and media.get("url"):
                alt_text = media.get("altText", "media")
                markdown += f"![{alt_text}]({media['url']})\n\n"

    if any(k in data for k in ["likes", "retweets", "views"]):
        markdown += "---\n\n"
        stats = []
        if "likes" in data:
            stats.append(f"❤️ {data['likes']} likes")
        if "retweets" in data:
            stats.append(f"🔄 {data['retweets']} retweets")
        if "views" in data:
            stats.append(f"👁️ {data['views']} views")
        markdown += " | ".join(stats)
        markdown += "\n\n"

    if data.get("quoteTweet"):
        quote_tweet = data["quoteTweet"]
        markdown += "---\n\n**Quote Tweet:**\n\n"
        markdown += f"> **@{quote_tweet.get('authorHandle', 'unknown')}** - {quote_tweet.get('authorName', '')}\n>\n"
        markdown += f"> {quote_tweet.get('text', '')}\n\n"

    if data.get("url"):
        markdown += f"[View on X]({data['url']})\n"

    return markdown.strip()


def _convert_to_markdown(data: Dict[str, Any]) -> str:
    """
    Convert API response to Markdown.

    Args:
        data: API response data

    Returns:
        Markdown formatted string
    """
    if data.get("article"):
        return convert_article(data["article"])
    return convert_tweet(data)


def _convert_draft_blocks(blocks: List[Dict[str, Any]], entity_map: List[Dict[str, Any]]) -> str:
    """
    Convert Draft.js blocks to Markdown.

    Args:
        blocks: List of Draft.js block objects
        entity_map: List of entity definitions (images, links, etc.)

    Returns:
        Markdown formatted string
    """
    markdown = ""

    for block in blocks:
        text = _apply_inline_styles(
            block.get("text", ""),
            block.get("inlineStyleRanges", [])
        )
        block_type = block.get("type", "unstyled")

        if block_type == "unstyled":
            if text.strip():
                markdown += f"{text}\n\n"
        elif block_type == "header-one":
            markdown += f"# {text}\n\n"
        elif block_type == "header-two":
            markdown += f"## {text}\n\n"
        elif block_type == "header-three":
            markdown += f"### {text}\n\n"
        elif block_type == "header-four":
            markdown += f"#### {text}\n\n"
        elif block_type == "blockquote":
            markdown += f"> {text}\n\n"
        elif block_type == "unordered-list-item":
            markdown += f"- {text}\n"
        elif block_type == "ordered-list-item":
            markdown += f"1. {text}\n"
        elif block_type == "code-block":
            markdown += f"```\n{text}\n```\n\n"
        elif block_type == "atomic":
            if block.get("entityRanges"):
                entity_key = block["entityRanges"][0].get("key")
                if entity_key is not None and entity_key < len(entity_map):
                    entity = entity_map[entity_key]
                    src = entity.get("value", {}).get("data", {}).get("src")
                    if src:
                        markdown += f"![image]({src})\n\n"

    return markdown.strip()


def _apply_inline_styles(text: str, inline_style_ranges: List[Dict[str, Any]]) -> str:
    """
    Apply inline styling (bold, italic, strikethrough) to text.

    Args:
        text: The text to style
        inline_style_ranges: List of inline style objects

    Returns:
        Styled text with Markdown formatting
    """
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


def _parse_date(date_str: str) -> str:
    """
    Parse ISO date string and format for display.

    Args:
        date_str: ISO formatted date string

    Returns:
        Human readable date string
    """
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%B %d, %Y")
    except (ValueError, AttributeError):
        return date_str


# Aliases for convenience
to_markdown = convert
markdown = convert

__all__ = [
    "convert",
    "convert_article",
    "convert_tweet",
    "to_markdown",
    "markdown",
    "API_URL",
]

__version__ = "1.0.0"
__author__ = "xtomd"
