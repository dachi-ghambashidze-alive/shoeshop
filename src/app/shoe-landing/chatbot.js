/* Soleworks assistant: simple rule-based shop chatbot (no API needed) */
(function () {
  const css = `
  #swc-btn{position:fixed;right:22px;bottom:22px;z-index:90;width:60px;height:60px;border-radius:50%;border:0;background:linear-gradient(135deg,#e9c46a,#c59b3f);color:#111;font-size:26px;box-shadow:0 10px 30px rgba(197,155,63,.55);cursor:pointer;transition:transform .2s}
  #swc-btn:hover{transform:scale(1.08) rotate(-6deg)}
  #swc{position:fixed;right:22px;bottom:96px;z-index:90;width:360px;max-width:calc(100vw - 28px);height:520px;max-height:calc(100vh - 120px);display:none;flex-direction:column;background:#0e0f11;color:#f3efe6;border:1px solid #3a3426;border-radius:20px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.45)}
  #swc.open{display:flex;animation:swcIn .25s ease}
  @keyframes swcIn{from{opacity:0;transform:translateY(12px) scale(.97)}}
  #swc header{position:static;background:linear-gradient(135deg,#1c1a14,#2b2415);padding:14px 16px;border-bottom:1px solid #3a3426;display:flex;justify-content:space-between;align-items:center}
  #swc header b{font-size:14px;letter-spacing:.06em}#swc header small{color:#c59b3f;display:block;font-size:11px}
  #swc header button{background:none;border:0;color:#aaa;font-size:20px;cursor:pointer}
  #swc-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
  .swc-m{max-width:84%;padding:10px 13px;border-radius:14px;font-size:13.5px;line-height:1.45}
  .swc-b{background:#1d1c19;border:1px solid #302c22;align-self:flex-start;border-bottom-left-radius:4px}
  .swc-u{background:#c59b3f;color:#111;align-self:flex-end;border-bottom-right-radius:4px;font-weight:600}
  .swc-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px}
  .swc-chips button{background:transparent;border:1px solid #5b4c25;color:#e9c46a;border-radius:999px;padding:5px 11px;font-size:12px;cursor:pointer}
  .swc-chips button:hover{background:#c59b3f;color:#111}
  #swc-form{display:flex;gap:8px;padding:10px;border-top:1px solid #3a3426}
  #swc-in{flex:1;background:#1a1916;border:1px solid #3a3426;border-radius:999px;color:#fff;padding:9px 14px;font-size:13.5px}
  #swc-form button{background:#c59b3f;border:0;border-radius:999px;padding:0 16px;font-weight:700;cursor:pointer}
  .swc-dots span{display:inline-block;width:6px;height:6px;margin-right:3px;background:#c59b3f;border-radius:50%;animation:swcD 1s infinite}
  .swc-dots span:nth-child(2){animation-delay:.15s}.swc-dots span:nth-child(3){animation-delay:.3s}
  @keyframes swcD{50%{transform:translateY(-4px);opacity:.4}}
  @media (prefers-reduced-motion:reduce){#swc.open,.swc-dots span{animation:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const root = document.createElement('div');
  root.innerHTML = `<button id="swc-btn" aria-label="Open shoe assistant">👟</button>
  <section id="swc" role="dialog" aria-label="Soleworks assistant">
    <header><div><b>SOLEWORKS ASSISTANT</b><small>Ask about shoes, sizes, offers</small></div><button id="swc-x" aria-label="Close">×</button></header>
    <div id="swc-log" aria-live="polite"></div><div class="swc-chips" id="swc-chips"></div>
    <form id="swc-form"><input id="swc-in" placeholder="Ask me anything…" autocomplete="off"><button>Send</button></form>
  </section>`;
  document.body.appendChild(root);
  const $q = s => root.querySelector(s), log = $q('#swc-log');

  const CHIPS = ['Today\'s offers', 'Shoes under $100', 'Best sellers', 'Size help', 'Shipping & returns'];
  const money = n => '$' + n;
  const prods = () => (typeof db !== 'undefined' && db.products) || [];
  const say = (t, who) => { const d = document.createElement('div'); d.className = 'swc-m ' + (who ? 'swc-u' : 'swc-b'); d.innerHTML = t; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
  const list = a => a.slice(0, 4).map(p => `• <b>${p.name}</b> (${p.cat}), ${money(p.price)}`).join('<br>');
  const browse = c => { try { f.cats = new Set(c ? [c] : []); go('shop'); } catch (e) {} };

  const catWords = { boot: 'Boots', chelsea: 'Boots', sandal: 'Sandals & Slides', slide: 'Sandals & Slides', summer: 'Sandals & Slides', run: 'Sport / Runner', sport: 'Sport / Runner', gym: 'Sport / Runner', work: 'Heavy Duty', hik: 'Heavy Duty', leather: 'Leather', formal: 'Fancy', wedding: 'Fancy', party: 'Fancy', classic: 'Classic', daily: 'Everyday', casual: 'Everyday', walk: 'Everyday' };

  function reply(q) {
    q = q.toLowerCase();
    const num = (q.match(/\$?\s?(\d{2,3})/) || [])[1];
    if (/^(hi|hey|hello|yo|sup)\b/.test(q)) return 'Hey! 👋 I can help you find shoes, explain sizes, or share today\'s offers. What are you after?';
    if (/offer|deal|discount|coupon|promo|code|sale/.test(q)) return '🔥 Current codes:<br>• <b>COOKED20</b>: 20% off everything<br>• <b>BOOT15</b>: 15% off boots<br>• <b>SOLE10</b>: 10% off<br>• <b>FREESHIP</b>: free express delivery<br>Orders over $150 ship free automatically. Enter codes in your cart.';
    if (/ship|deliver|courier/.test(q)) return 'Shipping is $10, and <b>free over $150</b>. Orders ship within 1 to 2 business days.';
    if (/return|refund|swap|exchange|trial/.test(q)) return 'You get a <b>30-day risk-free trial</b> and free size swaps, so you can wear them at home first.';
    if (/size|fit|wide|width/.test(q)) return 'Sizes run EU 38 to 46, with 3 widths: Standard (D), Wide (EE) and Extra Wide (4E). Between sizes? Go up half a size. You can switch EU/US/UK on any product page.';
    if (/best|popular|top|recommend/.test(q)) return 'Our best sellers:<br>' + list(prods().filter(p => p.badge === 'Bestseller')) + '<br><br>Want me to open the shop?';
    if (/cheap|budget|under|below|less/.test(q) && num) { const r = prods().filter(p => p.price <= +num).sort((a, b) => b.rating - a.rating); return r.length ? `Top rated under ${money(num)}:<br>` + list(r) : `Nothing under ${money(num)} yet. Try a higher budget.`; }
    if (/cheap|budget/.test(q)) { const r = [...prods()].sort((a, b) => a.price - b.price); return 'Our lowest prices:<br>' + list(r); }
    for (const k in catWords) if (q.includes(k)) { const c = catWords[k], r = prods().filter(p => p.cat === c); setTimeout(() => browse(c), 900); return `Great choice! Top picks in <b>${c}</b>:<br>` + list(r) + '<br><br>Opening that collection for you…'; }
    if (/shop|all|catalog|browse/.test(q)) { setTimeout(() => browse(), 700); return 'Opening the full collection…'; }
    if (/contact|human|support|phone|email/.test(q)) return 'Our team replies at hello@soleworks.demo within 24 hours (demo store).';
    if (/thank/.test(q)) return 'Anytime! Happy shopping 👟';
    return 'I\'m a simple bot, so try: <i>boots</i>, <i>sandals</i>, <i>running shoes</i>, <i>offers</i>, <i>size help</i> or <i>shoes under $100</i>.';
  }

  function ask(t) {
    if (!t.trim()) return;
    say(t.replace(/[<>&]/g, ''), 1);
    const d = say('<span class="swc-dots"><span></span><span></span><span></span></span>');
    setTimeout(() => { d.innerHTML = reply(t); log.scrollTop = log.scrollHeight; }, 600);
  }
  $q('#swc-chips').innerHTML = CHIPS.map(c => `<button type="button">${c}</button>`).join('');
  $q('#swc-chips').onclick = e => e.target.tagName === 'BUTTON' && ask(e.target.textContent);
  $q('#swc-form').onsubmit = e => { e.preventDefault(); const i = $q('#swc-in'); ask(i.value); i.value = ''; };
  const toggle = () => { $q('#swc').classList.toggle('open'); if (!log.children.length) say('Hi, I\'m the Soleworks assistant 👟 Looking for boots, sneakers or something special? Pick a topic below or just ask.'); };
  $q('#swc-btn').onclick = toggle; $q('#swc-x').onclick = toggle;
})();
