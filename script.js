
(function () {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  // Mobile menu (hamburger)
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  function closeMenu(){
    if (!mobileNav || !menuBtn) return;
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden','true');
    menuBtn.setAttribute('aria-label','Open menu');
  }
  function toggleMenu(){
    if (!mobileNav || !menuBtn) return;
    const open = mobileNav.classList.toggle('is-open');
    mobileNav.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (menuBtn && mobileNav){
    // ensure closed on load
    closeMenu();
    menuBtn.addEventListener('click', (e)=>{ e.preventDefault(); toggleMenu(); });
    mobileNav.addEventListener('click', (e)=>{
      const link = e.target.closest('.mobileNav__link');
      if (link) closeMenu();
    });
    // close when tapping outside panel
    document.addEventListener('click', (e)=>{
      if (!mobileNav.classList.contains('is-open')) return;
      const inside = e.target.closest('#mobileNav') || e.target.closest('#menuBtn');
      if (!inside) closeMenu();
    });
    // close on resize to desktop
    window.addEventListener('resize', ()=>{
      if (window.innerWidth > 980) closeMenu();
    });
  }



  const pills = Array.from(document.querySelectorAll("[data-tab].tabBtn, .pill[data-tab]"));
  const tabLive = document.getElementById('tab-live');
  const tabBuy  = document.getElementById('tab-buy');
  const tabLb   = document.getElementById('tab-leaderboard');

  function setActive(name){
    pills.forEach(p => p.classList.toggle('tabBtn--active', (p.dataset.tab === name && p.classList.contains('tabBtn'))));
    pills.forEach(p => p.classList.toggle('pill--active', (p.dataset.tab === name && p.classList.contains('pill'))));

    if (tabLive) tabLive.classList.toggle('tab--active', name === 'live');
    if (tabBuy)  tabBuy.classList.toggle('tab--active', name === 'buy');
    if (tabLb)   tabLb.classList.toggle('tab--active', name === 'leaderboard');

    // Smooth scroll
    if (name === 'live'){
      const a = document.getElementById('liveAnchor');
      if (a) a.scrollIntoView({behavior:'smooth', block:'start'});
    } else if (name === 'buy' && tabBuy){
      tabBuy.scrollIntoView({behavior:'smooth', block:'start'});
    } else if (name === 'leaderboard' && tabLb){
      tabLb.scrollIntoView({behavior:'smooth', block:'start'});
    }
  }
  pills.forEach(p => p.addEventListener('click', () => setActive(p.dataset.tab)));

  async function loadConfig(){
    try{
      const res = await fetch('config.json', { cache:'no-store' });
      return res.ok ? await res.json() : null;
    }catch(e){ return null; }
  }

  function renderLiveRows(rows){
    const box = document.getElementById('lbRows');
    if (!box) return;
    box.innerHTML = '';
    if (!rows || !rows.length){
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.style.padding = '10px 2px';
      empty.textContent = 'Waiting for live leaderboard…';
      box.appendChild(empty);
      return;
    }
    rows.slice(0,3).forEach((r, idx) => {
      const chg = String(r.change||'').trim();
      const cls = chg.startsWith('+') ? 'pos' : (chg.startsWith('-') ? 'neg' : '');
      const row = document.createElement('div');
      row.className = 'lb__row';
      row.innerHTML = `
        <span>#${idx+1}</span>
        <span>${r.name || ''}</span>
        <span class="chg ${cls}">${chg}</span>
      `;
      box.appendChild(row);
    });
  }

  function renderLeaderboardCards(rows, cfg){
    const box = document.getElementById('lbCards');
    if (!box) return;
    box.innerHTML = '';
    if (!rows || !rows.length){
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.style.padding = '10px 2px';
      empty.textContent = 'No live leaderboard yet.';
      box.appendChild(empty);
      return;
    }
    const map = (cfg && cfg.token_map) ? cfg.token_map : {};
    rows.slice(0,10).forEach((r, idx) => {
      const sym = String(r.name||'').replace('$','').toUpperCase();
      const t = map[sym] || {};
      const chart = t.chart_url || '#';
      const buy = t.buy_url || '#';
      const chg = String(r.change||'').trim();
      const cls = chg.startsWith('+') ? 'pos' : (chg.startsWith('-') ? 'neg' : '');
      const card = document.createElement('div');
      card.className = 'lbCard';
      card.innerHTML = `
        <div class="lbCard__top">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="lbRank">#${idx+1}</div>
            <div>
              <div class="lbName">${r.name || ''}</div>
              <div class="muted">TON Trending</div>
            </div>
          </div>
          <div class="lbChange ${cls}">${chg}</div>
        </div>
        <div class="lbCard__actions">
          <a class="lbMiniBtn lbMiniBtn--primary" href="${buy}" target="_blank" rel="noreferrer">Buy on dTrade</a>
          <a class="lbMiniBtn" href="${chart}" target="_blank" rel="noreferrer">Chart</a>
        </div>
      `;
      box.appendChild(card);
    });
  }

  function renderBuyList(buys, cfg){
    const box = document.getElementById('buyList');
    if (!box) return;
    box.innerHTML = '';
    if (!buys || !buys.length){
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.style.padding = '10px 2px';
      empty.textContent = 'No buy alerts found yet.';
      box.appendChild(empty);
      return;
    }
    const map = (cfg && cfg.token_map) ? cfg.token_map : {};
    buys.forEach((b) => {
      const sym = String(b.token||'').replace('$','').toUpperCase();
      const t = map[sym] || {};
      const chart = t.chart_url || '#';
      const buy = t.buy_url || '#';
      const item = document.createElement('div');
      item.className = 'buyItem';
      item.innerHTML = `
        <div class="buyItem__top">
          <div>
            <div class="buyToken">${b.token || 'Buy'}</div>
            <div class="buyDex">${b.dex || ''}</div>
          </div>
          <a class="lbMiniBtn" href="${b.telegram_url || '#'}" target="_blank" rel="noreferrer">Open post</a>
        </div>
        <div class="buyMeta">
          ${b.ton ? `<span>💎 ${b.ton}</span>` : ``}
          ${b.amount ? `<span>📦 ${b.amount}</span>` : ``}
          ${b.wallet ? `<span>👤 ${b.wallet}</span>` : ``}
        </div>
        <div class="buyActions">
          <a class="lbMiniBtn lbMiniBtn--primary" href="${buy}" target="_blank" rel="noreferrer">Buy on dTrade</a>
          <a class="lbMiniBtn" href="${chart}" target="_blank" rel="noreferrer">Chart</a>
        </div>
      `;
      box.appendChild(item);
    });
  }

  function setFeaturedFromBuy(buy, cfg){
    if (!buy) return;
    const tokenName = document.getElementById('tokenName');
    const tokenSub  = document.getElementById('tokenSub');
    const tonAmount = document.getElementById('tonAmount');
    const tokenAmount = document.getElementById('tokenAmount');
    const walletShort = document.getElementById('walletShort');
    const buyLink = document.getElementById('buyLink');
    const chartLink = document.getElementById('chartLink');

    if (tokenName && buy.token) tokenName.textContent = buy.token;
    if (tokenSub) tokenSub.textContent = buy.dex ? `Buy! — ${buy.dex}` : 'Live Buy Alert';
    if (tonAmount) tonAmount.textContent = buy.ton || '—';
    if (tokenAmount) tokenAmount.textContent = buy.amount || '—';
    if (walletShort) walletShort.textContent = buy.wallet || '—';

    const map = (cfg && cfg.token_map) ? cfg.token_map : {};
    const sym = String(buy.token||'').replace('$','').toUpperCase();
    const t = map[sym] || {};
    if (buyLink && t.buy_url && t.buy_url !== '#') buyLink.href = t.buy_url;
    if (chartLink && t.chart_url && t.chart_url !== '#') chartLink.href = t.chart_url;
  }

  async function fetchLeaderboard(cfg){
    const live = (cfg && cfg.live_leaderboard) ? cfg.live_leaderboard : {};
    const channel = live.channel || 'SpyTonTrending';
    const msg = live.message_id || 15950;
    const max = live.max_rows || 10;
    const url = `/.netlify/functions/leaderboard?channel=${encodeURIComponent(channel)}&message=${encodeURIComponent(msg)}&max=${encodeURIComponent(max)}`;
    const res = await fetch(url, { cache:'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data && data.ok && Array.isArray(data.leaderboard)) ? data.leaderboard : [];
  }

  async function fetchBuys(cfg){
    const ba = (cfg && cfg.buy_alerts) ? cfg.buy_alerts : {};
    const channel = ba.channel || 'SpyTonTrending';
    const max = ba.max || 6;
    const url = `/.netlify/functions/buyalerts?channel=${encodeURIComponent(channel)}&max=${encodeURIComponent(max)}`;
    const res = await fetch(url, { cache:'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data && data.ok && Array.isArray(data.buys)) ? data.buys : [];
  }

  async function run(){
    const cfg = await loadConfig();
    if (!cfg) return;

    // fallback immediately
    if (Array.isArray(cfg.leaderboard)){
      const fb = cfg.leaderboard.map(x => ({ name:x.name, change:x.change || x.time_left || '' }));
      renderLiveRows(fb);
      renderLeaderboardCards(fb, cfg);
    }

    const lb = await fetchLeaderboard(cfg);
    if (lb && lb.length){
      renderLiveRows(lb);
      renderLeaderboardCards(lb, cfg);
    }

    const buys = await fetchBuys(cfg);
    if (buys && buys.length){
      renderBuyList(buys, cfg);
      setFeaturedFromBuy(buys[0], cfg);
    } else {
      renderBuyList([], cfg);
    }

    const lbSec = (cfg.live_leaderboard && cfg.live_leaderboard.refresh_seconds) ? cfg.live_leaderboard.refresh_seconds : 30;
    setInterval(async () => {
      const lb2 = await fetchLeaderboard(cfg);
      if (lb2 && lb2.length){
        renderLiveRows(lb2);
        renderLeaderboardCards(lb2, cfg);
      }
    }, Math.max(10, lbSec) * 1000);

    const baSec = (cfg.buy_alerts && cfg.buy_alerts.refresh_seconds) ? cfg.buy_alerts.refresh_seconds : 20;
    setInterval(async () => {
      const buys2 = await fetchBuys(cfg);
      if (buys2 && buys2.length){
        renderBuyList(buys2, cfg);
        setFeaturedFromBuy(buys2[0], cfg);
      }
    }, Math.max(10, baSec) * 1000);
  }

  run();
})();
