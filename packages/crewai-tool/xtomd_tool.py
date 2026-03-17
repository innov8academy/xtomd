"""
CrewAI tool for converting X/Twitter URLs to Markdown using xtomd.com API.
"""

from crewai.tools import BaseTool
from pydantic import BaseModel, Field
import requests
from typing import Optional
from datetime import datetime


class ConvertXToMarkdownInput(BaseModel):
    """Input for the convert_x_to_markdown tool."""
    url: str = Field(..., description="X/Twitter URL to convert (e.g., https://x.com/user/status/123)")


class XtomdTool(BaseTool):
    """Tool for converting X/Twitter URLs to Markdown."""

    name: str = "convert_x_to_markdown"
    description: str = (
        "Converts X/Twitter URLs to Markdown using xtomd.com API. "
        "Use this tool when you need to read and process X article content or tweets. "
        "Returns formatted Markdown that preserves formatting, structure, and metadata."
    )
    args_schema: type = ConvertXToMarkdownInput

    def _run(self, url: str) -> str:
        """Execute the tool."""
        return self._convert_x_to_markdown(url)

    async def _arun(self, url: str) -> str:
        """Async execution of the tool."""
        return self._convert_x_to_markdown(url)

    def _convert_x_to_markdown(self, url: str) -> str:
        """Convert X URL to Markdown."""
        try:
            response = requests.post(
                "https://xtomd.com/api/fetch",
                json={"url": url},
                headers={"Content-Type": "application/json"},
                timeout=30
            )

            if response.status_code != 200:
                return f"Error: API returned status {response.status_code}"

            data = response.json()
            markdown = self._convert_to_markdown(data)
            return markdown

        except requests.exceptions.Timeout:
            return "Error: API request timed out"
        except requests.exceptions.ConnectionError:
            return "Error: Failed to connect to API"
        except Exception as e:
            return f"Error: {str(e)}"

    def _convert_to_markdown(self, data: dict) -> str:
        """Convert API response to Markdown."""
        if data.get("article"):
            return self._convert_article(data["article"])
        return self._convert_tweet(data)

    def _convert_article(self, article: dict) -> str:
        """Convert article data to Markdown."""
        markdown = ""

        if article.get("title"):
            markdown += f"# {article['title']}\n\n"

        if article.get("coverImage"):
            markdown += f"![Cover]({article['coverImage']})\n\n"

        if article.get("createdAt"):
            published_date = datetime.fromisoformat(
                article["createdAt"].replace("Z", "+00:00")
            ).strftime("%B %d, %Y")
            markdown += f"**Published:** {published_date}\n\n"

        if article.get("blocks"):
            blocks_markdown = self._convert_draft_blocks(
                article["blocks"],
                article.get("entityMap", [])
            )
            markdown += blocks_markdown

        return markdown.strip()

    def _convert_tweet(self, data: dict) -> str:
        """Convert tweet data to Markdown."""
        markdown = ""

        if data.get("author"):
            author = data["author"]
            markdown += f"**@{author.get('handle', 'unknown')}** - {author.get('name', '')}\n\n"

        if data.get("createdAt"):
            tweet_date = datetime.fromisoformat(
                data["createdAt"].replace("Z", "+00:00")
            ).strftime("%B %d, %Y")
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

    def _convert_draft_blocks(self, blocks: list, entity_map: list) -> str:
        """Convert Draft.js blocks to Markdown."""
        markdown = ""

        for block in blocks:
            text = self._apply_inline_styles(
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

    def _apply_inline_styles(self, text: str, inline_style_ranges: list) -> str:
        """Apply inline styling (bold, italic, strikethrough) to text."""
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
