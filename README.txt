# SpyTON Ton Trending — Landing Page (Netlify Ready)

This is a simple 1-page website inspired by modern crypto landing pages (dark + neon gradient).
It’s built with plain HTML/CSS/JS (no build step).

## Files
- index.html
- styles.css
- script.js
- spyton-character.png

## Deploy on Netlify
- Netlify → Add new site → Deploy manually → upload the zip (or these files)

## Update Telegram links
Open index.html and edit:
- https://t.me/SpyTonTrending
- https://t.me/TonProjectListing
- https://t.me/SpyTONTrndBot


=== Edit REDO + Leaderboard ===
Edit config.json:
- featured_token.contract_address (REDO CA)
- featured_token.geckoterminal_chart_url
- leaderboard (name + time_left)

Site auto-loads config.json.


Live leaderboard source: https://t.me/SpyTonTrending/15950
Parsed format: 1 - $TEW | +43%
Edit config.json -> live_leaderboard.message_id if you change it.
