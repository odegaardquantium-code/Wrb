// netlify/functions/live.js

exports.handler = async () => {
  try {
    // live.json is in your site repo: /data/live.json
    // Netlify publishes it, so we can fetch it via the same domain.
    // But inside a function we can read it via relative URL using absolute path trick:
    // easiest: fetch from the deployed site path
    const res = await fetch("https://spyton.netlify.app/data/live.json?t=" + Date.now(), {
      headers: { "cache-control": "no-store" },
    });

    // If fetch fails (first deploy), return empty structure
    if (!res.ok) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ updated_at: "", leaderboard: [], buys: [] }),
      };
    }

    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ updated_at: "", leaderboard: [], buys: [] }),
    };
  }
};
