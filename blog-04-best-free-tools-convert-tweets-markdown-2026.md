---
title: "Best Free Tools to Convert Tweets to Markdown in 2026"
meta_title: "Best Free Tools to Convert Tweets to Markdown in 2026 | xtomd.com"
meta_description: "We compared 8 tweet-to-markdown tools — web apps, CLI tools, Chrome extensions, and Obsidian plugins. Here's what actually works in 2026."
date: 2026-03-16
author: "xtomd team"
category: "Tools & Resources"
tags: ["markdown", "twitter", "x", "automation", "pkm"]
---

# Best Free Tools to Convert Tweets to Markdown in 2026

You're building a knowledge base. You find a tweet worth saving. Now what? Copy-paste loses formatting. Screenshots don't scale. You need Markdown.

The problem is that converting X (formerly Twitter) content to Markdown isn't straightforward. Twitter's API access is locked behind paid tiers. Threads disappear if you don't capture them right. X Articles use a different format than regular tweets. Most tools either don't work anymore, require expensive API keys, or only handle single tweets.

We tested 8 tools that claim to solve this. Here's what actually works in 2026.

## Quick Comparison

| Tool | Type | Free? | X Articles? | Threads? | Install? | Best For |
|------|------|-------|-------------|----------|----------|----------|
| **xtomd.com** | Web app | Yes | Yes | No | No | Simplicity, AI users |
| **tweet-to-markdown CLI** | Node.js CLI | Yes | No | Yes | Yes | Developers |
| **X Copy Tweet as Markdown** | Chrome ext | Yes | No | No | Yes | Quick single captures |
| **Twitter/X to Markdown** | Chrome ext | Yes | No | Yes | Yes | Thread capture |
| **Tweet to Markdown (LLM)** | Chrome ext | Yes | No | No | Yes | Custom formatting |
| **Obsidian Tweet to Markdown** | Obsidian plugin | Yes | No | No | Yes | Obsidian-only workflows |
| **Jina Reader** | Web service | Yes | No | No | No | Non-X content |
| **ThreadReaderApp** | Web unroller | Yes | No | Yes | No | Reading threads |

---

## 1. xtomd.com

**Type:** Web app | **Cost:** Free | **Install:** None

The simplest option. Paste a tweet URL or X Article URL. Get Markdown. Done.

No login, no API key, no installation. Works on desktop and mobile. Handles regular tweets, quote tweets, and X Articles (the long-form Draft.js content). The Markdown output is clean—preserves links, mentions, and quoted text structure.

**Strengths:**
- Zero friction. Paste URL, copy Markdown.
- Handles X Articles, which most tools don't.
- Fast. No waiting for API calls.
- Works offline after load.

**Weaknesses:**
- No thread support yet (single tweets only).
- No direct integration with other tools.
- Relies on URL format staying stable.

**Best for:** People who want the fastest path from tweet to Markdown. AI researchers and PKM users who need to quickly import X content into Obsidian or Notion. Anyone who doesn't want to touch the command line.

**Cost:** Free

---

## 2. tweet-to-markdown (CLI)

**Type:** Node.js CLI tool | **Cost:** Free (tool) | **Install:** Yes | **Requirements:** Bearer token

This one's powerful but comes with friction. It's a command-line tool built by kbravh on GitHub. You install it via npm, then run commands to convert tweets.

The catch: you need a Twitter API bearer token. The old API used to be free. Now it's not. You need paid access to the Twitter API ($100+/month minimum), which means the "free" tool has a hidden cost.

**Strengths:**
- Handles thread extraction.
- Scriptable—you can automate bulk conversions.
- Full control over output format.

**Weaknesses:**
- Requires paid API access (no free tier).
- Command-line only—not beginner-friendly.
- Needs Node.js installed and npm knowledge.
- Maintenance depends on maintainer (Twitter API changes break tools).

**Best for:** Developers who already have Twitter API access or bulk automation needs justifying the cost.

**Cost:** Free tool, but ~$100+/month for API access

---

## 3. X Copy Tweet as Markdown

**Type:** Chrome extension | **Cost:** Free | **Install:** Yes | **Updated:** February 2026

Simple browser extension. Open a tweet, click the extension icon, copy the generated Markdown. One-click workflow.

It works well for single tweets. The extension is lightweight and handles most tweet types. The maintainer updates it regularly (last update Feb 2026), which is a good sign for compatibility.

**Strengths:**
- One-click capture.
- No login required.
- Regularly maintained.
- Works directly in your browser.

**Weaknesses:**
- Chrome only (no Firefox version).
- Struggles with X Articles.
- Single tweets only—no thread support.
- Depends on page structure (changes break it).

**Best for:** Chrome users who capture individual tweets often and want the fastest possible workflow.

**Cost:** Free

---

## 4. Twitter/X to Markdown

**Type:** Chrome extension | **Cost:** Free | **Install:** Yes | **Updated:** February 2026

Another Chrome extension, but this one focuses on thread capture. It scrapes the conversation and exports to Markdown. Also recently updated (Feb 2026).

The approach is different—it reads the DOM instead of calling an API, so it works without API keys. That's both good and fragile.

**Strengths:**
- Thread support—actually captures multi-tweet conversations.
- No API key needed.
- Free and maintained.
- Works with conversation threading.

**Weaknesses:**
- Fragile—relies on X's page structure, which changes often.
- Chrome only.
- Inconsistent results depending on thread length.
- Can't handle X Articles.

**Best for:** People who regularly capture Twitter/X threads for long-form reading or research.

**Cost:** Free

---

## 5. Tweet to Markdown (LLM-powered)

**Type:** Chrome extension | **Cost:** Free (tool) | **Install:** Yes | **Requirements:** OpenAI API key

This extension uses AI to reformat tweets. You provide your OpenAI API key, and it reformats content through Claude or GPT. Useful if you want custom formatting or summarization.

The appeal is flexibility—you can customize how Markdown gets generated. The downside is obvious: OpenAI API keys cost money. Even light usage adds up.

**Strengths:**
- Custom formatting via AI.
- Can summarize or reformat on the fly.
- Flexible output.

**Weaknesses:**
- Requires OpenAI API key (costs money per request).
- Another layer of complexity.
- Overkill for simple conversion.
- API costs stack up with heavy use.

**Best for:** Power users who want AI-powered reformatting and have budgets for API usage.

**Cost:** Free tool, but ~$0.01-0.10+ per conversion depending on OpenAI usage

---

## 6. Obsidian Tweet to Markdown Plugin

**Type:** Obsidian plugin | **Cost:** Free | **Install:** Yes | **Works in:** Obsidian only

If you use Obsidian, this plugin integrates tweet capture directly into your vault. Paste a tweet URL into Obsidian, run the plugin, get Markdown note.

It's convenient if you're already in Obsidian. But it's also fragile—the plugin had issues since Twitter's API changes in 2023, and maintenance has been spotty.

**Strengths:**
- Seamless if you use Obsidian.
- No browser switching.
- Direct integration with PKM workflow.

**Weaknesses:**
- Obsidian-only (useless if you use Notion, OneNote, etc.).
- API issues have broken it multiple times.
- Relies on third-party plugin maintenance.
- Can't handle X Articles.
- Single tweets only.

**Best for:** Obsidian power users who need native integration.

**Cost:** Free

---

## 7. Jina Reader

**Type:** Web service | **Cost:** Free | **Install:** None | **Format:** `r.jina.ai/[URL]`

Jina Reader is a generic URL-to-Markdown converter. Paste any URL into `r.jina.ai/[your-url]`, get clean Markdown. Works for most websites.

The catch: X blocks server-side fetches. When you try to convert X URLs through Jina Reader, the server can't access the content. You get empty or incomplete results. It's great for everything except Twitter/X.

**Strengths:**
- Works for non-X content (news sites, blogs, etc.).
- No install, no login.
- Fast.

**Weaknesses:**
- X blocks server-side requests—doesn't work for tweets.
- Not designed for social media.
- Returns incomplete data for X URLs.

**Best for:** Converting web articles to Markdown, not tweets.

**Cost:** Free

---

## 8. ThreadReaderApp

**Type:** Web-based thread unroller | **Cost:** Free | **Install:** None

ThreadReaderApp specializes in unrolling threads. You paste a tweet URL, it reconstructs the entire thread in a readable format. You can export to PDF or plain text.

It's good at what it does, but what it does doesn't include Markdown output. The exports are PDF or raw text—not formatted Markdown. It's also not X Article-friendly.

**Strengths:**
- Thread unrolling is reliable.
- No install needed.
- Works well for reading threads.

**Weaknesses:**
- No Markdown output.
- No X Article support.
- Output format is PDF or plain text.
- Designed for reading, not content capture.

**Best for:** Reading long threads in a readable format. Not ideal if you need Markdown for further processing.

**Cost:** Free (plus paid tiers for premium features)

---

## FAQ

**Do any of these tools work with Threads (Meta)?**
No. These are all X/Twitter-specific. Threads has its own ecosystem and these tools don't support it yet.

**Which tool handles X Articles best?**
xtomd.com is the only one that explicitly handles X Articles (Draft.js long-form content). Most tools were built for regular 280-character tweets.

**Can I batch convert multiple tweets at once?**
The CLI tool (tweet-to-markdown) supports batch conversion if you're comfortable with the command line and have API access. Web apps and extensions work one-at-a-time.

**What about privacy? Where does my data go?**
xtomd.com processes URLs without logging. Most extensions run locally in your browser. The CLI is local. If you use LLM-powered tools, your content goes to OpenAI or Claude's servers.

**Will these tools keep working?**
That depends on X's changes. Tools that use the Twitter API are most vulnerable since API access is paid and restricted. Browser extensions are more fragile because they depend on page structure. Web apps are most stable if the maintainer is active.

**Which one should I use for Obsidian?**
If you want native integration, the Obsidian plugin. If you want more reliable conversion, use xtomd.com and paste the Markdown into Obsidian manually (takes 5 seconds).

---

## The Bottom Line

If you want the simplest, most reliable option that handles X Articles—use **xtomd.com**. No install, no login, no costs. Paste URL, get Markdown.

If you need thread support and don't mind Chrome extensions, try **Twitter/X to Markdown**.

If you're a developer and already pay for Twitter API access, the **CLI tool** gives you automation and power.

For everything else, you're probably better off with a simple copy-paste into xtomd.com than wrestling with plugins and API keys.

The right tool depends on your workflow. But the best tool is the one you'll actually use—and that's usually the simplest one.

---

**Ready to simplify your workflow?** [Try xtomd.com free](https://xtomd.com) — paste a tweet URL, get clean Markdown in seconds.

---

## Related Articles

- [How to Convert X Articles to Markdown: Complete Guide](how-to-convert-x-articles-to-markdown.html)
- [Best Ways to Save Twitter Threads for AI Analysis](best-ways-to-save-twitter-threads-for-ai-analysis.html)
- [X Articles to Obsidian: Complete Setup Guide](x-articles-to-obsidian-complete-guide.html)