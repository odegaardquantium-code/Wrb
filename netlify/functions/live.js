export async function handler() {
  try {
    // live.json is stored in your repo at /data/live.json
    const resp = await fetch(new URL("../../data/live.json", import.meta.url));
    const text = await resp.text();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: text
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ updated_at: "", leaderboard: [], buys: [], error: String(e) })
    };
  }
}
