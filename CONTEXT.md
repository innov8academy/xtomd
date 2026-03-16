# xtomd.com — Full Project Context

## What This Is

**xtomd.com** is a free web tool that converts X (Twitter) articles and tweets into clean, copy-ready Markdown. Users paste an X URL, click Convert, and get properly formatted Markdown they can paste into AI tools, note-taking apps, or anywhere that accepts Markdown.

**Live site:** https://xtomd.com
**GitHub:** https://github.com/innov8academy/xtomd
**Domain registrar:** Cloudflare (xtomd.com, $10.46/yr)
**Hosting:** Cloudflare Pages + Workers (free tier)
**Launch date:** March 16, 2026

---

## Technical Architecture

```
User pastes X URL → Cloudflare Pages (static frontend)
                  → Cloudflare Worker proxy (/api/fetch)
                  → FXTwitter API (api.fxtwitter.com)
                  → Client-side Draft.js → Markdown conversion
                  → User copies/downloads .md output
```

### Key Files
- `public/index.html` — Main tool page (SEO optimized, Schema.org, FAQ)
- `public/style.css` — Dark/light mode, mobile-first responsive
- `public/app.js` — Client-side: calls worker, parses Draft.js blocks → Markdown
- `functions/api/fetch.js` — Cloudflare Worker proxy using FXTwitter API
- `public/robots.txt` — Search engine directives
- `public/sitemap.xml` — All pages indexed
- `public/blog/` — 3 SEO blog posts

### How Content Extraction Works
1. Worker calls `api.fxtwitter.com/{user}/status/{id}`
2. FXTwitter returns full tweet data + article content as Draft.js blocks
3. For X Articles: blocks contain `type` (unstyled, header-two, unordered-list-item, etc.), `text`, `inlineStyleRanges` (Bold, Italic), and `entityRanges` (links, images)
4. Client-side JS converts each block to proper Markdown syntax
5. Metadata extracted: author, date, engagement stats, cover image

### What It Supports
- X Articles (long-form posts) — full content with headings, formatting, images
- Regular tweets — text, media, engagement stats, quote tweets
- Tweets with images — pbs.twimg.com URLs (public CDN, work everywhere)

### What It Does NOT Support (yet)
- Tweet threads (multi-tweet chains) — only gets the linked tweet
- Private/protected tweets — requires auth
- Spaces or video transcripts

---

## Target Audience

### Primary Users
1. **AI power users** — People who paste content into Claude, ChatGPT, Gemini for analysis, summaries, critiques
2. **PKM/Second Brain builders** — Obsidian, Notion, Logseq users who capture knowledge from X
3. **Researchers & journalists** — Archiving X content as structured Markdown
4. **Developers** — Piping X content into scripts, documentation, APIs

### The Core Use Case Problem
X Articles are locked inside the X platform. You can't easily:
- Copy an article with formatting preserved
- Feed it to an AI model for analysis
- Save it to your knowledge base in a useful format
- Archive it before it gets deleted

**xtomd.com solves this in one click.**

---

## Specific Use Cases (for SEO content)

### 1. OpenClaw / Claude Code CLI Integration
- OpenClaw (openclaw.com) is a personal AI assistant that runs 24/7
- Sometimes the built-in web fetching in CLI tools (like `claude` CLI or OpenClaw) doesn't work well with X URLs — X blocks server-side fetches, returns JavaScript-only pages
- **Fix:** Use xtomd.com to convert the X article to Markdown, then paste into OpenClaw/Claude CLI for analysis
- This is a workaround for when `WebFetch` or `curl` fails on X URLs
- Users can also download the .md file and feed it directly to their AI agent

### 2. Claude / ChatGPT Analysis
- User finds an interesting X Article (e.g., a long business strategy post, tech analysis, industry report)
- Pastes URL into xtomd.com → gets clean Markdown
- Pastes Markdown into Claude/ChatGPT with a prompt like "Summarize the key insights" or "Critique this strategy"
- Markdown preserves the structure (headings, bold emphasis, lists) so the AI understands the hierarchy

### 3. Obsidian Knowledge Base
- User reads an X Article they want to remember
- Converts to Markdown on xtomd.com
- Pastes into Obsidian with proper metadata (author, date, source URL)
- Links it to related notes, adds tags
- The article is now searchable, linkable, and permanent in their vault

### 4. Notion / Logseq Research Collection
- Same as Obsidian but for Notion/Logseq users
- Markdown pastes cleanly into both tools
- Metadata block at the top provides attribution

### 5. Content Curation & Newsletter Writing
- Newsletter writers who curate X content
- Convert articles to Markdown for their writing workflow
- Proper attribution preserved in the output

### 6. Bookmarking Replacement
- X bookmarks are unreliable (content gets deleted, accounts suspended)
- xtomd.com lets you capture the content permanently as a .md file
- Download and store locally — immune to X platform changes

### 7. Developer Documentation
- Technical X Articles/threads about coding, architecture, best practices
- Convert to Markdown → add to project docs, wikis, or READMEs
- Preserves code-relevant formatting

### 8. AI Agent Workflows
- AI agents (AutoGPT, CrewAI, Claude agents) that need to consume X content
- xtomd.com provides a clean API endpoint (`POST /api/fetch`) that returns structured JSON
- Agents can programmatically convert X URLs to Markdown

---

## Competition & Market

### Direct Competitors
| Tool | Type | Gap |
|------|------|-----|
| ThreadReaderApp | Thread unroller (HTML, not MD) | No Markdown output, no Articles support |
| tweet-to-markdown (GitHub) | CLI tool | Not accessible to non-devs |
| Obsidian Tweet to MD plugin | Obsidian-only plugin | Only works inside Obsidian |
| Chrome extensions (3-4 exist) | Browser extensions | Require install, not universal |
| Readwise/Reader | Paid ($8/mo) | Overkill for this one task |
| Jina Reader (r.jina.ai) | Generic web→MD | Doesn't work well with X (auth walls) |

### Our Advantage
- **Zero friction** — no install, no login, no payment, just paste a URL
- **X Article support** — we're one of the few tools that handle the full Draft.js article format
- **AI-optimized output** — Markdown designed to preserve structure for LLM consumption
- **Free forever** (hosting costs <$1/mo)

### Market Size
- 1.5M+ Obsidian users (22% YoY growth as of Feb 2026)
- Millions of daily Claude/ChatGPT users
- Growing X Articles ecosystem (X pushing creators toward long-form)
- PKM/Second Brain movement is mainstream

---

## SEO Strategy

### Current State
- **Domain:** xtomd.com (registered March 16, 2026)
- **Pages indexed:** 4 (homepage + 3 blog posts)
- **Sitemap:** submitted to Google Search Console (pending)
- **Schema.org:** WebApplication + FAQPage structured data on homepage
- **Blog posts:**
  1. `how-to-convert-x-articles-to-markdown.html` — targets "x article to markdown", "how to convert x articles"
  2. `best-ways-to-save-twitter-threads-for-ai-analysis.html` — targets "save twitter thread", "twitter to markdown"
  3. `x-articles-to-obsidian-complete-guide.html` — targets "x articles to obsidian", "twitter to obsidian"

### Target Keywords (priority order)

**Primary (tool-intent):**
- "x article to markdown"
- "tweet to markdown"
- "twitter to markdown converter"
- "convert x post to markdown"
- "x to md"

**Secondary (use-case intent):**
- "paste x article into chatgpt"
- "feed twitter thread to claude"
- "save x article to obsidian"
- "twitter thread to obsidian markdown"
- "convert tweet for ai analysis"

**Long-tail (high-intent, low competition):**
- "how to convert x articles to markdown for claude"
- "x article to markdown for obsidian"
- "twitter to markdown for ai analysis"
- "openclaw x article markdown"
- "claude code x article"
- "save x articles before deletion"
- "x article to notion markdown"
- "twitter thread markdown download"

**AI Search Engine Keywords (Perplexity, ChatGPT search, Copilot):**
- "free tool to convert x articles to markdown"
- "best way to convert tweets to markdown 2026"
- "how to feed x articles to ai"
- "x article markdown converter online free"

### Blog Posts Needed (for SEO campaign)

**Immediate priority (publish this week):**
1. "How to Use OpenClaw with X Articles — Convert to Markdown First" — targets OpenClaw users who can't fetch X URLs directly
2. "Feed X Articles to Claude: Step-by-Step Guide" — targets Claude users specifically
3. "ChatGPT Can't Read X Articles — Here's the Fix" — problem-solution format, high intent
4. "X Articles vs Threads: What's the Difference and How to Convert Both"

**Next batch (week 2-3):**
5. "Best Free Tools to Convert Tweets to Markdown in 2026" — comparison post, we rank #1
6. "How to Archive X Articles Before They Get Deleted"
7. "Twitter to Notion: The Complete 2026 Guide"
8. "Building an AI Research Pipeline with X Content and Claude"
9. "Why Markdown is the Best Format for AI Analysis"
10. "X Article to Logseq: Complete Setup Guide"

**Monthly ongoing:**
- 2-4 blog posts per month targeting new long-tail keywords
- Update existing posts with fresh content and dates
- Add new use cases as AI tools evolve

### SEO Technical Checklist
- [x] Title tags optimized with primary keywords
- [x] Meta descriptions with CTAs
- [x] Canonical URLs set
- [x] Open Graph + Twitter Card meta tags
- [x] Schema.org WebApplication structured data
- [x] Schema.org FAQPage structured data
- [x] robots.txt with sitemap reference
- [x] sitemap.xml submitted
- [x] Mobile-responsive (3 breakpoints)
- [x] Fast load time (Cloudflare edge, no JS frameworks)
- [ ] Google Search Console verified + sitemap submitted
- [ ] Bing Webmaster Tools setup
- [ ] Blog post Schema.org Article markup
- [ ] Internal linking between blog posts
- [ ] 404 page
- [ ] www → non-www redirect (or vice versa)
- [ ] Page speed audit (Lighthouse)

### AI Search Engine Optimization (AEO)
To rank in AI search results (Perplexity, ChatGPT, Copilot, Claude search):
- Write in clear, factual, authoritative tone
- Use question-format headings (H2s) that match how people ask AI
- Provide definitive answers in the first paragraph after each heading
- Include specific how-to numbered steps
- FAQ sections at bottom of every page
- Keep content fresh with dates ("Updated March 2026")
- Structured data helps AI engines extract answers

---

## Monetization Plan (future)

### Phase 1 (Month 1-2): Free + Donations
- Buy Me a Coffee / Ko-fi button
- Expect: $50-200/mo

### Phase 2 (Month 2-3): Ads + Freemium
- Carbon Ads or EthicalAds (developer-friendly)
- Premium tier ($3/mo): batch convert, custom templates, API access
- Expect: $300-1K/mo at 10K users

### Phase 3 (Month 4+): API + Extensions
- Paid API access ($5-10/mo)
- Chrome extension (freemium)
- Obsidian plugin
- Team plans for researchers

### Revenue Projections
| Monthly Users | Ads | Freemium (2%) | Total |
|--------------|-----|---------------|-------|
| 10K | $300-600 | $500 | ~$1K/mo |
| 50K | $1.5-3K | $2.5K | ~$5K/mo |
| 100K | $3-6K | $5K | ~$10K/mo |

---

## Deployment & Iteration

### Deploy Process
```bash
# After making changes:
cd "C:\Users\alext\xarticle to md"
git add -A
git commit -m "description of changes"
git push origin main
npx wrangler pages deploy public --project-name xtomd
```

### Future: GitHub Actions CI/CD
Set up auto-deploy on push to main:
- Connect GitHub repo to Cloudflare Pages in dashboard
- Every `git push` auto-deploys
- No manual `wrangler deploy` needed

---

## Legal & ToS Considerations

- We use the FXTwitter API which is technically unauthorized by X's ToS
- X has never sued similar tools (Nitter, FixTweet, ThreadReaderApp)
- Courts have ruled scraping public data is not a CFAA violation (hiQ v. LinkedIn)
- Mitigations: don't store content, rate limit, add takedown mechanism, frame as "format converter"
- If FXTwitter goes down, fallback to oEmbed API (limited but stable)

---

## Key Links
- **Live site:** https://xtomd.com
- **GitHub:** https://github.com/innov8academy/xtomd
- **Cloudflare Dashboard:** dash.cloudflare.com → xtomd project
- **Google Search Console:** search.google.com/search-console (add xtomd.com)
- **Bing Webmaster:** bing.com/webmasters
- **Product Hunt:** producthunt.com (schedule launch)
