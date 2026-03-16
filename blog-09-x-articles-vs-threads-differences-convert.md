**Primary keyword:** x articles vs threads convert
**Meta title:** X Articles vs Threads: What's the Difference and How to Convert Both | xtomd.com
**Meta description:** Learn the difference between X articles and threads, and how to convert both to Markdown for archiving or AI analysis.

# X Articles vs Threads: What's the Difference and How to Convert Both

People use "thread" and "article" interchangeably on X. They're actually different things with different formats, different limitations, and different conversion methods. Understanding the distinction matters if you're parsing content for research, archiving, or AI analysis.

## What exactly is an X Article?

X Articles are long-form posts created with X's Draft.js editor. They're what used to be called "Twitter Notes" before the rebrand. You get a WYSIWYG interface that supports headings (H2, H3, H4), bold, italic, ordered and unordered lists, images, blockquotes, and links.

An X Article isn't a separate post type—it lives at a URL that looks identical to a regular tweet (`x.com/username/status/id`), but when you open it, you get the full formatted content instead of a 280-character tweet. The permalink doesn't tell you which you're dealing with until you load the page.

Articles can be up to 25,000 characters. They're indexed in X's search and can go viral like any other post.

## What exactly is an X Thread?

An X Thread is a chain of connected tweets. Tweet 1 replies to tweet 2, which replies to tweet 3, and so on. Each individual tweet maxes out at 280 characters (or 25,000 for Premium members on X/Grok posts, but that's a different feature).

The "thread" itself has no special formatting. It's just tweets connected through replies. You can't add headings, bold text, or images to individual tweets within the thread using special formatting—you get basic text, links, and media attachments like you would on any tweet.

When someone says "I read a great thread," they mean they clicked through a chain of replies. Threads are social by nature. People reply to individual tweets in the thread, quote the best part, or share one tweet without the full context.

## How do these compare? A head-to-head breakdown

| Feature | X Articles | X Threads |
|---------|-----------|----------|
| **Max length** | 25,000 characters | 280 per tweet (unlimited chain) |
| **Formatting** | Headings, bold, italic, lists, blockquotes, images | Basic text only |
| **Structure** | Single document with hierarchy | Sequential tweets |
| **Editing after publish** | Can edit | Each tweet can be edited individually |
| **Permalink** | Single URL | Multiple URLs (one per tweet) |
| **Discoverability** | Fully searchable; shows in feed as single post | Searchable; shows tweets individually in feed |
| **Engagement** | Comments on the whole article | Comments on individual tweets |
| **Conversion difficulty** | Moderate (requires Draft.js parsing) | High (need to collect all tweets in sequence) |

## How to tell which one you're looking at

On the X platform, Articles and threads look visually different:

**Articles** display with a label that says "Article" or show a formatted preview in your feed with the headline visible. When you open the full post, you see the rich formatting—headings, bold text, structured layout.

**Threads** appear as regular tweets in your feed. The first tweet in the thread doesn't say "thread"—you figure that out by clicking through and seeing the reply chain. It's just tweets stacked on top of each other.

If you're not sure, open the post. If you see formatted text with headings and styled elements, it's an Article. If you see 280-character chunks connected by "in reply to," it's a thread.

## Converting X Articles to Markdown

xtomd.com handles X Article conversion by parsing the Draft.js editor output and extracting all formatting, images, links, and structure. Here's how it works:

1. **Copy the Article URL.** Go to any X Article and grab the full link from your browser bar.
2. **Paste it into xtomd.com.** Our parser recognizes the Article format and pulls the Draft.js data.
3. **Get Markdown.** The conversion preserves headings, bold, italic, lists, blockquotes, and image URLs. You get a clean, structured Markdown file.
4. **Download or copy.** Export as `.md` and use it in your docs, analysis, or archival system.

The conversion is reliable because Articles have structured data. Draft.js is a standardized format, so the output is consistent.

## Converting X Threads to Markdown

This is trickier. xtomd.com currently converts individual tweets in a thread, but not the full chain as a cohesive unit. If you need to preserve an entire thread, you have options:

**Option 1: Convert tweets one at a time.** Grab each tweet's URL from the thread and run it through xtomd.com individually, then stitch the Markdown files together in order.

**Option 2: Use ThreadReaderApp first.** ThreadReaderApp combines thread tweets into a single formatted post that you can then convert. Copy the ThreadReaderApp URL into xtomd.com.

**Option 3: Wait for full thread support.** We're working on native thread chain detection and conversion at xtomd.com. This is coming.

Manual approach: If neither option works, copy-paste each tweet into a text file, format it in Markdown manually, and add line breaks between tweets. It's slow, but it preserves the thread intact.

## Why Articles are better for AI analysis

If you're feeding content into an AI system—whether that's analysis, summarization, or fine-tuning—Articles are superior to threads.

**Articles have structure.** Headings tell the AI what sections are important. Lists are machine-readable. Blockquotes indicate emphasis. The AI can understand the document's intent just from the formatting.

**Threads are flat.** An AI sees a sequence of text blocks with no hierarchy. It has to infer connections and relationships. The semantic meaning is less explicit. You lose information in the conversion.

For archival or research purposes, Articles are also easier to cite. They're single documents with single URLs. Threads require you to decide which tweet is the "start" and how to represent the full chain.

## FAQ

**Can I edit an X Article after I publish it?**
Yes. You can edit an Article just like you'd edit a tweet. Changes appear immediately. If you've already converted it to Markdown, your Markdown won't update—you'd need to reconvert.

**If I convert a thread to Markdown, do I need to include every tweet?**
No. You can convert individual tweets or specific sections of a thread. It depends on what you're preserving the content for. If you need the full context, grab all of them. If you're pulling a specific quote, convert just that tweet.

**Does xtomd.com preserve images in Articles?**
Yes. Image URLs are embedded in the Markdown output as `![alt](url)`. You get the link, not a downloaded file.

**Can I convert an X Article that's been deleted?**
No. If the post is gone, xtomd.com can't reach it. The URL will return a 404.

**What happens if a thread gets cut off—like I only grabbed 5 tweets out of 10?**
You'll have an incomplete conversion. That's why the manual approach is tedious. ThreadReaderApp helps here because it detects and collects the full chain automatically.

## The takeaway

X Articles and threads serve different purposes. Articles are long-form, structured, and easier to convert to Markdown. Threads are conversational, participatory, and require more work to preserve in a single document.

If you're converting content to Markdown, start with Articles. They're faster, more reliable, and retain their full meaning. For threads, use ThreadReaderApp as a first step if you need the full chain.

Want to try it? Grab an X Article URL and paste it into [xtomd.com](https://xtomd.com). Full thread support is coming soon.

---

## Related reads

- [How to Convert X Articles to Markdown](https://xtomd.com/blog/how-to-convert-x-articles-to-markdown.html)
- [Best Ways to Save Twitter Threads for AI Analysis](https://xtomd.com/blog/best-ways-to-save-twitter-threads-for-ai-analysis.html)
- [X Articles to Obsidian: Complete Guide](https://xtomd.com/blog/x-articles-to-obsidian-complete-guide.html)
