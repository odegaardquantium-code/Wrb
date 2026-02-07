function decodeHtml(str){
  return str.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
            .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ");
}
function stripTags(html){
  return decodeHtml(html.replace(/<br\s*\/?>/gi,"\n").replace(/<\/p>/gi,"\n").replace(/<[^>]+>/g,"")).trim();
}
function normalizeLeadingDigits(line){
  const map={"0️⃣":"0","1️⃣":"1","2️⃣":"2","3️⃣":"3","4️⃣":"4","5️⃣":"5","6️⃣":"6","7️⃣":"7","8️⃣":"8","9️⃣":"9",
             "0⃣":"0","1⃣":"1","2⃣":"2","3⃣":"3","4⃣":"4","5⃣":"5","6⃣":"6","7⃣":"7","8⃣":"8","9⃣":"9"};
  for (const k of Object.keys(map)) if (line.startsWith(k)) return (map[k]+line.slice(k.length)).trim();
  return line.replace(/^(\d)\uFE0F?\u20E3/, "$1").trim();
}
function parseTrending(text, maxRows){
  const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
  const rows=[];
  for (let line of lines){
    line = line.replace(/^[^0-9]+/, '').trim();
    line = normalizeLeadingDigits(line);
    const m=line.match(/^(\d{1,2})\s*[-–—]\s*\$?([A-Za-z0-9_]+)\s*\|\s*([+\-]?\d+(?:\.\d+)?%?)\s*$/);
    if (m){
      rows.push({rank:parseInt(m[1],10), name:"$"+String(m[2]).toUpperCase(), change:m[3]});
    }
  }
  return rows.sort((a,b)=>a.rank-b.rank).slice(0,maxRows).map(r=>({name:r.name, change:r.change}));
}
function extractFromEmbed(html){
  const m=html.match(/<div class="tgme_widget_message_text[^"]*">([\s\S]*?)<\/div>/i);
  return m ? stripTags(m[1]) : "";
}
function extractFromS(html, msgid){
  const re = new RegExp(`data-post="[^"]+\\/${msgid}"[\\s\\S]*?<div class="tgme_widget_message_text[^"]*">([\\s\\S]*?)<\\/div>`, "i");
  const mm = html.match(re);
  if (mm) return stripTags(mm[1]);
  const m2 = html.match(/<div class="tgme_widget_message_text[^"]*">([\s\S]*?)<\/div>/i);
  return m2 ? stripTags(m2[1]) : "";
}
async function fetchText(channel, msgid){
  const urlEmbed = `https://t.me/${encodeURIComponent(channel)}/${encodeURIComponent(msgid)}?embed=1`;
  const resE = await fetch(urlEmbed, { headers: { "user-agent":"Mozilla/5.0 (compatible; SpyTONLanding/5.0)" }});
  if (resE.ok){
    const htmlE = await resE.text();
    const tE = extractFromEmbed(htmlE);
    if (tE) return tE;
  }

  const urlS = `https://t.me/s/${encodeURIComponent(channel)}/${encodeURIComponent(msgid)}`;
  const resS = await fetch(urlS, { headers: { "user-agent":"Mozilla/5.0 (compatible; SpyTONLanding/5.0)" }});
  if (resS.ok){
    const htmlS = await resS.text();
    const tS = extractFromS(htmlS, msgid);
    if (tS) return tS;
  }
  return "";
}
exports.handler = async function(event){
  try{
    const q = event.queryStringParameters || {};
    const channel = q.channel || "SpyTonTrending";
    const message = q.message || "15950";
    const max = Math.min(parseInt(q.max || "10",10) || 10, 20);
    const text = await fetchText(channel, message);
    const leaderboard = parseTrending(text, max);
    return { statusCode: 200, headers: { "content-type":"application/json", "cache-control":"no-store" },
      body: JSON.stringify({ ok:true, channel, message, leaderboard }) };
  }catch(e){
    return { statusCode: 200, headers: { "content-type":"application/json", "cache-control":"no-store" },
      body: JSON.stringify({ ok:false, leaderboard:[], error:String(e) }) };
  }
};