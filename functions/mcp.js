// Cloudflare Pages Function: MCP Streamable HTTP endpoint
// Implements Model Context Protocol over HTTP for Smithery and other MCP clients
// Spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

const SERVER_INFO = {
  name: "xtomd",
  version: "1.0.0",
};

const SERVER_CAPABILITIES = {
  tools: {},
};

const TOOLS = [
  {
    name: "convert_x_to_markdown",
    description:
      "Convert an X (Twitter) URL to clean Markdown. Works with X Articles (long-form), tweets, threads, and note tweets. Use this when you encounter an X/Twitter link and need to read its content.",
    inputSchema: {
      type: "object",
      required: ["url"],
      properties: {
        url: {
          type: "string",
          description:
            "X/Twitter URL to convert (e.g., https://x.com/user/status/123 or https://x.com/user/article/456)",
        },
      },
    },
  },
];

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

// Handle MCP POST requests (JSON-RPC)
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    // Handle batch requests
    if (Array.isArray(body)) {
      const results = [];
      for (const req of body) {
        const result = await handleJsonRpc(req, context);
        if (result) results.push(result);
      }
      if (results.length === 0) {
        return new Response(null, { status: 202, headers: CORS_HEADERS });
      }
      return jsonResponse(results);
    }

    // Handle single request
    const result = await handleJsonRpc(body, context);

    // Notifications don't get responses
    if (!result) {
      return new Response(null, { status: 202, headers: CORS_HEADERS });
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error: " + err.message },
    });
  }
}

// Handle GET for SSE (not needed for basic operation, return 405)
export async function onRequestGet() {
  return new Response(JSON.stringify({ error: "SSE not supported, use POST" }), {
    status: 405,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// Handle DELETE for session cleanup
export async function onRequestDelete() {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

// ---------------------------------------------------------------------------
// JSON-RPC Handler
// ---------------------------------------------------------------------------

async function handleJsonRpc(req, context) {
  const { method, id, params } = req;

  // Notifications (no id) — acknowledge silently
  if (id === undefined || id === null) {
    return null;
  }

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: SERVER_CAPABILITIES,
          serverInfo: SERVER_INFO,
        },
      };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS },
      };

    case "tools/call":
      return await handleToolCall(id, params, context);

    case "ping":
      return { jsonrpc: "2.0", id, result: {} };

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

// ---------------------------------------------------------------------------
// Tool Execution
// ---------------------------------------------------------------------------

async function handleToolCall(id, params, context) {
  const toolName = params?.name;
  const args = params?.arguments || {};

  if (toolName !== "convert_x_to_markdown") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
        isError: true,
      },
    };
  }

  const url = args.url;
  if (!url) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: "Missing required parameter: url" }],
        isError: true,
      },
    };
  }

  try {
    // Call our own /api/markdown endpoint
    const origin = new URL(context.request.url).origin;
    const resp = await fetch(`${origin}/api/markdown`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `Error: ${err.error || "Could not fetch content from X. The post may be private, deleted, or require authentication."}`,
            },
          ],
          isError: true,
        },
      };
    }

    const data = await resp.json();

    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: data.markdown }],
      },
    };
  } catch (err) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}
