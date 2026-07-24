/* share-viral.js — country/language-optimized OG viral share loop.
 *
 * Site-wide: loaded once from build-seo.cjs shell() foot, so EVERY current and
 * future generated page gets the share bar automatically (no per-page work).
 *
 * What it does:
 *  - Reads the page language (kp_lang → <html lang> → navigator) and picks the
 *    share platforms that actually dominate in that country, ordered best-first
 *    (Korea→KakaoTalk, Japan/Taiwan/Thailand→LINE, LatAm/SEA/India/Arab→WhatsApp,
 *    Russia→Telegram/VK, China→Weibo, everyone→X/Facebook).
 *  - Uses the page's OG data (canonical URL, localized <title>, og:image) so the
 *    shared card renders correctly on each platform.
 *  - Native share (navigator.share) first on mobile — surfaces KakaoTalk/LINE/etc.
 *  - Every outbound share URL carries UTM tags (source=platform, medium=social,
 *    campaign=viral_share) so the loop is measurable, and points at the CANONICAL
 *    URL (not the visitor's ?query) to consolidate signals.
 *  - Renders into the shared bottom `.kp-nextsteps` container (overload-safe:
 *    one section, no extra borders, un-hides the container if first).
 *
 * IIFE, fail-quiet, single-mount. Ads / existing kp-enhance share untouched.
 */
(function () {
  'use strict';
  try {
    if (typeof document === 'undefined') return;
    if (window.__kpShare) return; window.__kpShare = 1;

    // ── language / country ────────────────────────────────────────────
    var SUP = ['en','ko','ja','zh','es','fr','de','pt','id','ar','hi','ru','vi','th'];
    function norm(l){ l = (l||'').toLowerCase();
      if (l.indexOf('zh-hant')===0 || l==='zh-tw' || l==='zh-hk') return 'zh-hant';
      l = l.slice(0,2); return SUP.indexOf(l)>=0 ? l : 'en'; }
    var htmlLang = document.documentElement.getAttribute('lang') || '';
    var lang = norm(new URLSearchParams(location.search).get('lang')
      || localStorage.getItem('kp_lang') || htmlLang || navigator.language || 'en');

    // ── strings (heading only; platform names are brands) ─────────────
    var STR = {
      en:'Share', ko:'공유하기', ja:'シェア', zh:'分享', 'zh-hant':'分享',
      es:'Compartir', fr:'Partager', de:'Teilen', pt:'Compartilhar', id:'Bagikan',
      ar:'مشاركة', hi:'शेयर करें', ru:'Поделиться', vi:'Chia sẻ', th:'แชร์'
    };
    var COPIED = {
      en:'Link copied!', ko:'링크가 복사됐어요!', ja:'リンクをコピーしました', zh:'链接已复制', 'zh-hant':'連結已複製',
      es:'¡Enlace copiado!', fr:'Lien copié !', de:'Link kopiert!', pt:'Link copiado!', id:'Tautan disalin!',
      ar:'تم نسخ الرابط', hi:'लिंक कॉपी हो गया', ru:'Ссылка скопирована', vi:'Đã sao chép liên kết', th:'คัดลอกลิงก์แล้ว'
    };
    var NATIVE = {
      en:'Share…', ko:'공유', ja:'共有', zh:'分享', 'zh-hant':'分享', es:'Compartir', fr:'Partager',
      de:'Teilen', pt:'Compartilhar', id:'Bagikan', ar:'مشاركة', hi:'शेयर', ru:'Поделиться', vi:'Chia sẻ', th:'แชร์'
    };
    var COPYLBL = {
      en:'Copy link', ko:'링크 복사', ja:'リンクをコピー', zh:'复制链接', 'zh-hant':'複製連結',
      es:'Copiar enlace', fr:'Copier le lien', de:'Link kopieren', pt:'Copiar link', id:'Salin tautan',
      ar:'نسخ الرابط', hi:'लिंक कॉपी करें', ru:'Копировать ссылку', vi:'Sao chép liên kết', th:'คัดลอกลิงก์'
    };
    var t = function(m){ return m[lang] || m.en; };

    // ── platform order by country (dominant first) ────────────────────
    var ORDER = {
      ko:['kakao','x','facebook','line','copy'],
      ja:['line','x','facebook','copy'],
      zh:['weibo','x','facebook','copy'],
      'zh-hant':['line','facebook','x','whatsapp','copy'],
      es:['whatsapp','facebook','x','telegram','copy'],
      pt:['whatsapp','facebook','x','telegram','copy'],
      id:['whatsapp','facebook','line','x','copy'],
      vi:['facebook','whatsapp','x','telegram','copy'],
      th:['line','facebook','x','whatsapp','copy'],
      ru:['telegram','vk','whatsapp','x','copy'],
      hi:['whatsapp','facebook','telegram','x','copy'],
      ar:['whatsapp','facebook','x','telegram','copy'],
      fr:['x','facebook','whatsapp','reddit','copy'],
      de:['x','facebook','whatsapp','reddit','copy'],
      en:['x','facebook','whatsapp','reddit','pinterest','copy']
    };
    var order = ORDER[lang] || ORDER.en;

    // ── page share data (from OG / canonical) ─────────────────────────
    function meta(p){ var e=document.querySelector('meta[property="'+p+'"],meta[name="'+p+'"]'); return e?e.getAttribute('content'):''; }
    var canon = (document.querySelector('link[rel="canonical"]')||{}).href || (location.origin+location.pathname);
    var title = meta('og:title') || document.title || '';
    var img = meta('og:image') || '';
    var shareText = title + ' — KoreaPlus 🇰🇷';

    function withUtm(src){
      var sep = canon.indexOf('?')<0 ? '?' : '&';
      return canon + sep + 'utm_source=' + encodeURIComponent(src) + '&utm_medium=social&utm_campaign=viral_share';
    }
    // platform label + brand color + href builder
    var P = {
      x:        { n:'X',         c:'#000',    u:function(u){ return 'https://twitter.com/intent/tweet?text='+encodeURIComponent(shareText)+'&url='+encodeURIComponent(u); } },
      facebook: { n:'Facebook',  c:'#1877f2', u:function(u){ return 'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(u); } },
      whatsapp: { n:'WhatsApp',  c:'#25d366', u:function(u){ return 'https://api.whatsapp.com/send?text='+encodeURIComponent(shareText+' '+u); } },
      telegram: { n:'Telegram',  c:'#26a5e4', u:function(u){ return 'https://t.me/share/url?url='+encodeURIComponent(u)+'&text='+encodeURIComponent(shareText); } },
      line:     { n:'LINE',      c:'#06c755', u:function(u){ return 'https://social-plugins.line.me/lineit/share?url='+encodeURIComponent(u); } },
      kakao:    { n:'KakaoTalk', c:'#fee500', tc:'#111', u:function(u){ return 'https://story.kakao.com/share?url='+encodeURIComponent(u); } },
      weibo:    { n:'Weibo',     c:'#e6162d', u:function(u){ return 'https://service.weibo.com/share/share.php?url='+encodeURIComponent(u)+'&title='+encodeURIComponent(shareText); } },
      vk:       { n:'VK',        c:'#0077ff', u:function(u){ return 'https://vk.com/share.php?url='+encodeURIComponent(u)+'&title='+encodeURIComponent(title); } },
      reddit:   { n:'Reddit',    c:'#ff4500', u:function(u){ return 'https://www.reddit.com/submit?url='+encodeURIComponent(u)+'&title='+encodeURIComponent(title); } },
      pinterest:{ n:'Pinterest', c:'#e60023', u:function(u){ return 'https://pinterest.com/pin/create/button/?url='+encodeURIComponent(u)+'&description='+encodeURIComponent(shareText)+(img?'&media='+encodeURIComponent(img):''); } }
    };

    function toast(msg){
      var e=document.createElement('div'); e.textContent=msg;
      e.style.cssText='position:fixed;left:50%;bottom:calc(20px + var(--mnav-h,0px) + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#111;color:#fff;padding:10px 16px;border-radius:999px;font-size:13px;z-index:9999;box-shadow:0 6px 24px rgba(0,0,0,.3)';
      document.body.appendChild(e); setTimeout(function(){ e.remove(); }, 1800);
    }
    function copy(){
      var u=withUtm('copy');
      if (navigator.clipboard) navigator.clipboard.writeText(u).then(function(){ toast(t(COPIED)); }).catch(fallbackCopy);
      else fallbackCopy();
      function fallbackCopy(){ var ta=document.createElement('textarea'); ta.value=u; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');toast(t(COPIED));}catch(e){} ta.remove(); }
    }

    // ── build the bar ─────────────────────────────────────────────────
    var wrap = document.createElement('section');
    wrap.setAttribute('data-kp-share','1');
    var h='<p class="kp-ns-title" style="margin:0 0 10px">📣 '+t(STR)+'</p><div class="kp-share-row" style="display:flex;flex-wrap:wrap;gap:8px">';
    // native share first (mobile)
    if (navigator.share) h+='<button type="button" data-kp-native class="kp-share-btn" style="cursor:pointer;border:0;display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:13px;padding:9px 15px;border-radius:999px;color:#fff;background:linear-gradient(100deg,#c4125c,#7c22e0)">📲 '+t(NATIVE)+'</button>';
    order.forEach(function(k){
      if (k==='copy'){ h+='<button type="button" data-kp-copy class="kp-share-btn" style="cursor:pointer;border:1px solid var(--border,#4443);display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:13px;padding:9px 15px;border-radius:999px;color:var(--text,#333);background:var(--card,#0000000a)">🔗 '+t(COPYLBL)+'</button>'; return; }
      var p=P[k]; if(!p) return;
      h+='<a href="'+p.u(withUtm(k))+'" target="_blank" rel="noopener nofollow" class="kp-share-btn" data-kp-plat="'+k+'" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:13px;padding:9px 15px;border-radius:999px;color:'+(p.tc||'#fff')+';background:'+p.c+'">'+p.n+'</a>';
    });
    h+='</div>';
    wrap.innerHTML=h;

    // native + copy handlers
    var nb=wrap.querySelector('[data-kp-native]');
    if(nb) nb.addEventListener('click',function(){ navigator.share({title:title,url:withUtm('native')}).catch(function(){}); });
    var cb=wrap.querySelector('[data-kp-copy]');
    if(cb) cb.addEventListener('click',copy);

    // ── mount into the shared bottom container (overload-safe) ─────────
    function mount(){
      var host=document.querySelector('.kp-nextsteps');
      if(!host){ // no bottom container (e.g. hub) → append before footer
        host=document.querySelector('footer')||document.body;
        host.parentNode ? host.parentNode.insertBefore(wrap,host) : host.appendChild(wrap);
        return;
      }
      if(host.querySelector('[data-kp-share]')) return; // dup guard
      host.appendChild(wrap);
      if(host.hasAttribute('hidden')) host.removeAttribute('hidden');
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
  } catch (e) { /* fail-quiet */ }
})();
