exports.handler = async function () {
  const owner = process.env.GH_OWNER;
  const repo  = process.env.GH_REPO;
  const path  = process.env.GH_PATH || "data/live.json";
  const branch = process.env.GH_BRANCH || "main";

  if (!owner || !repo) {
    return {
      statusCode: 400,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
      body: JSON.stringify({ error: "Missing GH_OWNER / GH_REPO" })
    };
  }

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const res = await fetch(rawUrl);

  if (!res.ok) {
    return {
      statusCode: 502,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
      body: JSON.stringify({ error: "Failed to fetch live file", status: res.status, url: rawUrl })
    };
  }

  const text = await res.text();
  return {
    statusCode: 200,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "no-store" },
    body: text
  };
};
