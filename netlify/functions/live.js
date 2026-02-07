// netlify/functions/live.js
// SpyTON Live API (no GitHub token needed)
// - Reads optional buys from /data/live.json
// - Always fetches 24h change % from GeckoTerminal for UTYA/FRT/REDO

const fs = require("fs");
const path = require("path");

// ✅ Set your token addresses here
const UTYA_TOKEN =
  process.env.UTYA_TOKEN ||
  "EQBaCgUwOoc6gHCNln_oJzb0mVs79YG7wYoavh-o1ItaneLA"; // UTYA token address

const FRT_TOKEN = "EQA1EIDrR33zgL21rwDIfGo7h4ETWieentUvg7jIT-3aP5GG";
const REDO_TOKEN = "EQBZ_cafPyDr5KUTs0aNxh0ZTDhkpEZONmLJA2SNGlLm4Cko";

// Optional: your public channel link (used by website buttons)
const TELEGRAM_CHANNEL = process.env.TELEGRAM_CHANNEL || "https://t.me/SpyTonTrending";

// -------- helpers --------

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store", // live endpoint
    },
    body: JSON.stringify(data),
  };
}

function safeReadLiveJson() {
  try {
    // project root -> /data/live.json
    const filePath = path.join(process.cwd(), "data", "live.json");
    if (!fs.existsSync(filePath)) return { updated_at: "", leaderboard: [], buys: [] };
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      updated_at: parsed.updated_at || "",
      leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [],
      buys: Array.isArray(parsed.buys) ? parsed.buys : [],
    };
  } catch (e) {
    return { updated_at: "", leaderboard: [], buys: [] };
  }
}

// Fetch token 24h % change from GeckoTerminal
// Uses: https://api.geckoterminal.com/api/v2/networks/ton/tokens/{address}
async function geckoTokenChangePct(tokenAddress) {
  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/ton/tokens/${encodeURIComponent(
      tokenAddress
    )}`;

    const res = await fetch(url, {
      headers: {
        "accept": "application/json",
      },
    });

    if (!res.ok) return null;

    const j = await res.json();
    const attrs = j?.data?.attributes;

    // GeckoTerminal commonly provides:
    // - price_change_percentage?.h24
    // - price_change_percentage_24h (sometimes)
    const v =
      attrs?.price_change_percentage?.h24 ??
      attrs?.price_change_percentage_24h ??
      null;

    if (v === null || v === undefined) return null;

    const n = Number(v);
    if (!Number.isFinite(n)) return null;

    // Round to 2 decimals for display
    return Math.round(n * 100) / 100;
  } catch (e) {
    return null;
  }
}

function geckoTokenUrl(tokenAddress) {
  return `https://www.geckoterminal.com/ton/tokens/${tokenAddress}`;
}

function dtradeBuyUrl(tokenAddress) {
  // Your dTrade referral base
  const base = process.env.DTRADE_REF || "https://t.me/dtrade?start=11TYq7LInG";
  // Attach token address after underscore like you wanted
  return `${base}_${tokenAddress}`;
}

// -------- handler --------

exports.handler = async () => {
  // read optional buys saved in repo file
  const stored = safeReadLiveJson();

  // live leaderboard % from GeckoTerminal
  const [utyaPct, frtPct, redoPct] = await Promise.all([
    geckoTokenChangePct(UTYA_TOKEN),
    geckoTokenChangePct(FRT_TOKEN),
    geckoTokenChangePct(REDO_TOKEN),
  ]);

  const leaderboard = [
    {
      rank: 1,
      symbol: "UTYA",
      token: UTYA_TOKEN,
      change_24h: utyaPct, // number or null
      chart_url: geckoTokenUrl(UTYA_TOKEN),
      buy_url: dtradeBuyUrl(UTYA_TOKEN),
    },
    {
      rank: 2,
      symbol: "FRT",
      token: FRT_TOKEN,
      change_24h: frtPct,
      chart_url: geckoTokenUrl(FRT_TOKEN),
      buy_url: dtradeBuyUrl(FRT_TOKEN),
    },
    {
      rank: 3,
      symbol: "REDO",
      token: REDO_TOKEN,
      change_24h: redoPct,
      chart_url: geckoTokenUrl(REDO_TOKEN),
      buy_url: dtradeBuyUrl(REDO_TOKEN),
    },
  ];

  // Output: leaderboard always live, buys from data/live.json (if present)
  return jsonResponse(200, {
    updated_at: new Date().toISOString(),
    telegram: TELEGRAM_CHANNEL,
    leaderboard,
    buys: stored.buys || [],
  });
};
