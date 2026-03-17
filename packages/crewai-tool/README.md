# CrewAI xtomd Tool

A CrewAI custom tool for converting X/Twitter URLs to Markdown using the xtomd.com API.

## Installation

```bash
pip install crewai requests
```

## Usage

```python
from xtomd_tool import XtomdTool

# Create tool instance
xtomd = XtomdTool()

# Use in an agent
agent = Agent(
    role="Content Analyst",
    goal="Analyze X/Twitter content",
    tools=[xtomd],
    ...
)

# Or use directly
markdown = xtomd._run(url="https://x.com/user/status/123456")
print(markdown)
```

## Tool Details

- **Name:** `convert_x_to_markdown`
- **Description:** Converts X/Twitter URLs to Markdown with full formatting preservation
- **Input:** X/Twitter URL (string)
- **Output:** Markdown formatted string

## Features

- Converts articles with full Draft.js block support
- Handles tweets with media, engagement stats, and quote tweets
- Preserves inline formatting (bold, italic, strikethrough)
- Handles images and embedded media
- Error handling for API failures
- Async support included

## Examples

### Convert a Tweet
```python
url = "https://x.com/elonmusk/status/1234567890"
markdown = xtomd._run(url=url)
print(markdown)
```

### Convert an Article
```python
url = "https://x.com/user/status/1234567890"  # Article URL
markdown = xtomd._run(url=url)
# Returns formatted Markdown with title, cover image, and content
```

### Use in Crew AI Task
```python
from crewai import Agent, Task, Crew

task = Task(
    description="Convert this X URL to Markdown and summarize the content: https://x.com/...",
    agent=agent,
    tools=[xtomd],
    expected_output="Markdown version of the X content with summary"
)
```

## API Response Handling

The tool automatically handles:
- Articles with Draft.js blocks
- Regular tweets with media
- Quote tweets
- Engagement metrics (likes, retweets, views)
- Images and media attachments
- User metadata (author, date, URL)

## Error Handling

The tool provides graceful error handling for:
- Network timeouts
- Invalid URLs
- API failures
- Malformed responses
- Missing data fields
