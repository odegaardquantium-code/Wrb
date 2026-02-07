function decodeHtml(str){
  return str.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
            .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ");
}
function stripTags(html){
  return decodeHtml(html.replace(/<br\s*\/?>/gi,"\n").replace(/<\/p>/gi,"\n").replace(/<[^>]+>/g,"")).trim();
}
function extractMessages(html, maxScan){
  const out=[];
  const re = /<div class="tgme_widget_message[^"]*"[^>]*data-post="([^"]+)"[\s\S]*?<div class="tgme_widget_message_text[^"]*">([\s\S]*?)<\/div>/gi;
  let m;
  while ((m = re.exec(html)) !== null){
    out.push({ post:m[1], text: stripTags(m[2]) });
    if (out.length >= maxScan) break;
  }
  return out;
}
function parseBuy(text){
  const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
  let dex="", ton="", amount="", wallet="", token="";
  for (const l of lines){
    if (/buy!/i.test(l) && l.includes("—")) dex = l.split("—").pop().trim();
  }
  for (const l of lines){
    const mm=l.match(/\|\s*([A-Z0-9_]{2,12})\b/);
    if (mm){ token = mm[1]; break; }
  }
  const tline = lines.find(l => /\bTON\b/i.test(l) && /[\d,.]+/.test(l));
  if (tline){
    const mm=tline.match(/([\d,.]+)\s*TON/i);
    if (mm) ton = mm[1] + " TON";
  }
  for (const l of lines){
    const mm=l.match(/([\d,.]+)\s*([A-Z0-9_]{2,12})\b/);
    if (mm){
      if (!token || mm[2] === token){
        amount = mm[1] + " " + mm[2];
        if (!token) token = mm[2];
        break;
      }
    }
  }
  for (const l of lines){
    const mm=l.match(/\b([A-Z0-9]{2}\.\.\.[A-Za-z0-9]{3,})\b/);
    if (mm){ wallet = mm[1]; break; }
  }
  return { token: token ? "$"+token : "", dex, ton, amount, wallet, raw:text };
}
exports.handler = async function(event){
  try{
    const q = event.queryStringParameters || {};
    const channel = q.channel || "SpyTonTrending";
    const max = Math.min(parseInt(q.max || "6",10) || 6, 15);
    const url = `https://t.me/s/${encodeURIComponent(channel)}`;
    const res = await fetch(url, { headers: { "user-agent":"Mozilla/5.0 (compatible; SpyTONLanding/5.0)" }});
    if (!res.ok){
      return { statusCode:200, headers:{ "content-type":"application/json", "cache-control":"no-store" },
        body: JSON.stringify({ ok:false, buys:[], error:`Fetch failed: ${res.status}` }) };
    }
    const html = await res.text();
    const msgs = extractMessages(html, 100);
    const buys=[];
    for (const m of msgs){
      if (/buy!/i.test(m.text)){
        const p=parseBuy(m.text);
        buys.push({ ...p, telegram_url:`https://t.me/${m.post}` });
        if (buys.length>=max) break;
      }
    }
    return { statusCode:200, headers:{ "content-type":"application/json", "cache-control":"no-store" },
      body: JSON.stringify({ ok:true, channel, buys }) };
  }catch(e){
    return { statusCode:200, headers:{ "content-type":"application/json", "cache-control":"no-store" },
      body: JSON.stringify({ ok:false, buys:[], error:String(e) }) };
  }
};
