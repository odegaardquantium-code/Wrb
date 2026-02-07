export default async (request, context) => {
  try {
    const owner = process.env.GH_OWNER;
    const repo = process.env.GH_REPO;
    const path = process.env.GH_PATH || "data/live.json";
    const branch = process.env.GH_BRANCH || "main";
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: "Missing GH_OWNER / GH_REPO" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "spyton-netlify-function",
        "Accept": "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      const txt = await res.text();
      return new Response(
        JSON.stringify({ error: "GitHub fetch failed", status: res.status, details: txt }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const json = await res.json();
    // GitHub content API gives base64 content
    const content = json.content ? Buffer.from(json.content, "base64").toString("utf8") : "{}";

    return new Response(content, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store"
      }
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Function crash", message: String(e) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};
