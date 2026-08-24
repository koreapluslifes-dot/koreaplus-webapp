/* modules/kpop-plus.js — 10 cross-domain best-in-class features for the K-pop hub.
   Self-contained IIFEs reading window.KPOP_ROSTER / KPOP_ENRICH and shared localStorage.
   Loaded after modules/kpop.js. */

/* ===== pulse: Live Social-Proof Pulse — a slim dismissible gradient banner under the hero that rotates live computed stats (debut anniversaries within 7 d ===== */
(function(){
  "use strict";
  try{
    var MOUNT="#kpop-pulse-slot";
    var mount=document.querySelector(MOUNT);
    if(!mount) return;
    if(mount.getAttribute("data-kpp-pulse")==="1") return;
    mount.setAttribute("data-kpp-pulse","1");

    var SUPPORTED=["en","ko","ja","zh","es","fr","de","pt","id"];
    var L=(localStorage.getItem("kp_lang")||(navigator.language||"en").slice(0,2)||"en").toLowerCase();
    if(SUPPORTED.indexOf(L)<0) L="en";

    var FOLLOW_KEY="kp_kpop_follow";
    var DISMISS_KEY="kpp_pulse_dismissed";

    var I18N={
      en:{welcome:"Welcome — explore your K-pop hub",anniv:function(n){return n+(n===1?" debut anniversary this week":" debut anniversaries this week");},bdays:function(n){return n+(n===1?" idol birthday soon":" idol birthdays soon");},follows:function(n){return "You stan "+n+(n===1?" act — see updates":" acts — see updates");},explore:"Fans are exploring artists right now",live:"Live",dismiss:"Dismiss"},
      ko:{welcome:"환영합니다 — 케이팝 허브를 둘러보세요",anniv:function(n){return "이번 주 데뷔 기념일 "+n+"건";},bdays:function(n){return "곧 아이돌 생일 "+n+"건";},follows:function(n){return n+"팀 덕질 중 — 소식 보기";},explore:"지금 팬들이 아티스트를 둘러보는 중",live:"실시간",dismiss:"닫기"},
      ja:{welcome:"ようこそ — K-POPハブを探索",anniv:function(n){return "今週のデビュー記念日 "+n+"件";},bdays:function(n){return "もうすぐ誕生日のアイドル "+n+"件";},follows:function(n){return n+"組を応援中 — 最新情報を見る";},explore:"今ファンがアーティストを閲覧中",live:"ライブ",dismiss:"閉じる"},
      zh:{welcome:"欢迎 — 探索你的K-pop中心",anniv:function(n){return "本周出道纪念日 "+n+"个";},bdays:function(n){return "即将到来的爱豆生日 "+n+"个";},follows:function(n){return "你在追"+n+"组 — 查看动态";},explore:"粉丝们正在浏览艺人",live:"实时",dismiss:"关闭"},
      es:{welcome:"Bienvenido — explora tu hub de K-pop",anniv:function(n){return n+(n===1?" aniversario de debut esta semana":" aniversarios de debut esta semana");},bdays:function(n){return n+(n===1?" cumpleaños de idol pronto":" cumpleaños de idols pronto");},follows:function(n){return "Sigues a "+n+(n===1?" acto — ve novedades":" actos — ve novedades");},explore:"Los fans están explorando artistas ahora",live:"En vivo",dismiss:"Cerrar"},
      fr:{welcome:"Bienvenue — explorez votre hub K-pop",anniv:function(n){return n+(n===1?" anniversaire de début cette semaine":" anniversaires de début cette semaine");},bdays:function(n){return n+(n===1?" anniversaire d'idole bientôt":" anniversaires d'idoles bientôt");},follows:function(n){return "Vous suivez "+n+(n===1?" groupe — voir l'actu":" groupes — voir l'actu");},explore:"Les fans explorent des artistes en ce moment",live:"En direct",dismiss:"Fermer"},
      de:{welcome:"Willkommen — entdecke deinen K-Pop-Hub",anniv:function(n){return n+(n===1?" Debüt-Jubiläum diese Woche":" Debüt-Jubiläen diese Woche");},bdays:function(n){return n+(n===1?" Idol-Geburtstag steht bevor":" Idol-Geburtstage stehen bevor");},follows:function(n){return "Du folgst "+n+(n===1?" Act — Updates ansehen":" Acts — Updates ansehen");},explore:"Fans entdecken gerade Künstler",live:"Live",dismiss:"Schließen"},
      pt:{welcome:"Bem-vindo — explore seu hub de K-pop",anniv:function(n){return n+(n===1?" aniversário de estreia esta semana":" aniversários de estreia esta semana");},bdays:function(n){return n+(n===1?" aniversário de ídolo chegando":" aniversários de ídolos chegando");},follows:function(n){return "Você segue "+n+(n===1?" grupo — veja novidades":" grupos — veja novidades");},explore:"Fãs estão explorando artistas agora",live:"Ao vivo",dismiss:"Fechar"},
      id:{welcome:"Selamat datang — jelajahi hub K-pop kamu",anniv:function(n){return n+" anniversary debut minggu ini — cek sekarang";},bdays:function(n){return n+" ulang tahun idol segera";},follows:function(n){return "Kamu stan "+n+" grup — lihat update";},explore:"Fans sedang menjelajahi artis sekarang",live:"Langsung",dismiss:"Tutup"}
    };
    var T=I18N[L]||I18N.en;
    function t(k){return (T&&T[k]!=null)?T[k]:(I18N.en[k]);}

    var pf=function(id){var x=SUPPORTED.indexOf(L)>=0?L:"en"; return (x==="en"?"":x+"/")+"kpop/"+id+"-profile";};

    function readFollows(){
      try{var a=JSON.parse(localStorage.getItem(FOLLOW_KEY)||"[]"); return Array.isArray(a)?a:[];}catch(e){return [];}
    }
    function isDismissed(){
      try{return sessionStorage.getItem(DISMISS_KEY)==="1";}catch(e){return false;}
    }
    function setDismissed(){
      try{sessionStorage.setItem(DISMISS_KEY,"1");}catch(e){}
    }

    // ---- inject CSS once ----
    var CSS_ID="kpp-pulse-css";
    if(!document.getElementById(CSS_ID)){
      var st=document.createElement("style");
      st.id=CSS_ID;
      st.textContent=[
        "#kpp-pulse{display:flex;align-items:center;gap:10px;background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:14px;padding:9px 12px;margin-bottom:16px;position:relative;overflow:hidden;min-height:40px;box-sizing:border-box}",
        "#kpp-pulse:before{content:'';position:absolute;inset:0;background:var(--kp-grad,linear-gradient(90deg,#ff2e74,#7c5cff));opacity:.10;pointer-events:none}",
        "#kpp-pulse .kpp-dot{flex:0 0 auto;width:9px;height:9px;border-radius:50%;background:var(--accent,#ff2e74);position:relative;z-index:1;box-shadow:0 0 0 0 var(--accent,#ff2e74);animation:kppPulse 1.8s ease-out infinite}",
        "@keyframes kppPulse{0%{box-shadow:0 0 0 0 rgba(255,46,116,.55)}70%{box-shadow:0 0 0 7px rgba(255,46,116,0)}100%{box-shadow:0 0 0 0 rgba(255,46,116,0)}}",
        "#kpp-pulse .kpp-live{flex:0 0 auto;z-index:1;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--accent,#ff2e74)}",
        "#kpp-pulse .kpp-msgwrap{flex:1 1 auto;min-width:0;z-index:1;overflow:hidden}",
        "#kpp-pulse .kpp-msg{display:block;font-size:13px;font-weight:700;color:var(--text,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:none;transition:opacity .35s ease}",
        "#kpp-pulse a.kpp-msg:hover{text-decoration:underline}",
        "#kpp-pulse .kpp-msg.kpp-fade{opacity:0}",
        "#kpp-pulse .kpp-x{flex:0 0 auto;z-index:1;background:transparent;border:0;color:var(--text3,#8a93a0);font-size:18px;line-height:1;cursor:pointer;padding:2px 4px;border-radius:8px;width:26px;height:26px;display:flex;align-items:center;justify-content:center}",
        "#kpp-pulse .kpp-x:hover{color:var(--text,#fff);background:var(--border,rgba(255,255,255,.12))}",
        "#kpp-pulse .kpp-x:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px}",
        "@media (hover:none){#kpp-pulse .kpp-x{position:relative}#kpp-pulse .kpp-x::after{content:'';position:absolute;inset:-9px;border-radius:12px}}",
        "@media (max-width:380px){#kpp-pulse .kpp-live{display:none}#kpp-pulse .kpp-msg{font-size:12px}}",
        "@media (prefers-reduced-motion:reduce){#kpp-pulse .kpp-dot{animation:none}#kpp-pulse .kpp-msg{transition:none}}"
      ].join("");
      (document.head||document.documentElement).appendChild(st);
    }

    function pad2(n){return (n<10?"0":"")+n;}
    function mmdd(s){
      if(!s||typeof s!=="string") return null;
      var p=s.split("-"); if(p.length<3) return null;
      var mo=parseInt(p[1],10), da=parseInt(p[2],10);
      if(!(mo>=1&&mo<=12)||!(da>=1&&da<=31)) return null;
      return pad2(mo)+"-"+pad2(da);
    }
    // days from today (local) until next occurrence of given MM-DD
    function daysUntil(mmddStr){
      if(!mmddStr) return null;
      var now=new Date();
      var todayMid=new Date(now.getFullYear(),now.getMonth(),now.getDate());
      var parts=mmddStr.split("-");
      var mo=parseInt(parts[0],10)-1, da=parseInt(parts[1],10);
      var y=todayMid.getFullYear();
      var target=new Date(y,mo,da);
      if(isNaN(target.getTime())) return null;
      if(target<todayMid){ target=new Date(y+1,mo,da); }
      var diff=Math.round((target-todayMid)/86400000);
      if(diff<0) return null;
      return diff;
    }

    function computeStats(){
      var ROSTER=Array.isArray(window.KPOP_ROSTER)?window.KPOP_ROSTER:[];
      var ENRICH=(window.KPOP_ENRICH&&typeof window.KPOP_ENRICH==="object")?window.KPOP_ENRICH:{};
      var follows=readFollows();

      var annivCount=0, annivIds=[];
      for(var i=0;i<ROSTER.length;i++){
        var a=ROSTER[i]; if(!a||!a.id) continue;
        var md=mmdd(a.debut);
        var du=daysUntil(md);
        if(du!=null&&du<=7){ annivCount++; annivIds.push(a.id); }
      }

      var bdayCount=0, bdayIds=[];
      for(var id in ENRICH){
        if(!Object.prototype.hasOwnProperty.call(ENRICH,id)) continue;
        var e=ENRICH[id]; if(!e||!Array.isArray(e.bdays)) continue;
        for(var j=0;j<e.bdays.length;j++){
          var row=e.bdays[j];
          if(!Array.isArray(row)||row.length<2) continue;
          var bmd=mmdd(row[1]);
          var bdu=daysUntil(bmd);
          if(bdu!=null&&bdu<=30){ bdayCount++; if(bdayIds.indexOf(id)<0) bdayIds.push(id); }
        }
      }

      return {anniv:annivCount,annivIds:annivIds,bdays:bdayCount,bdayIds:bdayIds,follows:follows.length};
    }

    function go(id){
      if(!id) return;
      try{
        if(typeof window.kpOpenArtist==="function"){ window.kpOpenArtist(id); return; }
      }catch(e){}
      try{ window.location.href=pf(id); }catch(e){}
    }

    var banner=null, msgEl=null, msgs=[], idx=0, timer=null;

    function buildMessages(s){
      var out=[];
      if(s.anniv>0){ out.push({text:t("anniv")(s.anniv),id:(s.annivIds[0]||null)}); }
      if(s.bdays>0){ out.push({text:t("bdays")(s.bdays),id:(s.bdayIds[0]||null)}); }
      if(s.follows>0){ out.push({text:t("follows")(s.follows),id:null}); }
      if(out.length===0){
        var ROSTER=Array.isArray(window.KPOP_ROSTER)?window.KPOP_ROSTER:[];
        if(ROSTER.length>0){
          var rnd=ROSTER[Math.floor(Math.random()*ROSTER.length)];
          out.push({text:t("explore"),id:(rnd&&rnd.id)||null});
        }else{
          out.push({text:t("welcome"),id:null});
        }
      }
      // cap at 4
      return out.slice(0,4);
    }

    function applyMsg(){
      if(!msgEl||!msgs.length) return;
      var m=msgs[idx%msgs.length];
      // build link or span depending on id
      var newEl;
      if(m.id){
        newEl=document.createElement("a");
        newEl.className="kpp-msg";
        newEl.href=pf(m.id);
        newEl.addEventListener("click",function(ev){ ev.preventDefault(); go(m.id); });
      }else{
        newEl=document.createElement("span");
        newEl.className="kpp-msg";
      }
      newEl.textContent=m.text;
      var wrap=msgEl.parentNode;
      if(wrap){ wrap.replaceChild(newEl,msgEl); msgEl=newEl; }
    }

    function rotate(){
      if(!msgEl||msgs.length<=1) return;
      msgEl.classList.add("kpp-fade");
      var reduce=false;
      try{ reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce)").matches; }catch(e){}
      var delay=reduce?0:340;
      setTimeout(function(){
        idx=(idx+1)%msgs.length;
        applyMsg();
        if(msgEl) msgEl.classList.remove("kpp-fade");
      },delay);
    }

    function stopTimer(){ if(timer){ clearInterval(timer); timer=null; } }

    function render(){
      if(isDismissed()){ stopTimer(); if(banner){ banner.parentNode&&banner.parentNode.removeChild(banner); banner=null; } return; }
      var s=computeStats();
      msgs=buildMessages(s);
      idx=0;

      if(!banner){
        banner=document.createElement("div");
        banner.id="kpp-pulse";
        banner.setAttribute("role","status");
        banner.setAttribute("aria-live","polite");

        var dot=document.createElement("span");
        dot.className="kpp-dot"; dot.setAttribute("aria-hidden","true");

        var live=document.createElement("span");
        live.className="kpp-live"; live.textContent=t("live");

        var wrap=document.createElement("div");
        wrap.className="kpp-msgwrap";
        msgEl=document.createElement("span");
        msgEl.className="kpp-msg";
        wrap.appendChild(msgEl);

        var x=document.createElement("button");
        x.type="button"; x.className="kpp-x";
        x.setAttribute("aria-label",t("dismiss")); x.title=t("dismiss");
        x.textContent="×";
        x.addEventListener("click",function(){
          setDismissed(); stopTimer();
          if(banner){ banner.parentNode&&banner.parentNode.removeChild(banner); banner=null; }
        });

        banner.appendChild(dot);
        banner.appendChild(live);
        banner.appendChild(wrap);
        banner.appendChild(x);
        mount.appendChild(banner);
      }else{
        // re-attach msgEl reference (may have been replaced)
        var existing=banner.querySelector(".kpp-msg");
        if(existing) msgEl=existing;
      }

      applyMsg();
      stopTimer();
      if(msgs.length>1){ timer=setInterval(rotate,4000); }
    }

    render();

    window.addEventListener("kp:follows",function(){ render(); });
    window.addEventListener("kp:view",function(){ /* keep banner live; recompute lazily */ render(); });

  }catch(err){ /* never throw */ }
})();

/* ===== search: Command-K instant artist search (adapts Linear/Notion/Algolia): a ⌘K/"/" launcher in #kpop-filters opens a focus-trapped centered modal with ===== */
(function(){"use strict";
var MOUNT="#kpop-search-slot";
var mount=document.querySelector(MOUNT);
if(!mount) return;
if(mount.getAttribute("data-kpp-search")) return;
mount.setAttribute("data-kpp-search","1");

var L=(localStorage.getItem("kp_lang")||(navigator.language||"en").slice(0,2)||"en").toLowerCase();
var SUP=["en","ko","ja","zh","es","fr","de","pt","id"];
if(SUP.indexOf(L)<0) L="en";

var I18N={
  en:{launch:"Search artists",ph:"Search by name, agency, fandom, member…",empty:"Start typing to find artists",none:"No matches found",recent:"Recent",open:"Open",members:"Members",agency:"Agency",fandom:"Fandom",closeL:"Close search",searchL:"Search artists",resultsL:"Search results",clearL:"Clear recent searches",siteSearch:"Search the whole site",compare:"Comparison",memberProfile:"Member profile"},
  ko:{launch:"아티스트 검색",ph:"이름·소속사·팬덤·멤버로 검색…",empty:"검색어를 입력해 아티스트를 찾아보세요",none:"검색 결과가 없습니다",recent:"최근 검색",open:"열기",members:"멤버",agency:"소속사",fandom:"팬덤",closeL:"검색 닫기",searchL:"아티스트 검색",resultsL:"검색 결과",clearL:"최근 검색 지우기",siteSearch:"사이트 전체 검색",compare:"그룹 비교",memberProfile:"멤버 프로필"},
  ja:{launch:"アーティスト検索",ph:"名前・事務所・ファンダム・メンバーで検索…",empty:"入力してアーティストを探しましょう",none:"一致する結果がありません",recent:"最近の検索",open:"開く",members:"メンバー",agency:"事務所",fandom:"ファンダム",closeL:"検索を閉じる",searchL:"アーティスト検索",resultsL:"検索結果",clearL:"最近の検索を消去",siteSearch:"サイト全体を検索"},
  zh:{launch:"搜索艺人",ph:"按名称、经纪公司、粉丝名、成员搜索…",empty:"开始输入以查找艺人",none:"未找到匹配结果",recent:"最近搜索",open:"打开",members:"成员",agency:"经纪公司",fandom:"粉丝名",closeL:"关闭搜索",searchL:"搜索艺人",resultsL:"搜索结果",clearL:"清除最近搜索",siteSearch:"搜索整个网站"},
  es:{launch:"Buscar artistas",ph:"Busca por nombre, agencia, fandom, miembro…",empty:"Escribe para encontrar artistas",none:"No se encontraron coincidencias",recent:"Recientes",open:"Abrir",members:"Miembros",agency:"Agencia",fandom:"Fandom",closeL:"Cerrar búsqueda",searchL:"Buscar artistas",resultsL:"Resultados de búsqueda",clearL:"Borrar búsquedas recientes",siteSearch:"Buscar en todo el sitio"},
  fr:{launch:"Rechercher des artistes",ph:"Cherchez par nom, agence, fandom, membre…",empty:"Commencez à taper pour trouver des artistes",none:"Aucun résultat trouvé",recent:"Récents",open:"Ouvrir",members:"Membres",agency:"Agence",fandom:"Fandom",closeL:"Fermer la recherche",searchL:"Rechercher des artistes",resultsL:"Résultats de recherche",clearL:"Effacer les recherches récentes",siteSearch:"Rechercher sur tout le site"},
  de:{launch:"Künstler suchen",ph:"Nach Name, Agentur, Fandom, Mitglied suchen…",empty:"Tippe, um Künstler zu finden",none:"Keine Treffer gefunden",recent:"Zuletzt",open:"Öffnen",members:"Mitglieder",agency:"Agentur",fandom:"Fandom",closeL:"Suche schließen",searchL:"Künstler suchen",resultsL:"Suchergebnisse",clearL:"Letzte Suchen löschen",siteSearch:"Gesamte Website durchsuchen"},
  pt:{launch:"Buscar artistas",ph:"Busque por nome, agência, fandom, membro…",empty:"Comece a digitar para encontrar artistas",none:"Nenhum resultado encontrado",recent:"Recentes",open:"Abrir",members:"Membros",agency:"Agência",fandom:"Fandom",closeL:"Fechar busca",searchL:"Buscar artistas",resultsL:"Resultados da busca",clearL:"Limpar buscas recentes",siteSearch:"Buscar em todo o site"},
  id:{launch:"Cari artis",ph:"Cari berdasarkan nama, agensi, fandom, member…",empty:"Mulai ketik untuk menemukan artis",none:"Tidak ada hasil",recent:"Terbaru",open:"Buka",members:"Member",agency:"Agensi",fandom:"Fandom",closeL:"Tutup pencarian",searchL:"Cari artis",resultsL:"Hasil pencarian",clearL:"Hapus pencarian terbaru",siteSearch:"Cari di seluruh situs"}
};
var T=I18N[L]||I18N.en;
function t(k){return (T&&T[k])||I18N.en[k]||k;}

var pf=function(id){var x=SUP.indexOf(L)>=0?L:"en";return (x==="en"?"":x+"/")+"kpop/"+id+"-profile";};
function slugPart(x){return String(x||"").toLowerCase().replace(/['']/g,"").replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
function memPf(name,actId){var x=SUP.indexOf(L)>=0?L:"en";return (x==="en"?"":x+"/")+"kpop/"+slugPart(name)+"-"+slugPart(actId)+"-member";}
function vsPf(a,b){var x=SUP.indexOf(L)>=0?L:"en";return (x==="en"?"":x+"/")+"kpop-vs/"+a+"-vs-"+b;}
var VS_PAIRS=[["bts","seventeen"],["blackpink","twice"],["newjeans","lesserafim"],["aespa","ive"],["straykids","ateez"],["exo","bts"],["itzy","aespa"],["txt","enhypen"]];

function roster(){return (window.KPOP_ROSTER&&Object.prototype.toString.call(window.KPOP_ROSTER)==="[object Array]")?window.KPOP_ROSTER:[];}

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];});}

function readRecent(){try{var r=JSON.parse(localStorage.getItem("kpp_search")||"[]");return (Object.prototype.toString.call(r)==="[object Array]")?r.slice(0,6):[];}catch(e){return [];}}
function pushRecent(q){q=(q||"").trim();if(!q)return;try{var r=readRecent().filter(function(x){return (x||"").toLowerCase()!==q.toLowerCase();});r.unshift(q);localStorage.setItem("kpp_search",JSON.stringify(r.slice(0,6)));}catch(e){}}
function clearRecent(){try{localStorage.removeItem("kpp_search");}catch(e){}}

// CSS once
var CSSID="kpp-search-css";
if(!document.getElementById(CSSID)){
  var st=document.createElement("style");st.id=CSSID;
  st.textContent=
  "#kpp-search-launch{display:inline-flex;align-items:center;gap:8px;background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.12));color:var(--text2,#aab);border-radius:12px;padding:9px 12px;font:600 13px/1 inherit;cursor:pointer;transition:border-color .15s,color .15s;max-width:100%}"+
  "#kpp-search-launch:hover{border-color:var(--accent,#ff2e74);color:var(--text,#fff)}"+
  "#kpp-search-launch svg{flex:0 0 auto}"+
  "#kpp-search-launch .kpp-s-txt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
  "#kpp-search-launch kbd{margin-left:auto;display:inline-flex;align-items:center;gap:2px;background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:6px;padding:2px 6px;font:700 11px/1 inherit;color:var(--text3,#8a93a0)}"+
  "@media(max-width:420px){#kpp-search-launch kbd{display:none}}"+
  ".kpp-s-ov{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-start;justify-content:center;padding:10vh 16px 16px;background:rgba(4,4,10,.66);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}"+
  ".kpp-s-modal{width:100%;max-width:560px;background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.55);overflow:hidden;display:flex;flex-direction:column;max-height:78vh}"+
  ".kpp-s-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border,rgba(255,255,255,.12))}"+
  ".kpp-s-head svg{flex:0 0 auto;color:var(--text3,#8a93a0)}"+
  ".kpp-s-input{flex:1;min-width:0;background:transparent;border:0;outline:none;color:var(--text,#fff);font:500 16px/1.3 inherit}"+
  ".kpp-s-input::placeholder{color:var(--text3,#8a93a0)}"+
  ".kpp-s-esc{flex:0 0 auto;background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));color:var(--text2,#aab);border-radius:8px;padding:5px 9px;font:700 11px/1 inherit;cursor:pointer}"+
  ".kpp-s-esc:hover{color:var(--text,#fff)}"+
  ".kpp-s-list{list-style:none;margin:0;padding:6px;overflow-y:auto;-webkit-overflow-scrolling:touch}"+
  ".kpp-s-state{padding:30px 18px;text-align:center;color:var(--text3,#8a93a0);font:500 14px/1.5 inherit}"+
  ".kpp-s-rechead{display:flex;align-items:center;justify-content:space-between;padding:8px 12px 4px;color:var(--text3,#8a93a0);font:900 11px/1 inherit;letter-spacing:.06em;text-transform:uppercase}"+
  ".kpp-s-recclr{background:none;border:0;color:var(--text3,#8a93a0);font:700 11px/1 inherit;cursor:pointer;padding:2px 4px}"+
  ".kpp-s-recclr:hover{color:var(--accent,#ff2e74)}"+
  ".kpp-s-rec{display:flex;flex-wrap:wrap;gap:6px;padding:2px 10px 8px}"+
  ".kpp-s-chip{background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));color:var(--text2,#aab);border-radius:999px;padding:5px 11px;font:600 12px/1 inherit;cursor:pointer}"+
  ".kpp-s-chip:hover{border-color:var(--accent,#ff2e74);color:var(--text,#fff)}"+
  ".kpp-s-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:11px;cursor:pointer;border:1px solid transparent}"+
  ".kpp-s-item[aria-selected=true]{background:var(--bg,#0c0c14);border-color:var(--accent,#ff2e74)}"+
  ".kpp-s-emo{flex:0 0 auto;width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12))}"+
  ".kpp-s-meta{flex:1;min-width:0}"+
  ".kpp-s-nm{color:var(--text,#fff);font:800 14px/1.25 inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
  ".kpp-s-nm small{color:var(--text3,#8a93a0);font-weight:600;margin-left:6px}"+
  ".kpp-s-why{color:var(--text2,#aab);font:500 12px/1.3 inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}"+
  ".kpp-s-why mark{background:transparent;color:var(--accent,#ff2e74);font-weight:800;padding:0}"+
  ".kpp-s-go{flex:0 0 auto;color:var(--text3,#8a93a0)}"+
  ".kpp-s-item[aria-selected=true] .kpp-s-go{color:var(--accent,#ff2e74)}"+
  ".kpp-s-site{display:block;width:100%;flex:0 0 auto;background:transparent;border:0;border-top:1px solid var(--border,rgba(255,255,255,.12));color:var(--text3,#8a93a0);font:600 12px/1.2 inherit;padding:12px 16px;cursor:pointer;text-align:center}"+
  ".kpp-s-site:hover{color:var(--text,#fff)}"+
  ".kpp-s-site:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:-2px}"+
  "@media(hover:none){.kpp-s-site{min-height:44px}}"+
  "@media(prefers-reduced-motion:no-preference){#kpp-search-launch,.kpp-s-chip,.kpp-s-item{transition:border-color .15s,background .12s,color .15s}.kpp-s-ov{animation:kpp-s-fade .14s ease}@keyframes kpp-s-fade{from{opacity:0}to{opacity:1}}}";
  document.head.appendChild(st);
}

// Launcher button
var btn=document.createElement("button");
btn.type="button";btn.id="kpp-search-launch";btn.setAttribute("aria-label",t("searchL"));btn.setAttribute("aria-haspopup","dialog");
var isMac=/Mac|iPod|iPhone|iPad/.test((navigator.platform||"")+(navigator.userAgent||""));
btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg><span class="kpp-s-txt">'+esc(t("launch"))+'</span><kbd>'+(isMac?"⌘":"Ctrl")+' K</kbd>';
btn.addEventListener("click",function(){open();});
mount.appendChild(btn);

// Modal state
var ov=null,inp=null,list=null,sel=-1,curResults=[],lastFocus=null;

function buildIndex(){
  return roster().map(function(a){
    var members=(a&&a.members&&Object.prototype.toString.call(a.members)==="[object Array]")?a.members:[];
    return {kind:"artist",a:a,
      nameEn:(a&&a.nameEn)||"",nameKo:(a&&a.nameKo)||"",
      agency:(a&&a.agency)||"",fandom:(a&&a.fandom)||"",
      members:members,
      hay:[(a&&a.nameEn)||"",(a&&a.nameKo)||"",(a&&a.agency)||"",(a&&a.fandom)||"",members.join(" ")].join(" ").toLowerCase()};
  });
}
function buildExtraIndex(){
  var out=[],byId={},acts=roster();
  for(var i=0;i<acts.length;i++){if(acts[i]&&acts[i].id)byId[acts[i].id]=acts[i];}
  var ENRICH=(window.KPOP_ENRICH&&typeof window.KPOP_ENRICH==="object")?window.KPOP_ENRICH:{};
  for(var aid in ENRICH){
    if(!Object.prototype.hasOwnProperty.call(ENRICH,aid))continue;
    var act=byId[aid],e=ENRICH[aid];
    if(!act||!e||!Array.isArray(e.bdays))continue;
    for(var j=0;j<e.bdays.length;j++){
      var row=e.bdays[j];
      if(!Array.isArray(row)||!row[0])continue;
      var nm=String(row[0]);
      out.push({kind:"member",mem:{name:nm,actId:aid,actName:act.nameEn||aid,emoji:act.emoji||"🎤"},
        hay:(nm+" "+(act.nameEn||"")+" "+(act.nameKo||"")).toLowerCase()});
    }
  }
  for(var p=0;p<VS_PAIRS.length;p++){
    var ra=byId[VS_PAIRS[p][0]],rb=byId[VS_PAIRS[p][1]];
    if(!ra||!rb)continue;
    var label=(ra.nameEn||VS_PAIRS[p][0])+" vs "+(rb.nameEn||VS_PAIRS[p][1]);
    out.push({kind:"vs",vs:{aId:VS_PAIRS[p][0],bId:VS_PAIRS[p][1],label:label,emoji:"⚖️"},
      hay:label.toLowerCase()+" "+(ra.nameKo||"")+" "+(rb.nameKo||"")});
  }
  return out;
}

function fuzzy(q,s){ // subsequence match
  q=q.toLowerCase();s=s.toLowerCase();var qi=0;
  for(var i=0;i<s.length&&qi<q.length;i++){if(s[i]===q[qi])qi++;}
  return qi===q.length;
}

function search(q){
  q=(q||"").trim();
  if(!q) return [];
  var ql=q.toLowerCase(),out=[];
  function scoreEntry(e){
    var score=-1,why="";
    if(e.kind==="artist"){
      if((e.nameEn||e.nameKo)&&(e.nameEn.toLowerCase().indexOf(ql)===0||e.nameKo.toLowerCase().indexOf(ql)===0))score=100;
      else if(e.nameEn.toLowerCase().indexOf(ql)>=0||e.nameKo.toLowerCase().indexOf(ql)>=0)score=80;
      else {
        var mm=null;
        for(var j=0;j<e.members.length;j++){if(String(e.members[j]).toLowerCase().indexOf(ql)>=0){mm=e.members[j];break;}}
        if(mm){score=60;why=t("members")+": "+mm;}
        else if(e.agency&&e.agency.toLowerCase().indexOf(ql)>=0){score=50;why=t("agency")+": "+e.agency;}
        else if(e.fandom&&e.fandom.toLowerCase().indexOf(ql)>=0){score=45;why=t("fandom")+": "+e.fandom;}
        else if(e.hay.indexOf(ql)>=0)score=30;
        else if(ql.length>=2&&fuzzy(ql,e.hay))score=10;
      }
    } else if(e.kind==="member"){
      if(e.mem.name.toLowerCase().indexOf(ql)===0)score=92;
      else if(e.mem.name.toLowerCase().indexOf(ql)>=0)score=75;
      else if(e.hay.indexOf(ql)>=0)score=55;
      if(score>=0)why=t("memberProfile")+" · "+e.mem.actName;
    } else if(e.kind==="vs"){
      if(e.vs.label.toLowerCase().indexOf(ql)>=0)score=70;
      else if(e.hay.indexOf(ql)>=0)score=40;
      if(score>=0)why=t("compare");
    }
    if(score>=0)out.push({e:e,score:score,why:why,q:ql,kind:e.kind});
  }
  buildIndex().forEach(scoreEntry);
  buildExtraIndex().forEach(scoreEntry);
  out.sort(function(a,b){return b.score-a.score||(a.e.nameEn||a.e.mem&&a.e.mem.name||a.e.vs&&a.e.vs.label||"").localeCompare(b.e.nameEn||b.e.mem&&b.e.mem.name||b.e.vs&&b.e.vs.label||"");});
  return out.slice(0,10);
}

function hi(text,ql){
  text=String(text||"");
  if(!ql)return esc(text);
  var i=text.toLowerCase().indexOf(ql);
  if(i<0)return esc(text);
  return esc(text.slice(0,i))+"<mark>"+esc(text.slice(i,i+ql.length))+"</mark>"+esc(text.slice(i+ql.length));
}

function render(q){
  curResults=[];sel=-1;
  list.innerHTML="";
  q=(q||"").trim();
  if(!q){
    var rec=readRecent();
    if(rec.length){
      var rh=document.createElement("div");rh.className="kpp-s-rechead";
      rh.innerHTML='<span>'+esc(t("recent"))+'</span>';
      var clr=document.createElement("button");clr.type="button";clr.className="kpp-s-recclr";clr.textContent="×";clr.setAttribute("aria-label",t("clearL"));
      clr.addEventListener("click",function(){clearRecent();render("");inp.focus();});
      rh.appendChild(clr);list.appendChild(rh);
      var wrap=document.createElement("div");wrap.className="kpp-s-rec";
      rec.forEach(function(r){
        var c=document.createElement("button");c.type="button";c.className="kpp-s-chip";c.textContent=r;
        c.addEventListener("click",function(){inp.value=r;render(r);inp.focus();});
        wrap.appendChild(c);
      });
      list.appendChild(wrap);
    } else {
      var em=document.createElement("div");em.className="kpp-s-state";em.textContent=t("empty");list.appendChild(em);
    }
    return;
  }
  var res=search(q);
  if(!res.length){
    var nm=document.createElement("div");nm.className="kpp-s-state";nm.textContent=t("none");list.appendChild(nm);
    return;
  }
  curResults=res;
  res.forEach(function(r,k){
    var li=document.createElement("li");
    li.className="kpp-s-item";li.setAttribute("role","option");li.setAttribute("aria-selected","false");li.setAttribute("data-i",k);
    var emo="🎵",nm2="",ko="",why=r.why?'<div class="kpp-s-why">'+esc(r.why)+'</div>':"";
    if(r.kind==="member"){
      emo=r.e.mem.emoji||"👤";nm2=r.e.mem.name;
      ko=r.e.mem.actName?'<small>'+esc(r.e.mem.actName)+'</small>':"";
    } else if(r.kind==="vs"){
      emo=r.e.vs.emoji||"⚖️";nm2=r.e.vs.label;
    } else {
      var a=r.e.a,id=a&&a.id;
      emo=(a&&a.emoji)||"🎵";
      nm2=(r.e.nameEn||r.e.nameKo||"")||(id||"");
      ko=r.e.nameKo&&r.e.nameKo!==r.e.nameEn?'<small>'+esc(r.e.nameKo)+'</small>':"";
      if(!why&&r.e.agency)why='<div class="kpp-s-why">'+hi(r.e.agency,r.q)+'</div>';
    }
    li.innerHTML='<span class="kpp-s-emo" aria-hidden="true">'+esc(emo)+'</span>'+
      '<span class="kpp-s-meta"><div class="kpp-s-nm">'+hi(nm2,r.q)+ko+'</div>'+why+'</span>'+
      '<svg class="kpp-s-go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';
    li.setAttribute("aria-label",t("open")+" "+nm2);
    li.addEventListener("click",function(){choose(k);});
    li.addEventListener("mousemove",function(){if(sel!==k)setSel(k);});
    list.appendChild(li);
  });
  setSel(0);
}

function setSel(i){
  var items=list.querySelectorAll(".kpp-s-item");
  if(!items.length){sel=-1;return;}
  if(i<0)i=items.length-1;if(i>=items.length)i=0;
  sel=i;
  for(var k=0;k<items.length;k++){items[k].setAttribute("aria-selected",k===i?"true":"false");}
  var el=items[i];
  if(el&&el.scrollIntoView)el.scrollIntoView({block:"nearest"});
  if(inp&&el&&el.id===""){el.id="kpp-s-opt-"+i;}
  if(inp&&el)inp.setAttribute("aria-activedescendant",el.id||"");
}

function choose(i){
  var r=curResults[i];if(!r)return;
  pushRecent(inp?inp.value:"");
  close();
  if(r.kind==="member"){location.href=memPf(r.e.mem.name,r.e.mem.actId);return;}
  if(r.kind==="vs"){location.href=vsPf(r.e.vs.aId,r.e.vs.bId);return;}
  var id=r.e.a&&r.e.a.id;if(!id)return;
  if(typeof window.kpOpenArtist==="function"){try{window.kpOpenArtist(id);return;}catch(e){}}
  try{location.href=pf(id);}catch(e){}
}

function open(){
  if(ov)return;
  lastFocus=document.activeElement;
  ov=document.createElement("div");ov.className="kpp-s-ov";
  var modal=document.createElement("div");modal.className="kpp-s-modal";modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.setAttribute("aria-label",t("searchL"));
  var head=document.createElement("div");head.className="kpp-s-head";
  head.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/></svg>';
  inp=document.createElement("input");inp.type="text";inp.className="kpp-s-input";inp.setAttribute("placeholder",t("ph"));inp.setAttribute("aria-label",t("searchL"));inp.setAttribute("role","combobox");inp.setAttribute("aria-expanded","true");inp.setAttribute("aria-autocomplete","list");inp.setAttribute("autocomplete","off");inp.setAttribute("spellcheck","false");
  var escb=document.createElement("button");escb.type="button";escb.className="kpp-s-esc";escb.textContent="Esc";escb.setAttribute("aria-label",t("closeL"));
  escb.addEventListener("click",function(){close();});
  head.appendChild(inp);head.appendChild(escb);
  list=document.createElement("ul");list.className="kpp-s-list";list.setAttribute("role","listbox");list.setAttribute("aria-label",t("resultsL"));list.id="kpp-s-listbox";
  inp.setAttribute("aria-controls","kpp-s-listbox");
  modal.appendChild(head);modal.appendChild(list);
  // KP-07: site-wide search escape hatch (bypasses the capture guard below)
  var site=document.createElement("button");
  site.type="button";site.className="kpp-s-site";
  site.textContent=t("siteSearch")+" →";
  site.addEventListener("click",function(){close();openGlobalSearch();});
  modal.appendChild(site);
  ov.appendChild(modal);
  document.body.appendChild(ov);

  ov.addEventListener("mousedown",function(e){if(e.target===ov)close();});
  inp.addEventListener("input",function(){render(inp.value);});
  inp.addEventListener("keydown",onKey);
  document.addEventListener("keydown",trap,true);
  render("");
  try{inp.focus();}catch(e){}
}

function trap(e){ // focus trap
  if(!ov)return;
  if(e.key==="Tab"){
    var f=ov.querySelectorAll("input,button");
    if(!f.length)return;
    var first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
}

function onKey(e){
  if(e.key==="ArrowDown"){e.preventDefault();if(curResults.length)setSel(sel+1);}
  else if(e.key==="ArrowUp"){e.preventDefault();if(curResults.length)setSel(sel-1);}
  else if(e.key==="Enter"){e.preventDefault();if(sel>=0)choose(sel);}
  else if(e.key==="Escape"){e.preventDefault();close();}
}

function close(){
  if(!ov)return;
  document.removeEventListener("keydown",trap,true);
  if(ov.parentNode)ov.parentNode.removeChild(ov);
  ov=null;inp=null;list=null;sel=-1;curResults=[];
  if(lastFocus&&typeof lastFocus.focus==="function"){try{lastFocus.focus();}catch(e){}}
}

// KP-07: single capture-phase guard — on the K-pop hub, the search intent is
// artist search. Intercept .kp-search-btn clicks (incl. mobile.js tab's b.click())
// and Cmd/Ctrl+K BEFORE search.js's own listeners (capture beats target/bubble),
// open only the artist search and stop propagation so no double modal opens.
// The old separate ⌘K binding is consolidated here (single handler, so
// stopImmediatePropagation can't kill our own toggle).
var guardBypass=false;
function openGlobalSearch(){ // used by the modal's "site-wide search" link
  guardBypass=true;
  try{
    if(window.kpSearch&&typeof window.kpSearch.open==="function"){window.kpSearch.open();}
    else{var b=document.querySelector(".kp-search-btn");if(b)b.click();}
  }catch(err){}
  guardBypass=false;
}
document.addEventListener("click",function(e){
  if(guardBypass)return;
  var el=e.target;
  var hit=(el&&el.closest)?el.closest(".kp-search-btn"):null;
  if(!hit)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if(ov)close();else open();
},true);
document.addEventListener("keydown",function(e){
  if(guardBypass)return;
  if((e.metaKey||e.ctrlKey)&&(e.key==="k"||e.key==="K")){
    // if the site-wide search is open (opened via the modal link), let search.js close it
    var gso=document.getElementById("kp-search-overlay");
    if(gso&&gso.classList.contains("open"))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(ov)close();else open();
    return;
  }
  if(e.key==="/"&&!ov){
    var ae=document.activeElement,tag=ae&&ae.tagName?ae.tagName.toLowerCase():"";
    var typing=tag==="input"||tag==="textarea"||tag==="select"||(ae&&ae.isContentEditable);
    if(!typing){e.preventDefault();open();}
  }
},true);

})();

/* ===== quiz: Daily K-Pop Quiz card (adapts Duolingo/Wordle/NYT daily): a deterministic date-seeded 5-question MCQ drawn from roster+enrich facts, with pe ===== */
(function(){
  "use strict";
  try{
    var MOUNT=document.querySelector("#kpop-foryou");
    if(!MOUNT) return;

    var ROSTER=(window.KPOP_ROSTER&&window.KPOP_ROSTER.length)?window.KPOP_ROSTER:[];
    if(!ROSTER.length) return;
    var ENRICH=window.KPOP_ENRICH||{};

    var L=(localStorage.getItem("kp_lang")||(navigator.language||"en").slice(0,2)||"en").toLowerCase();
    var LANGS=["en","ko","ja","zh","es","fr","de","pt","id"];
    if(LANGS.indexOf(L)<0) L="en";

    var pf=function(id){var x=LANGS.indexOf(L)>=0?L:"en";return (x==="en"?"":x+"/")+"kpop/"+id+"-profile";};

    var I18N={
      title:{en:"Daily K-Pop Quiz",ko:"오늘의 K-팝 퀴즈",ja:"今日のK-POPクイズ",zh:"每日K-pop测验",es:"Quiz diario de K-Pop",fr:"Quiz K-Pop du jour",de:"Tägliches K-Pop-Quiz",pt:"Quiz diário de K-Pop",id:"Kuis K-Pop Harian"},
      sub:{en:"5 questions. Everyone gets the same quiz today.",ko:"5문제. 오늘은 모두 같은 퀴즈예요.",ja:"5問。今日はみんな同じクイズ。",zh:"5道题。今天大家的题目都一样。",es:"5 preguntas. Hoy todos tienen el mismo quiz.",fr:"5 questions. Aujourd'hui, le même quiz pour tous.",de:"5 Fragen. Heute hat jeder dasselbe Quiz.",pt:"5 perguntas. Hoje todos têm o mesmo quiz.",id:"5 pertanyaan. Hari ini semua dapat kuis yang sama."},
      start:{en:"Start quiz",ko:"퀴즈 시작",ja:"クイズを始める",zh:"开始测验",es:"Empezar quiz",fr:"Commencer",de:"Quiz starten",pt:"Começar quiz",id:"Mulai kuis"},
      qof:{en:"Question {a} of {b}",ko:"{b}문제 중 {a}번",ja:"問題 {a} / {b}",zh:"第 {a} / {b} 题",es:"Pregunta {a} de {b}",fr:"Question {a} sur {b}",de:"Frage {a} von {b}",pt:"Pergunta {a} de {b}",id:"Soal {a} dari {b}"},
      correct:{en:"Correct!",ko:"정답!",ja:"正解！",zh:"答对了！",es:"¡Correcto!",fr:"Correct !",de:"Richtig!",pt:"Correto!",id:"Benar!"},
      wrong:{en:"Not quite",ko:"아쉬워요",ja:"惜しい",zh:"差一点",es:"Casi",fr:"Pas tout à fait",de:"Knapp daneben",pt:"Quase",id:"Belum tepat"},
      ans:{en:"Answer: {x}",ko:"정답: {x}",ja:"正解: {x}",zh:"答案：{x}",es:"Respuesta: {x}",fr:"Réponse : {x}",de:"Antwort: {x}",pt:"Resposta: {x}",id:"Jawaban: {x}"},
      next:{en:"Next",ko:"다음",ja:"次へ",zh:"下一题",es:"Siguiente",fr:"Suivant",de:"Weiter",pt:"Próxima",id:"Berikutnya"},
      seeResult:{en:"See result",ko:"결과 보기",ja:"結果を見る",zh:"查看结果",es:"Ver resultado",fr:"Voir le résultat",de:"Ergebnis ansehen",pt:"Ver resultado",id:"Lihat hasil"},
      scored:{en:"You scored {a}/{b}",ko:"점수 {a}/{b}",ja:"スコア {a}/{b}",zh:"得分 {a}/{b}",es:"Puntuaste {a}/{b}",fr:"Score : {a}/{b}",de:"Ergebnis: {a}/{b}",pt:"Pontuação {a}/{b}",id:"Skor {a}/{b}"},
      perfect:{en:"Perfect! True stan.",ko:"만점! 완전 찐팬.",ja:"満点！真のファン。",zh:"满分！真粉无疑。",es:"¡Perfecto! Stan de verdad.",fr:"Parfait ! Vrai stan.",de:"Perfekt! Echter Stan.",pt:"Perfeito! Stan de verdade.",id:"Sempurna! Stan sejati."},
      great:{en:"Great memory!",ko:"기억력 최고!",ja:"記憶力バッチリ！",zh:"记性真好！",es:"¡Gran memoria!",fr:"Belle mémoire !",de:"Tolles Gedächtnis!",pt:"Ótima memória!",id:"Ingatan hebat!"},
      good:{en:"Nice work!",ko:"잘했어요!",ja:"いいね！",zh:"不错哦！",es:"¡Bien hecho!",fr:"Bien joué !",de:"Gut gemacht!",pt:"Mandou bem!",id:"Kerja bagus!"},
      keep:{en:"Keep practicing!",ko:"조금 더 연습!",ja:"もう少し！",zh:"再接再厉！",es:"¡Sigue practicando!",fr:"Continue de t'entraîner !",de:"Weiter üben!",pt:"Continue praticando!",id:"Terus berlatih!"},
      streak:{en:"{n}-day streak",ko:"{n}일 연속",ja:"{n}日連続",zh:"连续 {n} 天",es:"Racha de {n} días",fr:"Série de {n} jours",de:"{n}-Tage-Serie",pt:"Sequência de {n} dias",id:"Beruntun {n} hari"},
      streak1:{en:"Day 1 — come back tomorrow!",ko:"1일차 — 내일 또 오세요!",ja:"1日目 — また明日！",zh:"第 1 天 — 明天再来！",es:"Día 1 — ¡vuelve mañana!",fr:"Jour 1 — reviens demain !",de:"Tag 1 — komm morgen wieder!",pt:"Dia 1 — volte amanhã!",id:"Hari ke-1 — kembali besok!"},
      share:{en:"Share result",ko:"결과 공유",ja:"結果をシェア",zh:"分享结果",es:"Compartir",fr:"Partager",de:"Teilen",pt:"Compartilhar",id:"Bagikan"},
      copied:{en:"Copied!",ko:"복사됨!",ja:"コピーしました！",zh:"已复制！",es:"¡Copiado!",fr:"Copié !",de:"Kopiert!",pt:"Copiado!",id:"Tersalin!"},
      done:{en:"Done for today — see you tomorrow!",ko:"오늘은 끝! 내일 또 만나요!",ja:"今日はここまで。また明日！",zh:"今天到此为止，明天见！",es:"¡Listo por hoy, hasta mañana!",fr:"C'est tout pour aujourd'hui, à demain !",de:"Für heute fertig — bis morgen!",pt:"Por hoje é só — até amanhã!",id:"Cukup untuk hari ini — sampai besok!"},
      qFandom:{en:"What is {x}'s fandom called?",ko:"{x}의 팬덤 이름은?",ja:"{x}のファンダム名は？",zh:"{x} 的粉丝名是什么？",es:"¿Cómo se llama el fandom de {x}?",fr:"Comment s'appelle le fandom de {x} ?",de:"Wie heißt das Fandom von {x}?",pt:"Como se chama o fandom de {x}?",id:"Apa nama fandom {x}?"},
      qDebut:{en:"What year did {x} debut?",ko:"{x}의 데뷔 연도는?",ja:"{x}のデビュー年は？",zh:"{x} 是哪一年出道的？",es:"¿En qué año debutó {x}?",fr:"En quelle année {x} a débuté ?",de:"In welchem Jahr debütierte {x}?",pt:"Em que ano {x} estreou?",id:"Tahun berapa {x} debut?"},
      qMember:{en:"Which group is {x} a member of?",ko:"{x}이(가) 속한 그룹은?",ja:"{x}が所属するグループは？",zh:"{x} 是哪个团体的成员？",es:"¿A qué grupo pertenece {x}?",fr:"À quel groupe appartient {x} ?",de:"Zu welcher Gruppe gehört {x}?",pt:"De qual grupo {x} é integrante?",id:"{x} anggota grup apa?"},
      qLight:{en:"What is {x}'s lightstick called?",ko:"{x}의 응원봉 이름은?",ja:"{x}のペンライトの名前は？",zh:"{x} 的应援棒叫什么？",es:"¿Cómo se llama el lightstick de {x}?",fr:"Comment s'appelle le lightstick de {x} ?",de:"Wie heißt der Lightstick von {x}?",pt:"Como se chama o lightstick de {x}?",id:"Apa nama lightstick {x}?"},
      qAgency:{en:"Which agency manages {x}?",ko:"{x}의 소속사는?",ja:"{x}の所属事務所は？",zh:"{x} 隶属于哪家公司？",es:"¿Qué agencia gestiona a {x}?",fr:"Quelle agence gère {x} ?",de:"Welche Agentur steht hinter {x}?",pt:"Qual agência gerencia {x}?",id:"Agensi mana yang menaungi {x}?"},
      shareTitle:{en:"Daily K-Pop Quiz",ko:"오늘의 K-팝 퀴즈",ja:"今日のK-POPクイズ",zh:"每日K-pop测验",es:"Quiz diario de K-Pop",fr:"Quiz K-Pop du jour",de:"Tägliches K-Pop-Quiz",pt:"Quiz diário de K-Pop",id:"Kuis K-Pop Harian"},
      profile:{en:"View profile",ko:"프로필 보기",ja:"プロフィールを見る",zh:"查看资料",es:"Ver perfil",fr:"Voir le profil",de:"Profil ansehen",pt:"Ver perfil",id:"Lihat profil"}
    };
    var t=function(k,vars){var o=I18N[k]||{};var s=o[L]||o.en||k;if(vars){for(var p in vars){if(Object.prototype.hasOwnProperty.call(vars,p)){s=s.replace(new RegExp("\\{"+p+"\\}","g"),vars[p]);}}}return s;};

    // ── deterministic date seed ───────────────────────────────────────────
    function dayKey(d){var y=d.getFullYear(),m=d.getMonth()+1,da=d.getDate();return ""+y+(m<10?"0":"")+m+(da<10?"0":"")+da;}
    var TODAY=new Date();
    var DKEY=dayKey(TODAY);
    function seedFrom(str){var h=2166136261>>>0;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
    function mulberry(a){return function(){a|=0;a=(a+1831565813)|0;var x=Math.imul(a^(a>>>15),1|a);x=(x+Math.imul(x^(x>>>7),61|x))^x;return ((x^(x>>>14))>>>0)/4294967296;};}
    var rng=mulberry(seedFrom("kpquiz"+DKEY));
    function shuffle(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(rng()*(i+1));var tmp=a[i];a[i]=a[j];a[j]=tmp;}return a;}
    function pickN(arr,n){return shuffle(arr).slice(0,n);}

    function nameOf(a){return (L==="ko"&&a.nameKo)?a.nameKo:a.nameEn;}
    function debutYear(a){var d=(a.debut||"").slice(0,4);return /^\d{4}$/.test(d)?d:null;}

    // ── build question pool from facts ────────────────────────────────────
    function uniq(arr){var seen={},out=[];for(var i=0;i<arr.length;i++){var v=arr[i];if(v!=null&&v!==""&&!seen[v]){seen[v]=1;out.push(v);}}return out;}
    function distractors(pool,correct,n){var c=[];var p=shuffle(pool);for(var i=0;i<p.length&&c.length<n;i++){if(p[i]!==correct&&c.indexOf(p[i])<0)c.push(p[i]);}return c;}

    var groups=ROSTER.filter(function(a){return a.type==="group";});
    var allFandoms=uniq(ROSTER.map(function(a){return a.fandom;}));
    var allYears=uniq(ROSTER.map(debutYear).filter(Boolean));
    var allAgencies=uniq(ROSTER.map(function(a){return a.agency;}));
    var groupNames=uniq(groups.map(nameOf));

    function buildQuestions(){
      var bank=[];
      // fandom
      ROSTER.filter(function(a){return a.fandom;}).forEach(function(a){
        var d=distractors(allFandoms,a.fandom,3);if(d.length<3)return;
        bank.push({type:"fandom",aid:a.id,q:t("qFandom",{x:nameOf(a)}),correct:a.fandom,opts:d.concat([a.fandom])});
      });
      // debut year
      ROSTER.filter(function(a){return debutYear(a);}).forEach(function(a){
        var cy=debutYear(a);var d=distractors(allYears,cy,3);if(d.length<3)return;
        bank.push({type:"debut",aid:a.id,q:t("qDebut",{x:nameOf(a)}),correct:cy,opts:d.concat([cy])});
      });
      // which group is X a member of
      groups.filter(function(a){return a.members&&a.members.length;}).forEach(function(a){
        var member=a.members[Math.floor(rng()*a.members.length)];
        if(!member)return;
        var d=distractors(groupNames,nameOf(a),3);if(d.length<3)return;
        bank.push({type:"member",aid:a.id,q:t("qMember",{x:member}),correct:nameOf(a),opts:d.concat([nameOf(a)])});
      });
      // lightstick
      ROSTER.forEach(function(a){
        var e=ENRICH[a.id];if(!e||!e.lightstick)return;
        var pool=uniq(Object.keys(ENRICH).map(function(k){return ENRICH[k]&&ENRICH[k].lightstick;}).filter(Boolean));
        var d=distractors(pool,e.lightstick,3);if(d.length<3)return;
        bank.push({type:"light",aid:a.id,q:t("qLight",{x:nameOf(a)}),correct:e.lightstick,opts:d.concat([e.lightstick])});
      });
      // agency
      ROSTER.filter(function(a){return a.agency;}).forEach(function(a){
        var d=distractors(allAgencies,a.agency,3);if(d.length<3)return;
        bank.push({type:"agency",aid:a.id,q:t("qAgency",{x:nameOf(a)}),correct:a.agency,opts:d.concat([a.agency])});
      });
      // pick 5, prefer type variety, deterministic
      var byType={};bank.forEach(function(q){(byType[q.type]=byType[q.type]||[]).push(q);});
      var types=shuffle(Object.keys(byType));
      var chosen=[],usedAid={};
      // round-robin over types for variety
      var idx={};types.forEach(function(ty){idx[ty]=0;byType[ty]=shuffle(byType[ty]);});
      var guard=0;
      while(chosen.length<5&&guard<400){
        for(var ti=0;ti<types.length&&chosen.length<5;ti++){
          var ty=types[ti];var list=byType[ty];var qq=null;
          while(idx[ty]<list.length){var cand=list[idx[ty]++];if(!usedAid[cand.aid]||chosen.length>=ROSTER.length){qq=cand;break;}}
          if(qq){usedAid[qq.aid]=1;chosen.push(qq);}
        }
        guard++;
      }
      // fallback fill if still short (small data)
      if(chosen.length<5){var flat=shuffle(bank);for(var i=0;i<flat.length&&chosen.length<5;i++){if(chosen.indexOf(flat[i])<0)chosen.push(flat[i]);}}
      // finalize: shuffle each option set deterministically
      return chosen.slice(0,5).map(function(q){
        return {type:q.type,aid:q.aid,q:q.q,correct:q.correct,opts:shuffle(uniq(q.opts)).slice(0,4)};
      }).filter(function(q){return q.opts.indexOf(q.correct)>=0&&q.opts.length>=2;});
    }

    var QUESTIONS=buildQuestions();
    if(QUESTIONS.length<3) return; // not enough fair data — bail silently

    // ── persisted per-day state ───────────────────────────────────────────
    var STATE_KEY="kpp_quiz";
    function loadState(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||"{}")||{};}catch(e){return {};}}
    function saveState(s){try{localStorage.setItem(STATE_KEY,JSON.stringify(s));}catch(e){}}
    function prevDayKey(dk){
      var y=+dk.slice(0,4),m=+dk.slice(4,6)-1,d=+dk.slice(6,8);
      var dt=new Date(y,m,d);dt.setDate(dt.getDate()-1);return dayKey(dt);
    }
    function computeStreak(state){
      // returns the streak AFTER recording a completion today
      var prev=state.lastPlayed;
      if(prev===DKEY) return state.streak||1;
      if(prev&&prev===prevDayKey(DKEY)) return (state.streak||0)+1;
      return 1;
    }

    // emoji result
    function emojiLine(results){
      return results.map(function(ok){return ok?"🟩":"⬛";}).join("");
    }
    function shareText(score,total,results,streak){
      var sq=emojiLine(results);
      var line1=t("shareTitle")+" "+DKEY.slice(0,4)+"."+DKEY.slice(4,6)+"."+DKEY.slice(6,8);
      var line2=score+"/"+total+"  "+sq;
      var url=(location&&location.origin?location.origin:"")+"/kpop";
      return line1+"\n"+line2+"\n"+url;
    }

    // ── CSS (inject once) ─────────────────────────────────────────────────
    if(!document.getElementById("kpp-quiz-css")){
      var st=document.createElement("style");st.id="kpp-quiz-css";
      st.textContent=
      ".kpp-quiz{background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:16px;padding:16px 18px;margin-bottom:16px;color:var(--text,#fff);font-family:inherit}"+
      ".kpp-quiz h3{font-size:15px;font-weight:900;margin:0 0 2px;display:flex;align-items:center;gap:8px}"+
      ".kpp-quiz .kpp-q-sub{color:var(--text2,#aab);font-size:12.5px;margin:0 0 12px}"+
      ".kpp-quiz .kpp-q-prog{font-size:11.5px;font-weight:800;color:var(--text3,#8a93a0);letter-spacing:.04em;text-transform:uppercase;margin-bottom:8px}"+
      ".kpp-quiz .kpp-q-bar{height:5px;border-radius:99px;background:var(--border,rgba(255,255,255,.12));overflow:hidden;margin-bottom:14px}"+
      ".kpp-quiz .kpp-q-bar > i{display:block;height:100%;border-radius:99px;background:var(--kp-grad,linear-gradient(90deg,var(--accent,#ff2e74),#7b5cff));transition:width .35s ease}"+
      ".kpp-quiz .kpp-q-text{font-size:16px;font-weight:800;line-height:1.35;margin:0 0 14px}"+
      ".kpp-quiz .kpp-opts{display:grid;gap:9px}"+
      ".kpp-quiz button.kpp-opt{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:var(--bg,#0c0c14);border:1.5px solid var(--border,rgba(255,255,255,.12));color:var(--text,#fff);border-radius:12px;padding:13px 14px;font-size:14.5px;font-weight:600;cursor:pointer;transition:border-color .15s,background .15s,transform .08s;font-family:inherit}"+
      ".kpp-quiz button.kpp-opt:hover{border-color:var(--accent,#ff2e74)}"+
      ".kpp-quiz button.kpp-opt:active{transform:scale(.99)}"+
      ".kpp-quiz button.kpp-opt:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px}"+
      ".kpp-quiz button.kpp-opt[disabled]{cursor:default;opacity:1}"+
      ".kpp-quiz button.kpp-opt .kpp-mk{margin-left:auto;font-size:15px}"+
      ".kpp-quiz button.kpp-opt.is-correct{border-color:#27c281;background:rgba(39,194,129,.14)}"+
      ".kpp-quiz button.kpp-opt.is-wrong{border-color:#ff4d6a;background:rgba(255,77,106,.12)}"+
      ".kpp-quiz .kpp-fb{font-size:13.5px;font-weight:800;margin:13px 0 4px;display:flex;align-items:center;gap:8px}"+
      ".kpp-quiz .kpp-fb.ok{color:#3ad99a}.kpp-quiz .kpp-fb.no{color:#ff6680}"+
      ".kpp-quiz .kpp-ansline{font-size:12.5px;color:var(--text2,#aab);margin:0 0 12px}"+
      ".kpp-quiz .kpp-cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;border:0;border-radius:12px;padding:13px 16px;font-size:14.5px;font-weight:900;color:#fff;cursor:pointer;background:var(--kp-grad,linear-gradient(90deg,var(--accent,#ff2e74),#7b5cff));font-family:inherit;transition:transform .08s,filter .15s}"+
      ".kpp-quiz .kpp-cta:hover{filter:brightness(1.07)}.kpp-quiz .kpp-cta:active{transform:scale(.99)}"+
      ".kpp-quiz .kpp-cta:focus-visible{outline:2px solid #fff;outline-offset:2px}"+
      ".kpp-quiz .kpp-ghost{background:transparent;border:1.5px solid var(--border,rgba(255,255,255,.18));color:var(--text,#fff)}"+
      ".kpp-quiz .kpp-res{text-align:center;padding:6px 0 2px}"+
      ".kpp-quiz .kpp-score{font-size:30px;font-weight:900;letter-spacing:-.02em;line-height:1.1;margin:6px 0 2px;background:var(--kp-grad,linear-gradient(90deg,var(--accent,#ff2e74),#7b5cff));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}"+
      ".kpp-quiz .kpp-msg{font-size:14px;font-weight:800;margin:0 0 10px}"+
      ".kpp-quiz .kpp-squares{font-size:24px;letter-spacing:3px;margin:6px 0 4px;line-height:1}"+
      ".kpp-quiz .kpp-streak{display:inline-flex;align-items:center;gap:7px;background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:99px;padding:7px 13px;font-size:13px;font-weight:800;margin:8px 0 14px}"+
      ".kpp-quiz .kpp-actions{display:grid;gap:9px}"+
      ".kpp-quiz .kpp-toast{font-size:12.5px;font-weight:800;color:#3ad99a;min-height:16px;margin-top:8px}"+
      ".kpp-quiz a.kpp-pf{display:inline-block;margin-top:10px;font-size:12.5px;font-weight:800;color:var(--accent,#ff2e74);text-decoration:none}"+
      ".kpp-quiz a.kpp-pf:hover{text-decoration:underline}"+
      "@media (prefers-reduced-motion:reduce){.kpp-quiz *{transition:none!important}}";
      document.head.appendChild(st);
    }

    // ── DOM root (idempotent) ─────────────────────────────────────────────
    var existing=MOUNT.querySelector(".kpp-quiz[data-kpp-quiz='1']");
    var root;
    if(existing){root=existing;}
    else{
      root=document.createElement("section");
      root.className="kpp-quiz";
      root.setAttribute("data-kpp-quiz","1");
      root.setAttribute("aria-label",t("title"));
      MOUNT.appendChild(root);
    }

    // ── runtime quiz state ────────────────────────────────────────────────
    var view="intro"; // intro | question | result
    var cur=0;
    var picked=[]; // user choices per question
    var results=[]; // booleans
    var finalScore=0, finalStreak=0;

    function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];});}
    function clear(){while(root.firstChild)root.removeChild(root.firstChild);}
    function head(){
      var h=document.createElement("h3");
      var sp=document.createElement("span");sp.textContent="🎯";sp.setAttribute("aria-hidden","true");
      h.appendChild(sp);h.appendChild(document.createTextNode(t("title")));
      root.appendChild(h);
    }

    function renderIntro(){
      clear();head();
      var sub=document.createElement("p");sub.className="kpp-q-sub";sub.textContent=t("sub");root.appendChild(sub);
      var btn=document.createElement("button");btn.type="button";btn.className="kpp-cta";
      btn.setAttribute("aria-label",t("start"));
      var em=document.createElement("span");em.textContent="▶";em.setAttribute("aria-hidden","true");
      btn.appendChild(em);btn.appendChild(document.createTextNode(" "+t("start")));
      btn.addEventListener("click",function(){view="question";cur=0;picked=[];results=[];render();});
      root.appendChild(btn);
    }

    function renderQuestion(){
      clear();head();
      var q=QUESTIONS[cur];
      var prog=document.createElement("div");prog.className="kpp-q-prog";
      prog.textContent=t("qof",{a:cur+1,b:QUESTIONS.length});root.appendChild(prog);
      var bar=document.createElement("div");bar.className="kpp-q-bar";
      var fill=document.createElement("i");fill.style.width=Math.round((cur/QUESTIONS.length)*100)+"%";
      bar.appendChild(fill);root.appendChild(bar);
      var qt=document.createElement("p");qt.className="kpp-q-text";qt.textContent=q.q;root.appendChild(qt);

      var answered=picked[cur]!=null;
      var opts=document.createElement("div");opts.className="kpp-opts";
      opts.setAttribute("role","group");opts.setAttribute("aria-label",q.q);

      q.opts.forEach(function(opt){
        var b=document.createElement("button");b.type="button";b.className="kpp-opt";
        b.setAttribute("aria-label",opt);
        var lab=document.createElement("span");lab.textContent=opt;b.appendChild(lab);
        var mk=document.createElement("span");mk.className="kpp-mk";mk.setAttribute("aria-hidden","true");b.appendChild(mk);
        if(answered){
          b.disabled=true;
          if(opt===q.correct){b.classList.add("is-correct");mk.textContent="✓";}
          else if(opt===picked[cur]){b.classList.add("is-wrong");mk.textContent="✗";}
        }else{
          b.addEventListener("click",function(){
            if(picked[cur]!=null)return;
            picked[cur]=opt;
            results[cur]=(opt===q.correct);
            render();
          });
        }
        opts.appendChild(b);
      });
      root.appendChild(opts);

      if(answered){
        var ok=results[cur];
        var fb=document.createElement("div");fb.className="kpp-fb "+(ok?"ok":"no");
        var ic=document.createElement("span");ic.textContent=ok?"✅":"❌";ic.setAttribute("aria-hidden","true");
        fb.appendChild(ic);fb.appendChild(document.createTextNode(ok?t("correct"):t("wrong")));
        root.appendChild(fb);
        if(!ok){
          var al=document.createElement("p");al.className="kpp-ansline";al.textContent=t("ans",{x:q.correct});root.appendChild(al);
        }
        var last=(cur>=QUESTIONS.length-1);
        var nb=document.createElement("button");nb.type="button";nb.className="kpp-cta";
        nb.textContent=last?t("seeResult"):t("next");
        nb.setAttribute("aria-label",last?t("seeResult"):t("next"));
        nb.addEventListener("click",function(){
          if(last){finish();}else{cur++;render();}
        });
        root.appendChild(nb);
      }
    }

    function finish(){
      finalScore=results.reduce(function(s,b){return s+(b?1:0);},0);
      var state=loadState();
      // only record/advance streak once per day
      if(state.day!==DKEY||state.lastPlayed!==DKEY){
        finalStreak=computeStreak(state);
        var next={
          day:DKEY,
          lastPlayed:DKEY,
          streak:finalStreak,
          score:finalScore,
          total:QUESTIONS.length,
          results:results.slice(),
          picked:picked.slice()
        };
        saveState(next);
      }else{
        finalStreak=state.streak||1;
      }
      view="result";render();
    }

    function resultMessage(score,total){
      if(score===total)return t("perfect");
      var r=score/total;
      if(r>=0.8)return t("great");
      if(r>=0.5)return t("good");
      return t("keep");
    }

    function renderResult(){
      clear();head();
      var state=loadState();
      var score=(typeof finalScore==="number")?finalScore:(state.score||0);
      var total=QUESTIONS.length;
      var res=(results&&results.length===total)?results:(state.results||[]);
      var streak=finalStreak||state.streak||1;

      var wrap=document.createElement("div");wrap.className="kpp-res";
      var sc=document.createElement("div");sc.className="kpp-score";sc.textContent=score+" / "+total;
      sc.setAttribute("role","status");sc.setAttribute("aria-label",t("scored",{a:score,b:total}));
      wrap.appendChild(sc);
      var msg=document.createElement("div");msg.className="kpp-msg";msg.textContent=resultMessage(score,total);wrap.appendChild(msg);
      var sq=document.createElement("div");sq.className="kpp-squares";sq.setAttribute("aria-hidden","true");
      sq.textContent=emojiLine(res);wrap.appendChild(sq);
      var stk=document.createElement("div");stk.className="kpp-streak";
      var fire=document.createElement("span");fire.textContent="🔥";fire.setAttribute("aria-hidden","true");
      stk.appendChild(fire);
      stk.appendChild(document.createTextNode(streak>1?t("streak",{n:streak}):t("streak1")));
      wrap.appendChild(stk);
      root.appendChild(wrap);

      var actions=document.createElement("div");actions.className="kpp-actions";
      var shareBtn=document.createElement("button");shareBtn.type="button";shareBtn.className="kpp-cta";
      var sicon=document.createElement("span");sicon.textContent="📤";sicon.setAttribute("aria-hidden","true");
      shareBtn.appendChild(sicon);shareBtn.appendChild(document.createTextNode(" "+t("share")));
      shareBtn.setAttribute("aria-label",t("share"));
      var toast=document.createElement("div");toast.className="kpp-toast";toast.setAttribute("role","status");
      shareBtn.addEventListener("click",function(){
        var txt=shareText(score,total,res,streak);
        var showCopied=function(){toast.textContent=t("copied");setTimeout(function(){toast.textContent="";},2200);};
        try{
          if(navigator.share){
            navigator.share({title:t("shareTitle"),text:txt}).catch(function(){copyFb(txt,showCopied);});
          }else{copyFb(txt,showCopied);}
        }catch(e){copyFb(txt,showCopied);}
      });
      actions.appendChild(shareBtn);

      // profile link of a featured artist (first question's artist) — keep users internal
      var feat=QUESTIONS[0]&&QUESTIONS[0].aid;
      var fa=feat?ROSTER.filter(function(a){return a.id===feat;})[0]:null;
      if(fa){
        var pl=document.createElement("a");pl.className="kpp-pf";pl.href=pf(fa.id);
        pl.textContent=(fa.emoji?fa.emoji+" ":"")+t("profile")+" →";
        pl.setAttribute("aria-label",t("profile")+": "+nameOf(fa));
        pl.addEventListener("click",function(ev){
          if(typeof window.kpOpenArtist==="function"){ev.preventDefault();try{window.kpOpenArtist(fa.id);}catch(e){location.href=pf(fa.id);}}
        });
        actions.appendChild(pl);
      }
      root.appendChild(actions);
      root.appendChild(toast);

      var done=document.createElement("p");done.className="kpp-q-sub";done.style.marginTop="12px";done.style.marginBottom="0";
      done.style.textAlign="center";done.textContent=t("done");root.appendChild(done);
    }

    function copyFb(txt,cb){
      try{
        if(navigator.clipboard&&navigator.clipboard.writeText){
          navigator.clipboard.writeText(txt).then(cb,function(){legacyCopy(txt);cb();});
        }else{legacyCopy(txt);cb();}
      }catch(e){legacyCopy(txt);cb();}
    }
    function legacyCopy(txt){
      try{
        var ta=document.createElement("textarea");ta.value=txt;ta.setAttribute("readonly","");
        ta.style.position="fixed";ta.style.opacity="0";ta.style.left="-9999px";
        document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);
      }catch(e){}
    }

    function render(){
      try{
        if(view==="intro")renderIntro();
        else if(view==="question")renderQuestion();
        else renderResult();
      }catch(e){}
    }

    // ── boot: if already played today, jump straight to locked result ─────
    (function boot(){
      var s=loadState();
      if(s&&s.day===DKEY&&s.lastPlayed===DKEY&&typeof s.score==="number"){
        finalScore=s.score;finalStreak=s.streak||1;
        results=(s.results&&s.results.length)?s.results.slice():[];
        view="result";
      }else{
        view="intro";
      }
      render();
    })();

  }catch(err){/* never throw */}
})();

/* ===== poll: Bias Battle daily head-to-head poll — a deterministic date-seeded pair of roster artists with one-vote-per-day, an animated two-sided fan-fa ===== */
(function(){
  "use strict";
  try{
    var MOUNT="#kpop-foryou";
    var mount=document.querySelector(MOUNT);
    if(!mount) return;
    if(mount.getAttribute("data-kpp-poll")==="1") return;
    mount.setAttribute("data-kpp-poll","1");

    var ROSTER=(window.KPOP_ROSTER&&window.KPOP_ROSTER.length)?window.KPOP_ROSTER:[];
    if(ROSTER.length<2){ return; }
    var ENRICH=window.KPOP_ENRICH||{};

    var LANGS=["en","ko","ja","zh","es","fr","de","pt","id"];
    var L=(localStorage.getItem("kp_lang")||(navigator.language||"en").slice(0,2)||"en").toLowerCase();
    if(LANGS.indexOf(L)<0) L="en";

    var I18N={
      en:{title:"Bias Battle",sub:"Daily face-off",pick:"Tap your bias to vote",voted:"You voted!",youFandom:"You + the fandom",estimate:"Live tally · counts are approximate",votes:"~%n vote|~%n votes",early:"Early votes — results appear once more fans have voted",result:"Today's result",youPicked:"Your pick",tomorrow:"New battle tomorrow — come back to vote again",share:"Share",vs:"VS",shareText:"My Bias Battle pick today: {win}! Who's yours? {a} vs {b}",profile:"View profile",copied:"Share line copied!",winLabel:"leading today",tieLabel:"neck and neck today",day:"Day"},
      ko:{title:"최애 대결",sub:"오늘의 맞대결",pick:"최애를 눌러 투표하세요",voted:"투표 완료!",youFandom:"나 + 팬덤",estimate:"실시간 집계 · 수치는 근사값",votes:"약 %n표",early:"집계 초반 — 표가 더 모이면 결과가 표시돼요",result:"오늘의 결과",youPicked:"내 선택",tomorrow:"내일 새 대결이 열려요 — 다시 투표하러 오세요",share:"공유",vs:"VS",shareText:"오늘 내 최애 대결 선택: {win}! 당신은? {a} vs {b}",profile:"프로필 보기",copied:"공유 문구 복사됨!",winLabel:"오늘 우세",tieLabel:"오늘 막상막하",day:"일차"},
      ja:{title:"推し対決",sub:"今日の一騎打ち",pick:"推しをタップして投票",voted:"投票しました！",youFandom:"あなた + ファンダム",estimate:"リアルタイム集計 · 数値は概算",votes:"約%n票",early:"集計開始直後 — 票が集まると結果が表示されます",result:"今日の結果",youPicked:"あなたの選択",tomorrow:"明日は新しい対決 — また投票しに来てね",share:"シェア",vs:"VS",shareText:"今日の推し対決の選択：{win}！あなたは？ {a} vs {b}",profile:"プロフィールを見る",copied:"シェア文をコピーしました！",winLabel:"今日リード",tieLabel:"今日は互角",day:"日目"},
      zh:{title:"本命对决",sub:"今日对战",pick:"点击你的本命投票",voted:"投票成功！",youFandom:"你 + 粉丝团",estimate:"实时统计 · 数值为近似值",votes:"约 %n 票",early:"刚开始计票 — 票数够多后会显示结果",result:"今日结果",youPicked:"你的选择",tomorrow:"明天有新对决 — 记得回来再投一票",share:"分享",vs:"VS",shareText:"今天我的本命对决选择：{win}！你呢？ {a} vs {b}",profile:"查看资料",copied:"分享文案已复制！",winLabel:"今日领先",tieLabel:"今日势均力敌",day:"对战日"},
      es:{title:"Batalla de Bias",sub:"Duelo del día",pick:"Toca tu bias para votar",voted:"¡Votaste!",youFandom:"Tú + el fandom",estimate:"Recuento en vivo · cifras aproximadas",votes:"~%n voto|~%n votos",early:"Recuento inicial — los resultados aparecen cuando haya más votos",result:"Resultado de hoy",youPicked:"Tu elección",tomorrow:"Nueva batalla mañana — vuelve para votar otra vez",share:"Compartir",vs:"VS",shareText:"Mi elección en la Batalla de Bias de hoy: ¡{win}! ¿Y la tuya? {a} vs {b}",profile:"Ver perfil",copied:"¡Frase para compartir copiada!",winLabel:"lidera hoy",tieLabel:"empate técnico hoy",day:"Día"},
      fr:{title:"Battle de Bias",sub:"Duel du jour",pick:"Touchez votre bias pour voter",voted:"Voté !",youFandom:"Vous + le fandom",estimate:"Comptage en direct · chiffres approximatifs",votes:"~%n vote|~%n votes",early:"Comptage débutant — les résultats s'afficheront avec plus de votes",result:"Résultat du jour",youPicked:"Votre choix",tomorrow:"Nouvelle battle demain — revenez voter",share:"Partager",vs:"VS",shareText:"Mon choix de la Battle de Bias du jour : {win} ! Et vous ? {a} vs {b}",profile:"Voir le profil",copied:"Phrase de partage copiée !",winLabel:"en tête aujourd'hui",tieLabel:"au coude-à-coude aujourd'hui",day:"Jour"},
      de:{title:"Bias-Battle",sub:"Tagesduell",pick:"Tippe deinen Bias zum Abstimmen",voted:"Abgestimmt!",youFandom:"Du + das Fandom",estimate:"Live-Zählung · Zahlen sind Näherungswerte",votes:"~%n Stimme|~%n Stimmen",early:"Zählung läuft gerade an — Ergebnisse erscheinen bei mehr Stimmen",result:"Heutiges Ergebnis",youPicked:"Deine Wahl",tomorrow:"Morgen neues Battle — komm wieder zum Abstimmen",share:"Teilen",vs:"VS",shareText:"Meine Bias-Battle-Wahl heute: {win}! Und deine? {a} vs {b}",profile:"Profil ansehen",copied:"Share-Text kopiert!",winLabel:"heute vorn",tieLabel:"heute Kopf-an-Kopf",day:"Tag"},
      pt:{title:"Batalha de Bias",sub:"Duelo do dia",pick:"Toque no seu bias para votar",voted:"Você votou!",youFandom:"Você + o fandom",estimate:"Contagem ao vivo · números aproximados",votes:"~%n voto|~%n votos",early:"Contagem inicial — os resultados aparecem com mais votos",result:"Resultado de hoje",youPicked:"Sua escolha",tomorrow:"Nova batalha amanhã — volte para votar de novo",share:"Compartilhar",vs:"VS",shareText:"Minha escolha na Batalha de Bias de hoje: {win}! E a sua? {a} vs {b}",profile:"Ver perfil",copied:"Frase de compartilhamento copiada!",winLabel:"na frente hoje",tieLabel:"empate técnico hoje",day:"Dia"},
      id:{title:"Bias Battle",sub:"Duel hari ini",pick:"Ketuk bias-mu untuk memilih",voted:"Kamu sudah memilih!",youFandom:"Kamu + fandom",estimate:"Hitungan langsung · angka perkiraan",votes:"~%n suara",early:"Baru mulai dihitung — hasil muncul setelah suara bertambah",result:"Hasil hari ini",youPicked:"Pilihanmu",tomorrow:"Battle baru besok — datang lagi untuk memilih",share:"Bagikan",vs:"VS",shareText:"Pilihan Bias Battle-ku hari ini: {win}! Punyamu? {a} vs {b}",profile:"Lihat profil",copied:"Teks berbagi disalin!",winLabel:"unggul hari ini",tieLabel:"bersaing ketat hari ini",day:"Hari"}
    };
    var t=function(k){ var o=I18N[L]||I18N.en; return (o&&o[k]!=null)?o[k]:(I18N.en[k]!=null?I18N.en[k]:k); };

    var esc=function(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];}); };
    var name=function(a){ if(!a) return ""; return (L==="ko"&&a.nameKo)?a.nameKo:(a.nameEn||a.nameKo||a.id||""); };

    var pf=function(id){ var x=LANGS.indexOf(L)>=0?L:"en"; return (x==="en"?"":x+"/")+"kpop/"+id+"-profile"; };
    var openArtist=function(id){
      try{
        if(typeof window.kpOpenArtist==="function"){ window.kpOpenArtist(id); return; }
      }catch(e){}
      try{ window.location.href=pf(id); }catch(e){}
    };

    // ── Deterministic date helpers (KST so a "day" matches the rest of the hub) ──
    var KST_MS=9*3600000;
    function todayKey(){
      var d=new Date(Date.now()+KST_MS);
      var y=d.getUTCFullYear(), m=d.getUTCMonth()+1, da=d.getUTCDate();
      return y+"-"+(m<10?"0":"")+m+"-"+(da<10?"0":"")+da;
    }
    function dayNumber(){
      // stable integer day index for deterministic pairing
      var d=new Date(Date.now()+KST_MS);
      return Math.floor(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())/86400000);
    }
    // FNV-1a style hash → unsigned 32-bit
    function hash(str){
      var h=2166136261>>>0;
      for(var i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619)>>>0; }
      return h>>>0;
    }

    var DAYK=todayKey();
    var DAYN=dayNumber();

    // ── Deterministic pair for the day ──
    function pickPair(){
      var n=ROSTER.length;
      if(n<2) return null;
      var seed=hash("kpp_poll_pair_"+DAYK);
      var iA=seed%n;
      // second index from a different slice of the hash, ensure distinct
      var seed2=hash("kpp_poll_pair2_"+DAYK)%(n-1);
      var iB=seed2; if(iB>=iA) iB+=1;
      var a=ROSTER[iA], b=ROSTER[iB];
      if(!a||!b||a.id===b.id){
        // ultra-defensive fallback
        a=ROSTER[0]; b=ROSTER[1];
      }
      // stable left/right order independent of index draw order
      if(a.id>b.id){ var tmp=a; a=b; b=tmp; }
      return {a:a,b:b};
    }

    // ── Real tally (worker KV) ──
    // Sides are "a"/"b"; pickPair() orders the pair by artist id, so every
    // device derives the same two sides from the same battle key.
    // TALLY stays null until the server answers, and there is deliberately NO
    // synthetic fallback: no numbers beat invented numbers.
    var API=window.KPApi||null;
    var TALLY=null;
    var MIN_VOTES=5;                 // below this, percentages are noise
    function battleKey(a,b){ return DAYK+":"+a.id+"-vs-"+b.id; }
    // "singular|plural" — langs without the distinction omit the pipe. n===1 is
    // the most common state on a fresh battle, so it has to read right.
    function votesLabel(n){
      var p=String(t("votes")).split("|");
      return (n===1?p[0]:(p[1]||p[0])).replace("%n",n);
    }
    function sideOf(pair,id){ return id===pair.a.id?"a":"b"; }
    function loadTally(pair,done){
      if(!API||!API.getKpopVotes){ TALLY=null; done(); return; }
      API.getKpopVotes(battleKey(pair.a,pair.b)).then(function(d){
        TALLY=(d&&typeof d.a==="number")?d:null; done();
      },function(){ TALLY=null; done(); });
    }

    var accent=function(a){
      var c=ENRICH[a.id]&&ENRICH[a.id].color;
      if(c&&/^#?[0-9a-fA-F]{3,8}$/.test(c)) return c.charAt(0)==="#"?c:("#"+c);
      return null;
    };

    // ── Private state ──
    var VKEY="kpp_poll_votes";
    function getVotes(){ try{ return JSON.parse(localStorage.getItem(VKEY)||"{}")||{}; }catch(e){ return {}; } }
    function setVote(dayK,id){ try{ var v=getVotes(); v[dayK]=id; localStorage.setItem(VKEY,JSON.stringify(v)); }catch(e){} }
    function votedToday(){ var v=getVotes(); return v[DAYK]||null; }

    // ── CSS (inject once) ──
    var CSSID="kpp-poll-css";
    if(!document.getElementById(CSSID)){
      var st=document.createElement("style");
      st.id=CSSID;
      st.textContent=[
        ".kpp-poll{background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:16px;padding:16px 18px;margin-bottom:16px;color:var(--text,#fff);-webkit-tap-highlight-color:transparent}",
        ".kpp-poll-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}",
        ".kpp-poll-ttl{font-size:15px;font-weight:900;display:flex;align-items:center;gap:7px;letter-spacing:-.01em}",
        ".kpp-poll-ttl .kpp-poll-spark{font-size:16px}",
        ".kpp-poll-day{font-size:11px;font-weight:800;color:var(--text3,#8a93a0);background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));padding:3px 9px;border-radius:999px;white-space:nowrap}",
        ".kpp-poll-sub{font-size:12px;color:var(--text2,#aab);margin:-8px 0 14px;font-weight:600}",
        ".kpp-poll-arena{display:grid;grid-template-columns:1fr auto 1fr;align-items:stretch;gap:10px}",
        ".kpp-poll-side{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;background:var(--bg,#0c0c14);border:1.5px solid var(--border,rgba(255,255,255,.12));border-radius:14px;padding:14px 8px;cursor:pointer;transition:border-color .18s,transform .18s,box-shadow .18s;text-align:center;min-width:0;color:inherit;font:inherit;width:100%}",
        ".kpp-poll-side:hover{border-color:var(--accent,#ff2e74)}",
        ".kpp-poll-side:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px}",
        ".kpp-poll-side[disabled]{cursor:default}",
        ".kpp-poll-emoji{font-size:34px;line-height:1;filter:drop-shadow(0 3px 8px rgba(0,0,0,.4))}",
        ".kpp-poll-nm{font-size:13.5px;font-weight:800;line-height:1.2;word-break:break-word}",
        ".kpp-poll-fd{font-size:10.5px;font-weight:700;color:var(--text3,#8a93a0);text-transform:uppercase;letter-spacing:.04em}",
        ".kpp-poll-vs{display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:var(--text2,#aab);align-self:center;padding:0 2px}",
        ".kpp-poll-vsdot{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--kp-grad,linear-gradient(135deg,#ff2e74,#b14bff));color:#fff;font-size:11px;font-weight:900;box-shadow:0 4px 14px rgba(177,75,255,.35)}",
        ".kpp-poll-side.picked{border-color:var(--accent,#ff2e74);box-shadow:0 0 0 1px var(--accent,#ff2e74) inset,0 6px 20px rgba(255,46,116,.18)}",
        ".kpp-poll-badge{position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:var(--kp-grad,linear-gradient(135deg,#ff2e74,#b14bff));color:#fff;font-size:9.5px;font-weight:900;padding:3px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,.3)}",
        ".kpp-poll-bars{margin-top:14px}",
        ".kpp-poll-bar{position:relative;height:30px;border-radius:9px;overflow:hidden;background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));display:flex}",
        ".kpp-poll-fill{height:100%;display:flex;align-items:center;min-width:0;transition:flex-basis .9s cubic-bezier(.22,1,.36,1),width .9s cubic-bezier(.22,1,.36,1)}",
        ".kpp-poll-fa{justify-content:flex-start;padding-left:10px;background:linear-gradient(90deg,var(--accent,#ff2e74),rgba(255,46,116,.55))}",
        ".kpp-poll-fb{justify-content:flex-end;padding-right:10px;background:linear-gradient(90deg,rgba(177,75,255,.55),#b14bff)}",
        ".kpp-poll-pct{font-size:12.5px;font-weight:900;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.5);white-space:nowrap}",
        ".kpp-poll-lg{display:flex;justify-content:space-between;gap:8px;margin-top:8px;font-size:11px;font-weight:800;color:var(--text2,#aab)}",
        ".kpp-poll-lg span{display:inline-flex;align-items:center;gap:5px;min-width:0}",
        ".kpp-poll-lg b{font-weight:900;color:var(--text,#fff);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
        ".kpp-poll-you{margin-top:12px;font-size:12px;font-weight:800;text-align:center;color:var(--text,#fff);background:var(--bg,#0c0c14);border:1px dashed var(--border,rgba(255,255,255,.18));border-radius:10px;padding:8px 10px}",
        ".kpp-poll-you em{font-style:normal;color:var(--accent,#ff2e74)}",
        ".kpp-poll-note{margin-top:10px;font-size:10.5px;color:var(--text3,#8a93a0);text-align:center;font-weight:600;line-height:1.4}",
        ".kpp-poll-foot{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}",
        ".kpp-poll-btn{flex:1;min-width:120px;border:1px solid var(--border,rgba(255,255,255,.12));background:var(--bg,#0c0c14);color:var(--text,#fff);font-size:12.5px;font-weight:800;padding:9px 12px;border-radius:10px;cursor:pointer;transition:border-color .15s,background .15s}",
        ".kpp-poll-btn:hover{border-color:var(--accent,#ff2e74)}",
        ".kpp-poll-btn:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px}",
        ".kpp-poll-btn.kpp-poll-share{background:var(--kp-grad,linear-gradient(135deg,#ff2e74,#b14bff));border:none;color:#fff}",
        ".kpp-poll-tom{margin-top:11px;font-size:11.5px;color:var(--text2,#aab);text-align:center;font-weight:700}",
        ".kpp-poll-prof{display:flex;gap:8px;margin-top:11px}",
        ".kpp-poll-prof button{flex:1;min-width:0;font-size:11px;font-weight:800;color:var(--text2,#aab);background:transparent;border:1px solid var(--border,rgba(255,255,255,.12));border-radius:9px;padding:7px 6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color .15s,border-color .15s}",
        ".kpp-poll-prof button:hover{color:var(--text,#fff);border-color:var(--accent,#ff2e74)}",
        ".kpp-poll-prof button:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px}",
        "@media (max-width:360px){.kpp-poll-emoji{font-size:30px}.kpp-poll-nm{font-size:12.5px}.kpp-poll-foot .kpp-poll-btn{min-width:100%}}",
        "@media (prefers-reduced-motion:reduce){.kpp-poll-fill,.kpp-poll-side{transition:none}}"
      ].join("");
      document.head.appendChild(st);
    }

    // ── Toast (reuse hub toast if present) ──
    function toast(msg){
      var el=document.getElementById("kpop-toast");
      if(!el){
        el=document.createElement("div"); el.id="kpop-toast";
        el.style.cssText="position:fixed;left:50%;bottom:calc(20px + var(--mnav-h,0px) + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:calc(100vw - 32px);background:var(--text,#fff);color:var(--bg,#0c0c14);padding:10px 18px;border-radius:22px;font-size:13px;font-weight:700;z-index:9999;opacity:0;transition:opacity .2s;pointer-events:none";
        document.body.appendChild(el);
      }
      el.textContent=msg; el.style.opacity="1";
      clearTimeout(el._tm); el._tm=setTimeout(function(){ el.style.opacity="0"; },1800);
    }

    var card=document.createElement("div");
    card.className="kpp-poll";
    card.setAttribute("role","region");
    card.setAttribute("aria-label",t("title"));

    var reduce=false;
    try{ reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce)").matches; }catch(e){}

    function shareLine(pair,winner){
      var txt=t("shareText");
      return txt.replace("{win}",name(winner)).replace("{a}",name(pair.a)).replace("{b}",name(pair.b));
    }

    function doShare(pair,winner){
      var line=shareLine(pair,winner);
      var url="";
      try{ url=String(window.location&&window.location.href||""); }catch(e){}
      if(navigator.share){
        navigator.share({title:t("title"),text:line,url:url||undefined}).catch(function(){});
        return;
      }
      var full=line+(url?(" "+url):"");
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(full).then(function(){ toast(t("copied")); },function(){ toast(t("copied")); });
      }else{
        try{
          var ta=document.createElement("textarea"); ta.value=full;
          ta.style.cssText="position:fixed;top:-1000px;left:-1000px;opacity:0";
          document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
        }catch(e){}
        toast(t("copied"));
      }
    }

    function render(){
      var pair=pickPair();
      if(!pair){ card.innerHTML=""; return; }
      var a=pair.a, b=pair.b;
      var voted=votedToday();
      // Real counts only. total<MIN_VOTES → no percentages (too few to mean
      // anything); no tally at all → no bars, rather than a made-up split.
      var total=TALLY?(TALLY.a+TALLY.b):0;
      var showPct=!!TALLY&&total>=MIN_VOTES;
      var pctA=showPct?Math.round(TALLY.a/total*100):50;
      var pctB=showPct?100-pctA:50;

      // Determine the "leading" label
      var leader=null;
      if(showPct){ if(pctA>pctB) leader=a; else if(pctB>pctA) leader=b; }

      var accA=accent(a), accB=accent(b);
      var styleA=accA?(' style="--accent:'+esc(accA)+'"'):"";
      var styleB=accB?(' style="--accent:'+esc(accB)+'"'):"";

      var pickedAttr=function(id){ return voted===id?" picked":""; };
      var disabled=voted?" disabled":"";

      var html="";
      html+='<div class="kpp-poll-hd">';
      html+='<div class="kpp-poll-ttl"><span class="kpp-poll-spark" aria-hidden="true">⚔️</span>'+esc(t("title"))+'</div>';
      html+='<div class="kpp-poll-day">'+esc(t("day"))+' '+ ( (DAYN%9000)+1 ) +'</div>';
      html+='</div>';
      html+='<div class="kpp-poll-sub">'+esc(voted?t("voted"):t("sub"))+'</div>';

      html+='<div class="kpp-poll-arena">';
      // Side A
      html+='<button type="button" class="kpp-poll-side'+pickedAttr(a.id)+'" data-pick="'+esc(a.id)+'"'+styleA+disabled+' aria-label="'+esc(name(a))+' — '+esc(voted?t("youPicked"):t("pick"))+'"'+(voted===a.id?' aria-pressed="true"':(voted?'':''))+'>';
      if(voted===a.id) html+='<span class="kpp-poll-badge">'+esc(t("youPicked"))+'</span>';
      html+='<span class="kpp-poll-emoji" aria-hidden="true">'+esc(a.emoji||"⭐")+'</span>';
      html+='<span class="kpp-poll-nm">'+esc(name(a))+'</span>';
      if(a.fandom) html+='<span class="kpp-poll-fd">'+esc(a.fandom)+'</span>';
      html+='</button>';
      // VS
      html+='<div class="kpp-poll-vs"><span class="kpp-poll-vsdot" aria-hidden="true">'+esc(t("vs"))+'</span></div>';
      // Side B
      html+='<button type="button" class="kpp-poll-side'+pickedAttr(b.id)+'" data-pick="'+esc(b.id)+'"'+styleB+disabled+' aria-label="'+esc(name(b))+' — '+esc(voted?t("youPicked"):t("pick"))+'"'+(voted===b.id?' aria-pressed="true"':'')+'>';
      if(voted===b.id) html+='<span class="kpp-poll-badge">'+esc(t("youPicked"))+'</span>';
      html+='<span class="kpp-poll-emoji" aria-hidden="true">'+esc(b.emoji||"⭐")+'</span>';
      html+='<span class="kpp-poll-nm">'+esc(name(b))+'</span>';
      if(b.fandom) html+='<span class="kpp-poll-fd">'+esc(b.fandom)+'</span>';
      html+='</button>';
      html+='</div>';

      if(voted){
        // Result reveal — only when the server actually returned enough votes.
        if(showPct){
          var startA=reduce?pctA:50, startB=reduce?pctB:50;
          html+='<div class="kpp-poll-bars">';
          html+='<div class="kpp-poll-result-ttl" style="font-size:11px;font-weight:800;color:var(--text3,#8a93a0);margin-bottom:7px">'+esc(t("result"))+' · '+esc(votesLabel(total))+'</div>';
          html+='<div class="kpp-poll-bar" role="img" aria-label="'+esc(name(a))+' '+pctA+'% '+esc(t("vs"))+' '+esc(name(b))+' '+pctB+'%">';
          html+='<div class="kpp-poll-fill kpp-poll-fa" data-fill="a" style="flex:0 0 '+startA+'%"><span class="kpp-poll-pct">'+pctA+'%</span></div>';
          html+='<div class="kpp-poll-fill kpp-poll-fb" data-fill="b" style="flex:0 0 '+startB+'%"><span class="kpp-poll-pct">'+pctB+'%</span></div>';
          html+='</div>';
          html+='<div class="kpp-poll-lg"><span>'+esc(a.emoji||"")+' <b>'+esc(name(a))+'</b></span><span><b>'+esc(name(b))+'</b> '+esc(b.emoji||"")+'</span></div>';
          html+='</div>';
        }else if(TALLY){
          html+='<div class="kpp-poll-early">'+esc(t("early"))+' · '+esc(votesLabel(total))+'</div>';
        }

        var youSide=(voted===a.id)?name(a):name(b);
        var youLine='<em>'+esc(t("youFandom"))+'</em> — '+esc(youSide);
        if(showPct) youLine+=' · '+esc(leader?(name(leader)+" "+t("winLabel")):t("tieLabel"));
        html+='<div class="kpp-poll-you">'+youLine+'</div>';
        if(TALLY) html+='<div class="kpp-poll-note">'+esc(t("estimate"))+'</div>';

        // share + profile
        html+='<div class="kpp-poll-foot"><button type="button" class="kpp-poll-btn kpp-poll-share" data-share="1" aria-label="'+esc(t("share"))+'">'+esc(t("share"))+'</button></div>';
        html+='<div class="kpp-poll-prof">';
        html+='<button type="button" data-prof="'+esc(a.id)+'" aria-label="'+esc(name(a))+' '+esc(t("profile"))+'">'+esc(name(a))+'</button>';
        html+='<button type="button" data-prof="'+esc(b.id)+'" aria-label="'+esc(name(b))+' '+esc(t("profile"))+'">'+esc(name(b))+'</button>';
        html+='</div>';
        html+='<div class="kpp-poll-tom">'+esc(t("tomorrow"))+'</div>';
      }

      card.innerHTML=html;

      // wire vote buttons
      if(!voted){
        var sides=card.querySelectorAll(".kpp-poll-side");
        Array.prototype.forEach.call(sides,function(btn){
          btn.addEventListener("click",function(){
            if(votedToday()) return;
            var id=btn.getAttribute("data-pick");
            if(!id) return;
            setVote(DAYK,id);          // local record: one vote per device per day
            render();                  // reveal immediately; the count fills in
            if(API&&API.postKpopVote){
              API.postKpopVote(battleKey(a,b),sideOf(pair,id)).then(function(d){
                if(d&&typeof d.a==="number"){ TALLY=d; render(); }
              },function(){ /* offline → no numbers, never invented ones */ });
            }
          });
        });
      }else{
        // animate bars after paint
        var fills=card.querySelectorAll(".kpp-poll-fill");
        if(fills.length===2){
          if(reduce){
            fills[0].style.flex="0 0 "+pctA+"%";
            fills[1].style.flex="0 0 "+pctB+"%";
          }else{
            requestAnimationFrame(function(){ requestAnimationFrame(function(){
              fills[0].style.flex="0 0 "+pctA+"%";
              fills[1].style.flex="0 0 "+pctB+"%";
            }); });
          }
        }
        var sBtn=card.querySelector("[data-share]");
        if(sBtn) sBtn.addEventListener("click",function(){
          var win=(voted===a.id)?a:b;
          doShare(pair,win);
        });
        var profs=card.querySelectorAll("[data-prof]");
        Array.prototype.forEach.call(profs,function(pb){
          pb.addEventListener("click",function(){ var id=pb.getAttribute("data-prof"); if(id) openArtist(id); });
        });
      }
    }

    mount.appendChild(card);
    render();
    // Already voted on a previous visit → pull today's standing count so the
    // reveal isn't stuck on "no data" until they vote again.
    if(votedToday()){ var p0=pickPair(); if(p0) loadTally(p0,render); }

    // Re-render on day rollover if follows/views fire and the day key changed.
    function maybeRoll(){
      var nk=todayKey();
      if(nk!==DAYK){ DAYK=nk; DAYN=dayNumber(); TALLY=null; render(); }
    }
    window.addEventListener("kp:follows",maybeRoll);
    window.addEventListener("kp:view",maybeRoll);
    document.addEventListener("visibilitychange",function(){ if(!document.hidden) maybeRoll(); });

  }catch(e){ /* never throw into the hub */ }
})();

/* ===== recs: A "For You" card that recommends up to 6 unfollowed artists scored by agency/decade/gender/genre similarity to the user's follows (with "Bec ===== */
(function(){
  "use strict";
  try{
    var MOUNT="#kpop-foryou", FK="recs", FLAG="kpprecs";
    var mount=document.querySelector(MOUNT);
    if(!mount) return;
    if(mount.getAttribute("data-"+FLAG)==="1") return;
    mount.setAttribute("data-"+FLAG,"1");

    var SUP=["en","ko","ja","zh","es","fr","de","pt","id"];
    var L=(localStorage.getItem("kp_lang")||(navigator.language||"en").slice(0,2)||"en").toLowerCase();
    if(SUP.indexOf(L)<0) L="en";

    var pf=function(id){var x=SUP.indexOf(L)>=0?L:"en"; return (x==="en"?"":x+"/")+"kpop/"+id+"-profile";};

    var I18N={
      en:{title:"For You",subPop:"Popular right now",subRec:"Fans also stan",follow:"Follow",following:"Following",open:"Open profile",because:function(n){return "Because you follow "+n;},pop:"Trending with fans",empty:"No recommendations yet — follow an artist to get started.",by:"by"},
      ko:{title:"추천",subPop:"지금 인기",subRec:"팬들이 함께 덕질하는",follow:"팔로우",following:"팔로잉",open:"프로필 열기",because:function(n){return n+" 팔로우 기반 추천";},pop:"팬들 사이 인기",empty:"아직 추천이 없어요 — 아티스트를 팔로우해 보세요.",by:""},
      ja:{title:"おすすめ",subPop:"いま人気",subRec:"ファンが推している",follow:"フォロー",following:"フォロー中",open:"プロフィールを開く",because:function(n){return n+"をフォローしているから";},pop:"ファンに人気",empty:"おすすめはまだありません — アーティストをフォローしてみて。",by:""},
      zh:{title:"为你推荐",subPop:"现在最热",subRec:"粉丝也在追",follow:"关注",following:"已关注",open:"查看资料",because:function(n){return "因为你关注了 "+n;},pop:"粉丝热议",empty:"暂无推荐 — 先关注一位艺人吧。",by:""},
      es:{title:"Para ti",subPop:"Popular ahora",subRec:"Los fans también siguen",follow:"Seguir",following:"Siguiendo",open:"Abrir perfil",because:function(n){return "Porque sigues a "+n;},pop:"Tendencia entre fans",empty:"Aún no hay recomendaciones — sigue a un artista para empezar.",by:"por"},
      fr:{title:"Pour vous",subPop:"Populaire maintenant",subRec:"Les fans suivent aussi",follow:"Suivre",following:"Suivi",open:"Ouvrir le profil",because:function(n){return "Parce que vous suivez "+n;},pop:"Tendance chez les fans",empty:"Pas encore de recommandations — suivez un artiste pour commencer.",by:"par"},
      de:{title:"Für dich",subPop:"Gerade beliebt",subRec:"Fans stannen auch",follow:"Folgen",following:"Folge ich",open:"Profil öffnen",because:function(n){return "Weil du "+n+" folgst";},pop:"Beliebt bei Fans",empty:"Noch keine Empfehlungen — folge einem Act, um zu starten.",by:"von"},
      pt:{title:"Para você",subPop:"Popular agora",subRec:"Fãs também staneiam",follow:"Seguir",following:"Seguindo",open:"Abrir perfil",because:function(n){return "Porque você segue "+n;},pop:"Em alta com os fãs",empty:"Ainda sem recomendações — siga um artista para começar.",by:"por"},
      id:{title:"Untukmu",subPop:"Lagi populer",subRec:"Fans juga nge-stan",follow:"Ikuti",following:"Diikuti",open:"Buka profil",because:function(n){return "Karena kamu mengikuti "+n;},pop:"Tren di kalangan fans",empty:"Belum ada rekomendasi — ikuti artis untuk memulai.",by:"oleh"}
    };
    var T=I18N[L]||I18N.en;

    function roster(){var r=window.KPOP_ROSTER; return (r&&r.length)?r.slice():[];}
    function readFollows(){try{var a=JSON.parse(localStorage.getItem("kp_kpop_follow")||"[]"); return (a&&a.length)?a:[];}catch(e){return [];}}
    function byId(){var m={},r=roster(),i; for(i=0;i<r.length;i++){if(r[i]&&r[i].id) m[r[i].id]=r[i];} return m;}

    function normGender(g){ if(!g) return ""; g=(""+g).toLowerCase(); if(g==="girl"||g==="female") return "f"; if(g==="boy"||g==="male") return "m"; return g; }
    function decade(deb){ if(!deb) return null; var y=parseInt((""+deb).slice(0,4),10); if(!y||isNaN(y)) return null; return Math.floor(y/10)*10; }
    function debutTs(deb){ if(!deb) return 0; var t=Date.parse(deb); return isNaN(t)?0:t; }

    function esc(s){ return (""+(s==null?"":s)).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];}); }
    function aName(a){ return (L==="ko"&&a.nameKo)?a.nameKo:(a.nameEn||a.nameKo||a.id); }

    // Curated "popular" pool (ids) — rotates by date when user follows nobody.
    var POP_POOL=["newjeans","blackpink","twice","aespa","ive","bts","stray-kids","seventeen","le-sserafim","g-idle","txt","itzy","enhypen","nct-dream","riize"];
    function popularSet(map){
      var pool=[],i,id;
      for(i=0;i<POP_POOL.length;i++){ id=POP_POOL[i]; if(map[id]) pool.push(map[id]); }
      if(!pool.length){ // fallback: newest debuts
        pool=roster().filter(function(a){return a&&a.id;}).sort(function(a,b){return debutTs(b.debut)-debutTs(a.debut);});
      }
      var d=new Date();
      var seed=d.getFullYear()*1000+(d.getMonth()*31+d.getDate()); // changes daily
      var off=pool.length?(seed%pool.length):0;
      var out=[],n=Math.min(6,pool.length);
      for(i=0;i<n;i++){ out.push({a:pool[(off+i)%pool.length],reason:null}); }
      return out;
    }

    function recommend(){
      var map=byId(), follows=readFollows(), i, j;
      // resolve followed artist objects
      var followed=[]; for(i=0;i<follows.length;i++){ if(map[follows[i]]) followed.push(map[follows[i]]); }
      if(!followed.length) return {mode:"pop", items:popularSet(map)};

      var followSet={}; for(i=0;i<follows.length;i++) followSet[follows[i]]=1;
      var all=roster(), scored=[];
      for(i=0;i<all.length;i++){
        var c=all[i]; if(!c||!c.id||followSet[c.id]) continue;
        var best=0, bestSrc=null, cDec=decade(c.debut), cGen=normGender(c.gender);
        var cGenres={}; if(c.genres&&c.genres.length){ for(j=0;j<c.genres.length;j++) cGenres[(""+c.genres[j]).toLowerCase()]=1; }
        var sc=0;
        for(j=0;j<followed.length;j++){
          var f=followed[j], pts=0;
          if(f.agency&&c.agency&&f.agency===c.agency) pts+=3;
          if(cDec!=null&&decade(f.debut)===cDec) pts+=2;
          if(cGen&&normGender(f.gender)===cGen) pts+=1;
          if(f.genres&&f.genres.length){ for(var k=0;k<f.genres.length;k++){ if(cGenres[(""+f.genres[k]).toLowerCase()]){ pts+=1; break; } } }
          sc+=pts;
          if(pts>best){ best=pts; bestSrc=f; }
        }
        if(sc>0) scored.push({a:c, score:sc, src:bestSrc});
      }
      scored.sort(function(x,y){ if(y.score!==x.score) return y.score-x.score; return debutTs(y.a.debut)-debutTs(x.a.debut); });
      var items=[];
      for(i=0;i<scored.length&&items.length<6;i++){
        items.push({a:scored[i].a, reason:scored[i].src?T.because(aName(scored[i].src)):null});
      }
      // top-up with popular (not followed, not already shown) if sparse
      if(items.length<6){
        var have={}; for(i=0;i<items.length;i++) have[items[i].a.id]=1;
        var pop=popularSet(map);
        for(i=0;i<pop.length&&items.length<6;i++){ var pa=pop[i].a; if(pa&&pa.id&&!followSet[pa.id]&&!have[pa.id]){ have[pa.id]=1; items.push({a:pa,reason:null}); } }
      }
      return {mode:"rec", items:items};
    }

    function ensureCss(){
      if(document.getElementById("kpp-"+FK+"-css")) return;
      var st=document.createElement("style"); st.id="kpp-"+FK+"-css";
      st.textContent=
      '.kpp-recs{background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:16px;padding:16px 18px;margin-bottom:16px}'+
      '.kpp-recs__hd{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:0 0 12px}'+
      '.kpp-recs__t{font-size:15px;font-weight:900;color:var(--text,#fff);margin:0;line-height:1.2}'+
      '.kpp-recs__sub{font-size:12px;font-weight:700;color:var(--text3,#8a93a0)}'+
      '.kpp-recs__grid{display:grid;grid-template-columns:1fr;gap:10px}'+
      '@media(min-width:560px){.kpp-recs__grid{grid-template-columns:1fr 1fr}}'+
      '.kpp-recs__c{display:flex;align-items:center;gap:11px;background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:14px;padding:10px 11px;min-width:0}'+
      '.kpp-recs__open{display:flex;align-items:center;gap:11px;flex:1 1 auto;min-width:0;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left;color:inherit;font:inherit}'+
      '.kpp-recs__em{flex:0 0 auto;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:21px;background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.12))}'+
      '.kpp-recs__meta{min-width:0;flex:1 1 auto}'+
      '.kpp-recs__nm{font-size:14px;font-weight:800;color:var(--text,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.25}'+
      '.kpp-recs__ag{font-size:11.5px;color:var(--text2,#aab);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3}'+
      '.kpp-recs__why{font-size:11px;color:var(--text3,#8a93a0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.35;margin-top:1px}'+
      '.kpp-recs__open:hover .kpp-recs__nm{text-decoration:underline}'+
      '.kpp-recs__open:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:3px;border-radius:10px}'+
      '.kpp-recs__fl{flex:0 0 auto;border:0;cursor:pointer;font-size:12px;font-weight:800;color:#fff;background:var(--kp-grad,linear-gradient(135deg,#ff2e74,#9b4dff));border-radius:999px;padding:7px 13px;line-height:1;transition:transform .12s ease,opacity .12s ease}'+
      '.kpp-recs__fl:hover{transform:translateY(-1px)}'+
      '.kpp-recs__fl:focus-visible{outline:2px solid var(--text,#fff);outline-offset:2px}'+
      '.kpp-recs__fl.is-on{background:transparent;color:var(--text2,#aab);border:1px solid var(--border,rgba(255,255,255,.12))}'+
      '.kpp-recs__empty{font-size:13px;color:var(--text2,#aab);padding:6px 2px}'+
      '@media(prefers-reduced-motion:reduce){.kpp-recs__fl{transition:none}.kpp-recs__fl:hover{transform:none}}';
      document.head.appendChild(st);
    }

    function setFollow(id,on){
      var arr=readFollows(), idx=arr.indexOf(id), changed=false;
      if(on&&idx<0){ arr.push(id); changed=true; }
      else if(!on&&idx>=0){ arr.splice(idx,1); changed=true; }
      if(changed){
        try{ localStorage.setItem("kp_kpop_follow",JSON.stringify(arr)); }catch(e){}
        window.dispatchEvent(new Event("kp:follows"));
      }
    }

    function openArtist(id){
      if(typeof window.kpOpenArtist==="function"){ try{ window.kpOpenArtist(id); return; }catch(e){} }
      try{ window.location.href=pf(id); }catch(e){}
    }

    var root=null;
    function render(){
      ensureCss();
      var data=recommend(), follows=readFollows(), followSet={},i;
      for(i=0;i<follows.length;i++) followSet[follows[i]]=1;

      if(!root){ root=document.createElement("section"); root.className="kpp-recs"; root.setAttribute("aria-label",T.title); mount.appendChild(root); }
      // build
      var html='<div class="kpp-recs__hd"><h3 class="kpp-recs__t">'+esc(T.title)+'</h3>'+
               '<span class="kpp-recs__sub">'+esc(data.mode==="pop"?T.subPop:T.subRec)+'</span></div>';

      if(!data.items.length){
        html+='<div class="kpp-recs__empty">'+esc(T.empty)+'</div>';
        root.innerHTML=html; return;
      }

      html+='<div class="kpp-recs__grid">';
      for(i=0;i<data.items.length;i++){
        var it=data.items[i], a=it.a; if(!a||!a.id) continue;
        var nm=aName(a), on=!!followSet[a.id];
        var why=it.reason||(data.mode==="pop"?T.pop:"");
        html+='<div class="kpp-recs__c">'+
          '<button type="button" class="kpp-recs__open" data-open="'+esc(a.id)+'" aria-label="'+esc(T.open+": "+nm)+'">'+
            '<span class="kpp-recs__em" aria-hidden="true">'+esc(a.emoji||"🎵")+'</span>'+
            '<span class="kpp-recs__meta">'+
              '<span class="kpp-recs__nm">'+esc(nm)+'</span>'+
              (a.agency?'<span class="kpp-recs__ag">'+esc(a.agency)+'</span>':'')+
              (why?'<span class="kpp-recs__why">'+esc(why)+'</span>':'')+
            '</span>'+
          '</button>'+
          '<button type="button" class="kpp-recs__fl'+(on?' is-on':'')+'" data-follow="'+esc(a.id)+'" aria-pressed="'+(on?'true':'false')+'" aria-label="'+esc((on?T.following:T.follow)+": "+nm)+'">'+
            esc(on?T.following:T.follow)+'</button>'+
        '</div>';
      }
      html+='</div>';
      root.innerHTML=html;
    }

    // delegated events (bound once)
    mount.addEventListener("click",function(ev){
      var t=ev.target, ob, fb;
      ob=t.closest?t.closest("[data-open]"):null;
      fb=t.closest?t.closest("[data-follow]"):null;
      if(fb){ ev.preventDefault(); var fid=fb.getAttribute("data-follow"); var on=fb.getAttribute("aria-pressed")==="true"; setFollow(fid,!on); return; }
      if(ob){ ev.preventDefault(); openArtist(ob.getAttribute("data-open")); }
    });

    var raf=null;
    function schedule(){ if(raf) return; raf=(window.requestAnimationFrame||function(f){return setTimeout(f,16);})(function(){ raf=null; try{ render(); }catch(e){} }); }
    window.addEventListener("kp:follows",schedule);
    window.addEventListener("kp:view",schedule);

    render();
  }catch(e){ /* never throw */ }
})();

/* ===== recent: Recently-viewed artist rail (adapts e-commerce "recently viewed" product rails): a hidden-until-populated, scroll-snapping horizontal rail u ===== */
(function(){"use strict";
try{
var MOUNT="#kpop-foryou";
var mount=document.querySelector(MOUNT);
if(!mount) return;
if(mount.getAttribute("data-kpp-recent")==="1") return;
mount.setAttribute("data-kpp-recent","1");

var SUP=["en","ko","ja","zh","es","fr","de","pt","id"];
var L=(localStorage.getItem("kp_lang")||(navigator.language||"en").slice(0,2)||"en").toLowerCase();
if(SUP.indexOf(L)<0) L="en";

var I18N={
en:{title:"Recently viewed",sub:"Pick up where you left off",clear:"Clear",clearAria:"Clear recently viewed",open:"Open profile of "},
ko:{title:"최근 본 아티스트",sub:"보던 곳에서 이어보기",clear:"지우기",clearAria:"최근 본 목록 지우기",open:"프로필 열기: "},
ja:{title:"最近見たアーティスト",sub:"続きをチェック",clear:"消去",clearAria:"最近見た一覧を消去",open:"プロフィールを開く: "},
zh:{title:"最近浏览",sub:"继续上次的浏览",clear:"清除",clearAria:"清除最近浏览",open:"打开资料: "},
es:{title:"Vistos recientemente",sub:"Continúa donde lo dejaste",clear:"Borrar",clearAria:"Borrar vistos recientemente",open:"Abrir perfil de "},
fr:{title:"Vus récemment",sub:"Reprenez où vous en étiez",clear:"Effacer",clearAria:"Effacer les vus récemment",open:"Ouvrir le profil de "},
de:{title:"Zuletzt angesehen",sub:"Mach da weiter, wo du warst",clear:"Leeren",clearAria:"Zuletzt angesehen leeren",open:"Profil öffnen von "},
pt:{title:"Vistos recentemente",sub:"Continue de onde parou",clear:"Limpar",clearAria:"Limpar vistos recentemente",open:"Abrir perfil de "},
id:{title:"Baru dilihat",sub:"Lanjutkan dari sebelumnya",clear:"Hapus",clearAria:"Hapus baru dilihat",open:"Buka profil "}
};
var t=function(k){var o=I18N[L]||I18N.en;return (o&&o[k]!=null)?o[k]:(I18N.en[k]||"");};

var KEY="kpp_recent";
var CAP=12;

var pf=function(id){var x=SUP.indexOf(L)>=0?L:"en";return (x==="en"?"":x+"/")+"kpop/"+id+"-profile";};

var roster=(window.KPOP_ROSTER&&window.KPOP_ROSTER.length)?window.KPOP_ROSTER:[];
var byId={};
for(var i=0;i<roster.length;i++){var a=roster[i];if(a&&a.id!=null)byId[a.id]=a;}

var readList=function(){
  var arr=[];
  try{var raw=JSON.parse(localStorage.getItem(KEY)||"[]");if(Object.prototype.toString.call(raw)==="[object Array]")arr=raw;}catch(e){arr=[];}
  var seen={},out=[];
  for(var j=0;j<arr.length;j++){var id=arr[j];if(id==null)continue;id=String(id);if(seen[id])continue;if(!byId[id])continue;seen[id]=1;out.push(id);if(out.length>=CAP)break;}
  return out;
};
var writeList=function(list){try{localStorage.setItem(KEY,JSON.stringify(list.slice(0,CAP)));}catch(e){}};

var pushId=function(id){
  if(id==null)return;id=String(id);
  if(!byId[id])return;
  var list=readList();
  var out=[id];
  for(var j=0;j<list.length;j++){if(list[j]!==id){out.push(list[j]);if(out.length>=CAP)break;}}
  writeList(out);
  render();
};

var SID="kpp-recent-css";
if(!document.getElementById(SID)){
  var st=document.createElement("style");st.id=SID;
  st.textContent=
  ".kpp-recent{background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:16px;padding:16px 18px;margin-bottom:16px;}"+
  ".kpp-recent__head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;}"+
  ".kpp-recent__tt{min-width:0;}"+
  ".kpp-recent__title{font-size:15px;font-weight:900;color:var(--text,#fff);line-height:1.2;}"+
  ".kpp-recent__sub{font-size:12px;color:var(--text3,#8a93a0);margin-top:2px;}"+
  ".kpp-recent__clear{flex:none;background:transparent;border:1px solid var(--border,rgba(255,255,255,.12));color:var(--text2,#aab);font-size:12px;font-weight:700;padding:6px 12px;border-radius:999px;cursor:pointer;transition:background .15s,color .15s,border-color .15s;}"+
  ".kpp-recent__clear:hover{background:var(--bg,#0c0c14);color:var(--text,#fff);}"+
  ".kpp-recent__clear:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px;}"+
  ".kpp-recent__rail{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:2px 2px 6px;margin:0 -2px;scrollbar-width:thin;}"+
  ".kpp-recent__rail::-webkit-scrollbar{height:6px;}"+
  ".kpp-recent__rail::-webkit-scrollbar-thumb{background:var(--border,rgba(255,255,255,.12));border-radius:999px;}"+
  ".kpp-recent__chip{scroll-snap-align:start;flex:0 0 auto;display:flex;align-items:center;gap:8px;background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:14px;padding:9px 13px 9px 11px;cursor:pointer;color:var(--text,#fff);max-width:200px;transition:transform .15s,border-color .15s;}"+
  ".kpp-recent__chip:hover{border-color:var(--accent,#ff2e74);transform:translateY(-2px);}"+
  ".kpp-recent__chip:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px;}"+
  ".kpp-recent__emoji{font-size:20px;line-height:1;flex:none;}"+
  ".kpp-recent__nm{min-width:0;text-align:left;line-height:1.15;}"+
  ".kpp-recent__n1{font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;}"+
  ".kpp-recent__n2{font-size:11px;color:var(--text3,#8a93a0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;}"+
  "@media (prefers-reduced-motion: reduce){.kpp-recent__chip,.kpp-recent__clear{transition:none;}.kpp-recent__chip:hover{transform:none;}}";
  (document.head||document.documentElement).appendChild(st);
}

var card=document.createElement("section");
card.className="kpp-recent";
card.style.display="none";
card.setAttribute("aria-label",t("title"));
mount.appendChild(card);

var openArtist=function(id){
  try{
    if(typeof window.kpOpenArtist==="function"){window.kpOpenArtist(id);return;}
  }catch(e){}
  try{window.location.href=pf(id);}catch(e2){}
};

var render=function(){
  var list=readList();
  if(!list.length){card.style.display="none";card.innerHTML="";return;}
  card.style.display="";
  card.innerHTML="";

  var head=document.createElement("div");head.className="kpp-recent__head";
  var tt=document.createElement("div");tt.className="kpp-recent__tt";
  var h=document.createElement("div");h.className="kpp-recent__title";h.textContent=t("title");
  var s=document.createElement("div");s.className="kpp-recent__sub";s.textContent=t("sub");
  tt.appendChild(h);tt.appendChild(s);

  var clr=document.createElement("button");
  clr.type="button";clr.className="kpp-recent__clear";clr.textContent=t("clear");
  clr.setAttribute("aria-label",t("clearAria"));
  clr.addEventListener("click",function(){writeList([]);render();});

  head.appendChild(tt);head.appendChild(clr);
  card.appendChild(head);

  var rail=document.createElement("div");rail.className="kpp-recent__rail";
  rail.setAttribute("role","list");

  for(var k=0;k<list.length;k++){
    (function(id){
      var a=byId[id];if(!a)return;
      var nm1=a.nameEn||a.nameKo||id;
      var nm2=(L==="ko")?(a.nameKo||""):(a.nameKo&&a.nameKo!==nm1?a.nameKo:"");
      var b=document.createElement("button");
      b.type="button";b.className="kpp-recent__chip";b.setAttribute("role","listitem");
      b.setAttribute("aria-label",t("open")+nm1);
      var em=document.createElement("span");em.className="kpp-recent__emoji";em.setAttribute("aria-hidden","true");em.textContent=a.emoji||"⭐";
      var wrap=document.createElement("span");wrap.className="kpp-recent__nm";
      var l1=document.createElement("span");l1.className="kpp-recent__n1";l1.textContent=nm1;
      wrap.appendChild(l1);
      if(nm2){var l2=document.createElement("span");l2.className="kpp-recent__n2";l2.textContent=nm2;wrap.appendChild(l2);}
      b.appendChild(em);b.appendChild(wrap);
      b.addEventListener("click",function(){openArtist(id);});
      rail.appendChild(b);
    })(list[k]);
  }
  card.appendChild(rail);
};

window.addEventListener("kp:view",function(e){try{var id=(e&&e.detail!=null)?e.detail:null;if(id!=null)pushId(id);}catch(err){}});

render();
}catch(globalErr){}
})();

/* ===== reminders: Comeback & birthday reminders card mounted at #kpop-foryou: computes each act's next debut anniversary, member birthdays (KPOP_ENRICH) withi ===== */
(function(){ "use strict";
try{
  var MOUNT="#kpop-foryou";
  var mount=document.querySelector(MOUNT);
  if(!mount) return;
  if(mount.getAttribute("data-kpp-reminders")==="1") return;
  mount.setAttribute("data-kpp-reminders","1");

  var SUPPORTED=["en","ko","ja","zh","es","fr","de","pt","id"];
  var L=(localStorage.getItem("kp_lang")||(navigator.language||"en").slice(0,2)||"en").toLowerCase();
  if(SUPPORTED.indexOf(L)<0) L="en";

  var I18N={
    en:{title:"Upcoming reminders",sub:"Comebacks, anniversaries & birthdays",add:"Add to calendar",bellOn:"Reminder on",bellOff:"Set reminder",today:"Today!",tomorrow:"Tomorrow",dleft:"%d days",empty:"No upcoming events right now. Check back soon!",anniv:"%n debut anniversary",annivN:"%n %y debut anniversary",bday:"%m birthday (%n)",open:"Open %n",dl:"Download .ics for %t"},
    ko:{title:"다가오는 알림",sub:"컴백·데뷔기념일·생일",add:"캘린더에 추가",bellOn:"알림 켜짐",bellOff:"알림 설정",today:"오늘!",tomorrow:"내일",dleft:"%d일",empty:"지금은 예정된 일정이 없어요. 곧 다시 확인해 주세요!",anniv:"%n 데뷔 기념일",annivN:"%n 데뷔 %y주년",bday:"%m 생일 (%n)",open:"%n 열기",dl:"%t .ics 다운로드"},
    ja:{title:"今後のリマインダー",sub:"カムバック・デビュー記念日・誕生日",add:"カレンダーに追加",bellOn:"通知オン",bellOff:"リマインダー設定",today:"今日！",tomorrow:"明日",dleft:"あと%d日",empty:"今のところ予定はありません。またチェックしてね！",anniv:"%n デビュー記念日",annivN:"%n デビュー%y周年",bday:"%m の誕生日 (%n)",open:"%n を開く",dl:"%t の.icsをダウンロード"},
    zh:{title:"即将到来的提醒",sub:"回归·出道纪念·生日",add:"添加到日历",bellOn:"提醒已开",bellOff:"设置提醒",today:"就在今天！",tomorrow:"明天",dleft:"%d天后",empty:"目前没有即将到来的日程，请稍后再来看看！",anniv:"%n 出道纪念日",annivN:"%n 出道%y周年",bday:"%m 生日 (%n)",open:"打开 %n",dl:"下载 %t 的.ics"},
    es:{title:"Próximos recordatorios",sub:"Comebacks, aniversarios y cumpleaños",add:"Añadir al calendario",bellOn:"Recordatorio activo",bellOff:"Crear recordatorio",today:"¡Hoy!",tomorrow:"Mañana",dleft:"%d días",empty:"No hay eventos próximos por ahora. ¡Vuelve pronto!",anniv:"Aniversario del debut de %n",annivN:"%y.º aniversario del debut de %n",bday:"Cumpleaños de %m (%n)",open:"Abrir %n",dl:"Descargar .ics de %t"},
    fr:{title:"Rappels à venir",sub:"Comebacks, anniversaires de débuts et dates de naissance",add:"Ajouter au calendrier",bellOn:"Rappel activé",bellOff:"Créer un rappel",today:"Aujourd'hui !",tomorrow:"Demain",dleft:"%d jours",empty:"Aucun événement à venir pour le moment. Revenez bientôt !",anniv:"Anniversaire de début de %n",annivN:"%n — %y ans de carrière",bday:"Anniversaire de %m (%n)",open:"Ouvrir %n",dl:"Télécharger le .ics de %t"},
    de:{title:"Anstehende Erinnerungen",sub:"Comebacks, Debüt-Jubiläen & Geburtstage",add:"Zum Kalender hinzufügen",bellOn:"Erinnerung an",bellOff:"Erinnerung setzen",today:"Heute!",tomorrow:"Morgen",dleft:"%d Tage",empty:"Aktuell keine anstehenden Events. Schau bald wieder vorbei!",anniv:"%n Debüt-Jubiläum",annivN:"%n %y. Debüt-Jubiläum",bday:"%m Geburtstag (%n)",open:"%n öffnen",dl:".ics für %t herunterladen"},
    pt:{title:"Lembretes futuros",sub:"Comebacks, aniversários de estreia e de nascimento",add:"Adicionar ao calendário",bellOn:"Lembrete ativo",bellOff:"Criar lembrete",today:"Hoje!",tomorrow:"Amanhã",dleft:"%d dias",empty:"Nenhum evento próximo no momento. Volte em breve!",anniv:"Aniversário de estreia de %n",annivN:"%n %y anos de estreia",bday:"Aniversário de %m (%n)",open:"Abrir %n",dl:"Baixar .ics de %t"},
    id:{title:"Pengingat mendatang",sub:"Comeback, anniversary debut & ulang tahun",add:"Tambah ke kalender",bellOn:"Pengingat aktif",bellOff:"Atur pengingat",today:"Hari ini!",tomorrow:"Besok",dleft:"%d hari",empty:"Belum ada acara mendatang. Cek lagi nanti ya!",anniv:"Anniversary debut %n",annivN:"Anniversary debut ke-%y %n",bday:"Ulang tahun %m (%n)",open:"Buka %n",dl:"Unduh .ics untuk %t"}
  };
  var T=I18N[L]||I18N.en;
  function t(k){var v=(T&&T[k])||I18N.en[k]||k;return v;}
  function fill(s,map){s=String(s||"");for(var k in map){if(map.hasOwnProperty(k))s=s.split(k).join(map[k]);}return s;}

  var pf=function(id){var x=SUPPORTED.indexOf(L)>=0?L:"en";return (x==="en"?"":x+"/")+"kpop/"+id+"-profile";};

  function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

  function readJSON(key,def){try{var v=JSON.parse(localStorage.getItem(key)||"null");return v==null?def:v;}catch(e){return def;}}
  function remindSet(){return readJSON("kpp_remind",{});}
  function remindWrite(o){try{localStorage.setItem("kpp_remind",JSON.stringify(o));}catch(e){}}

  // ── Date helpers (local time, midnight-anchored to avoid DST drift) ──────
  function todayMid(){var n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate());}
  function mkLocal(y,m,d){return new Date(y,m-1,d);} // m 1-12
  function dayDiff(a,b){return Math.round((a.getTime()-b.getTime())/86400000);}
  // next occurrence of a MM-DD on/after today; handles year rollover + Feb 29
  function nextOccur(month,day){
    var today=todayMid(),y=today.getFullYear();
    function build(yy){
      var dd=day, mm=month;
      // clamp Feb 29 in non-leap years to Feb 28
      if(mm===2&&dd===29){var leap=((yy%4===0&&yy%100!==0)||yy%400===0);if(!leap)dd=28;}
      return mkLocal(yy,mm,dd);
    }
    var c=build(y);
    if(dayDiff(c,today)<0) c=build(y+1);
    return c;
  }
  function parseYMD(s){
    if(!s||typeof s!=="string")return null;
    var m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(!m)return null;
    var y=+m[1],mo=+m[2],d=+m[3];
    if(mo<1||mo>12||d<1||d>31)return null;
    return {y:y,m:mo,d:d};
  }
  function ord(n){if(L!=="en")return n+"";var s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}

  function rosterById(){
    var map={},r=(window.KPOP_ROSTER&&window.KPOP_ROSTER.length)?window.KPOP_ROSTER:[];
    for(var i=0;i<r.length;i++){if(r[i]&&r[i].id)map[r[i].id]=r[i];}
    return map;
  }
  function nameOf(a){if(!a)return "";return (L==="ko"&&a.nameKo)?a.nameKo:(a.nameEn||a.nameKo||a.id||"");}

  // ── Build the event list ────────────────────────────────────────────────
  function buildEvents(){
    var out=[],today=todayMid();
    var roster=(window.KPOP_ROSTER&&window.KPOP_ROSTER.length)?window.KPOP_ROSTER:[];
    var enrich=(window.KPOP_ENRICH&&typeof window.KPOP_ENRICH==="object")?window.KPOP_ENRICH:{};
    var byId=rosterById();
    var i,j;

    // 1) Debut anniversaries (recurring, always accurate)
    for(i=0;i<roster.length;i++){
      var a=roster[i];if(!a||!a.id)continue;
      var p=parseYMD(a.debut);if(!p)continue;
      var when=nextOccur(p.m,p.d);
      var diff=dayDiff(when,today);if(diff<0)continue;
      var yrs=when.getFullYear()-p.y;
      var label=yrs>0?fill(t("annivN"),{"%n":nameOf(a),"%y":ord(yrs)}):fill(t("anniv"),{"%n":nameOf(a)});
      out.push({kind:"anniv",id:"anniv-"+a.id,artistId:a.id,emoji:a.emoji||"🎉",label:label,date:when,diff:diff,
                icsTitle:nameOf(a)+" — "+fill(t("anniv"),{"%n":nameOf(a)})});
    }

    // 2) Member birthdays within next 60 days
    for(var aid in enrich){
      if(!enrich.hasOwnProperty(aid))continue;
      var e=enrich[aid];if(!e||!e.bdays||!e.bdays.length)continue;
      var art=byId[aid];
      for(j=0;j<e.bdays.length;j++){
        var row=e.bdays[j];if(!row||row.length<2)continue;
        var member=row[0],bp=parseYMD(row[1]);if(!bp)continue;
        var bw=nextOccur(bp.m,bp.d),bd=dayDiff(bw,today);
        if(bd<0||bd>60)continue;
        var anm=art?nameOf(art):aid;
        out.push({kind:"bday",id:"bday-"+aid+"-"+j,artistId:art?aid:null,emoji:(art&&art.emoji)||"🎂",
                  label:fill(t("bday"),{"%m":member,"%n":anm}),date:bw,diff:bd,
                  icsTitle:member+" ("+anm+") — Birthday"});
      }
    }

    // 3) Curated upcoming releases/tours
    var up=(window.KPOP_UPCOMING&&window.KPOP_UPCOMING.length)?window.KPOP_UPCOMING:[];
    for(i=0;i<up.length;i++){
      var u=up[i];if(!u)continue;
      var up2=parseYMD(u.date);if(!up2)continue;
      var uw=mkLocal(up2.y,up2.m,up2.d),ud=dayDiff(uw,today);
      if(ud<0)continue;
      var ua=u.artistId?byId[u.artistId]:null;
      var ut=u.title||(ua?nameOf(ua):"");
      var disp=(ua?nameOf(ua)+" — ":"")+ut;
      out.push({kind:"upcoming",id:"up-"+(u.artistId||"x")+"-"+i,artistId:u.artistId&&ua?u.artistId:null,
                emoji:(ua&&ua.emoji)||"🎵",label:disp,date:uw,diff:ud,icsTitle:disp});
    }

    out.sort(function(x,y){
      if(x.diff!==y.diff)return x.diff-y.diff;
      return (x.label<y.label?-1:x.label>y.label?1:0);
    });
    return out.slice(0,6);
  }

  function countdownText(diff){
    if(diff<=0)return t("today");
    if(diff===1)return t("tomorrow");
    return fill(t("dleft"),{"%d":diff});
  }

  // ── ICS generation ──────────────────────────────────────────────────────
  function pad(n){return n<10?"0"+n:""+n;}
  function icsDate(d){return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate());}
  function icsStamp(){
    var n=new Date();
    return n.getUTCFullYear()+pad(n.getUTCMonth()+1)+pad(n.getUTCDate())+"T"+pad(n.getUTCHours())+pad(n.getUTCMinutes())+pad(n.getUTCSeconds())+"Z";
  }
  function icsEscape(s){return String(s||"").replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n");}
  function foldLine(line){
    // RFC5545 75-octet folding (approx by char; safe for our content)
    if(line.length<=74)return line;
    var out=line.slice(0,74),rest=line.slice(74);
    while(rest.length){out+="\r\n "+rest.slice(0,73);rest=rest.slice(73);}
    return out;
  }
  function buildICS(ev){
    var start=ev.date, end=new Date(start.getFullYear(),start.getMonth(),start.getDate()+1);
    var uid=(ev.id||"kpp")+"-"+icsDate(start)+"@koreaplus";
    var lines=[
      "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//KoreaPlus//K-pop Reminders//EN",
      "CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",
      "UID:"+uid,"DTSTAMP:"+icsStamp(),
      "DTSTART;VALUE=DATE:"+icsDate(start),"DTEND;VALUE=DATE:"+icsDate(end),
      "SUMMARY:"+icsEscape(ev.emoji+" "+ev.icsTitle),
      "DESCRIPTION:"+icsEscape((T.title||"K-pop reminder")),
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM","TRIGGER:-P1D","ACTION:DISPLAY","DESCRIPTION:"+icsEscape(ev.emoji+" "+ev.icsTitle),"END:VALARM",
      "END:VEVENT","END:VCALENDAR"
    ];
    return lines.map(foldLine).join("\r\n");
  }
  function downloadICS(ev){
    try{
      var ics=buildICS(ev);
      var blob=new Blob([ics],{type:"text/calendar;charset=utf-8"});
      var url=URL.createObjectURL(blob);
      var a=document.createElement("a");
      a.href=url;
      a.download=(ev.id||"kpop-event").replace(/[^a-z0-9_-]/gi,"_")+".ics";
      document.body.appendChild(a);a.click();
      setTimeout(function(){try{document.body.removeChild(a);URL.revokeObjectURL(url);}catch(e){}},120);
    }catch(e){}
  }

  // ── CSS (inject once) ───────────────────────────────────────────────────
  function injectCSS(){
    if(document.getElementById("kpp-reminders-css"))return;
    var s=document.createElement("style");
    s.id="kpp-reminders-css";
    s.textContent=
    ".kpp-rem{background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:16px;padding:16px 18px;margin-bottom:16px}"+
    ".kpp-rem-h{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:0 0 12px}"+
    ".kpp-rem-h h3{font-size:15px;font-weight:900;margin:0;color:var(--text,#fff);letter-spacing:-.01em}"+
    ".kpp-rem-h .kpp-rem-sub{font-size:12px;color:var(--text3,#8a93a0);font-weight:600}"+
    ".kpp-rem-list{display:flex;flex-direction:column;gap:8px}"+
    ".kpp-rem-row{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--border,rgba(255,255,255,.12));border-radius:12px;background:var(--bg,#0c0c14)}"+
    ".kpp-rem-emoji{font-size:22px;line-height:1;flex:0 0 auto;width:30px;text-align:center}"+
    ".kpp-rem-main{flex:1 1 auto;min-width:0}"+
    ".kpp-rem-name{display:block;width:100%;text-align:left;background:none;border:0;padding:0;margin:0;color:var(--text,#fff);font-size:13px;font-weight:700;line-height:1.3;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"+
    ".kpp-rem-name:hover,.kpp-rem-name:focus-visible{color:var(--accent,#ff2e74);text-decoration:underline;outline:none}"+
    ".kpp-rem-cd{display:inline-block;margin-top:3px;font-size:11px;font-weight:800;color:var(--text2,#aab)}"+
    ".kpp-rem-cd b{background:var(--kp-grad,linear-gradient(90deg,#ff2e74,#b14bff));-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}"+
    ".kpp-rem-act{display:flex;gap:6px;flex:0 0 auto;align-items:center}"+
    ".kpp-rem-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;border:1px solid var(--border,rgba(255,255,255,.12));background:var(--surface,#15151f);color:var(--text2,#aab);border-radius:9px;cursor:pointer;font-size:12px;font-weight:700;padding:7px 9px;line-height:1;min-height:34px;min-width:34px}"+
    ".kpp-rem-btn:hover,.kpp-rem-btn:focus-visible{color:var(--text,#fff);border-color:var(--accent,#ff2e74);outline:none}"+
    ".kpp-rem-cal{background:var(--kp-grad,linear-gradient(90deg,#ff2e74,#b14bff));color:#fff;border-color:transparent}"+
    ".kpp-rem-cal:hover,.kpp-rem-cal:focus-visible{color:#fff;filter:brightness(1.08)}"+
    ".kpp-rem-cal-txt{display:none}"+
    ".kpp-rem-bell.on{color:var(--accent,#ff2e74);border-color:var(--accent,#ff2e74)}"+
    ".kpp-rem-bell.on .kpp-rem-bellico{animation:kpp-rem-ring .9s ease}"+
    ".kpp-rem-empty{font-size:13px;color:var(--text3,#8a93a0);padding:8px 2px;line-height:1.5}"+
    "@keyframes kpp-rem-ring{0%,100%{transform:rotate(0)}20%{transform:rotate(16deg)}40%{transform:rotate(-12deg)}60%{transform:rotate(8deg)}80%{transform:rotate(-4deg)}}"+
    "@media (min-width:420px){.kpp-rem-cal-txt{display:inline}}"+
    "@media (prefers-reduced-motion:reduce){.kpp-rem-bell.on .kpp-rem-bellico{animation:none}}";
    (document.head||document.documentElement).appendChild(s);
  }

  // ── Render ──────────────────────────────────────────────────────────────
  var card=null;
  function render(){
    if(!card)return;
    var events=buildEvents();
    var remind=remindSet();
    var html="";
    html+='<div class="kpp-rem-h"><h3>'+esc(t("title"))+'</h3><span class="kpp-rem-sub">'+esc(t("sub"))+'</span></div>';
    if(!events.length){
      html+='<div class="kpp-rem-empty">'+esc(t("empty"))+'</div>';
      card.innerHTML=html;
      return;
    }
    html+='<div class="kpp-rem-list">';
    for(var i=0;i<events.length;i++){
      var ev=events[i];
      var on=!!remind[ev.id];
      var nameTag=ev.artistId
        ? '<button type="button" class="kpp-rem-name" data-act="open" data-id="'+esc(ev.artistId)+'" aria-label="'+esc(fill(t("open"),{"%n":ev.label}))+'">'+esc(ev.label)+'</button>'
        : '<span class="kpp-rem-name" style="cursor:default">'+esc(ev.label)+'</span>';
      html+='<div class="kpp-rem-row">'+
        '<span class="kpp-rem-emoji" aria-hidden="true">'+esc(ev.emoji)+'</span>'+
        '<span class="kpp-rem-main">'+nameTag+
          '<span class="kpp-rem-cd"><b>'+esc(countdownText(ev.diff))+'</b></span>'+
        '</span>'+
        '<span class="kpp-rem-act">'+
          '<button type="button" class="kpp-rem-btn kpp-rem-bell'+(on?' on':'')+'" data-act="bell" data-ridx="'+i+'" aria-pressed="'+(on?'true':'false')+'" aria-label="'+esc(on?t("bellOn"):t("bellOff"))+'" title="'+esc(on?t("bellOn"):t("bellOff"))+'"><span class="kpp-rem-bellico" aria-hidden="true">'+(on?'🔔':'🔕')+'</span></button>'+
          '<button type="button" class="kpp-rem-btn kpp-rem-cal" data-act="cal" data-ridx="'+i+'" aria-label="'+esc(fill(t("dl"),{"%t":ev.icsTitle}))+'" title="'+esc(t("add"))+'"><span aria-hidden="true">📅</span><span class="kpp-rem-cal-txt">'+esc(t("add"))+'</span></button>'+
        '</span>'+
      '</div>';
    }
    html+='</div>';
    card.innerHTML=html;
    card._kppEvents=events;
  }

  function onClick(e){
    var btn=e.target.closest?e.target.closest("[data-act]"):null;
    if(!btn||!card.contains(btn))return;
    var act=btn.getAttribute("data-act");
    if(act==="open"){
      var id=btn.getAttribute("data-id");if(!id)return;
      e.preventDefault();
      if(typeof window.kpOpenArtist==="function"){try{window.kpOpenArtist(id);return;}catch(err){}}
      try{window.location.href=pf(id);}catch(err){}
      return;
    }
    var idx=parseInt(btn.getAttribute("data-ridx"),10);
    var events=card._kppEvents||[];
    var ev=events[idx];if(!ev)return;
    if(act==="cal"){
      downloadICS(ev);
      return;
    }
    if(act==="bell"){
      var r=remindSet();
      if(r[ev.id])delete r[ev.id];else r[ev.id]=1;
      remindWrite(r);
      render(); // reflect toggle
      return;
    }
  }

  // ── Init ────────────────────────────────────────────────────────────────
  injectCSS();
  card=document.createElement("section");
  card.className="kpp-rem";
  card.setAttribute("aria-label",t("title"));
  mount.appendChild(card);
  card.addEventListener("click",onClick);
  render();

  // Re-render on relevant cross-feature events + day change while open
  function rerender(){try{render();}catch(e){}}
  window.addEventListener("kp:follows",rerender);
  window.addEventListener("kp:view",rerender);

  // keep countdowns fresh if the tab lives across midnight
  var lastDay=todayMid().getTime();
  var iv=setInterval(function(){
    var now=todayMid().getTime();
    if(now!==lastDay){lastDay=now;rerender();}
  },60000);
  window.addEventListener("pagehide",function(){try{clearInterval(iv);}catch(e){}});

}catch(e){ /* never throw */ }
})();

/* ===== compare: Group vs Group side-by-side compare card (debut/years-active, agency, members, fandom, lightstick, generation, genres) with pick/swap/random ===== */
(function(){
  "use strict";
  try {
    var MOUNT_SEL = "#kpop-foryou";
    var mount = document.querySelector(MOUNT_SEL);
    if (!mount) return;
    if (mount.getAttribute("data-kpp-compare") === "1") return;
    mount.setAttribute("data-kpp-compare", "1");

    var ROSTER = Array.isArray(window.KPOP_ROSTER) ? window.KPOP_ROSTER : [];
    var ENRICH = (window.KPOP_ENRICH && typeof window.KPOP_ENRICH === "object") ? window.KPOP_ENRICH : {};
    if (ROSTER.length < 2) return;

    var LANGS = ["en","ko","ja","zh","es","fr","de","pt","id"];
    var L = (localStorage.getItem("kp_lang") || (navigator.language || "en").slice(0,2) || "en").toLowerCase();
    if (LANGS.indexOf(L) < 0) L = "en";

    var I18N = {
      en: { title:"Group vs Group", sub:"Pick two and compare — just the facts.", vs:"VS", swap:"Swap", swapAria:"Swap the two sides", rand:"Shuffle", randAria:"Pick two random artists", pickAria:"Choose an artist", debut:"Debut", years:"Years active", agency:"Agency", members:"Members", fandom:"Fandom", lightstick:"Lightstick", gen:"Generation", genres:"Genres", profile:"View profile", yr:"yr", yrs:"yrs", solo:"Soloist", na:"—", memCount:function(n){return n+(n===1?" member":" members");} },
      ko: { title:"그룹 대 그룹", sub:"둘을 골라 비교 — 사실만.", vs:"VS", swap:"교체", swapAria:"양쪽 교체", rand:"랜덤", randAria:"무작위 두 팀 선택", pickAria:"아티스트 선택", debut:"데뷔", years:"활동 연수", agency:"소속사", members:"멤버", fandom:"팬덤", lightstick:"응원봉", gen:"세대", genres:"장르", profile:"프로필 보기", yr:"년", yrs:"년", solo:"솔로", na:"—", memCount:function(n){return n+"명";} },
      ja: { title:"グループ対決", sub:"2組を選んで比較 — 事実だけ。", vs:"VS", swap:"入替", swapAria:"左右を入れ替え", rand:"シャッフル", randAria:"ランダムに2組選ぶ", pickAria:"アーティストを選択", debut:"デビュー", years:"活動年数", agency:"事務所", members:"メンバー", fandom:"ファンダム", lightstick:"ペンライト", gen:"世代", genres:"ジャンル", profile:"プロフィール", yr:"年", yrs:"年", solo:"ソロ", na:"—", memCount:function(n){return n+"人";} },
      zh: { title:"团体对决", sub:"选两组来比较 — 只看事实。", vs:"VS", swap:"交换", swapAria:"交换两侧", rand:"随机", randAria:"随机选两组", pickAria:"选择艺人", debut:"出道", years:"出道年数", agency:"经纪公司", members:"成员", fandom:"粉丝名", lightstick:"应援棒", gen:"世代", genres:"曲风", profile:"查看简介", yr:"年", yrs:"年", solo:"solo歌手", na:"—", memCount:function(n){return n+"名成员";} },
      es: { title:"Grupo vs Grupo", sub:"Elige dos y compara — solo datos.", vs:"VS", swap:"Cambiar", swapAria:"Intercambiar los dos lados", rand:"Aleatorio", randAria:"Elegir dos artistas al azar", pickAria:"Elegir artista", debut:"Debut", years:"Años activos", agency:"Agencia", members:"Integrantes", fandom:"Fandom", lightstick:"Lightstick", gen:"Generación", genres:"Géneros", profile:"Ver perfil", yr:"año", yrs:"años", solo:"Solista", na:"—", memCount:function(n){return n+(n===1?" integrante":" integrantes");} },
      fr: { title:"Groupe vs Groupe", sub:"Choisissez-en deux et comparez — rien que des faits.", vs:"VS", swap:"Inverser", swapAria:"Inverser les deux côtés", rand:"Aléatoire", randAria:"Choisir deux artistes au hasard", pickAria:"Choisir un artiste", debut:"Débuts", years:"Années d'activité", agency:"Agence", members:"Membres", fandom:"Fandom", lightstick:"Lightstick", gen:"Génération", genres:"Genres", profile:"Voir le profil", yr:"an", yrs:"ans", solo:"Soliste", na:"—", memCount:function(n){return n+(n===1?" membre":" membres");} },
      de: { title:"Gruppe vs Gruppe", sub:"Zwei wählen und vergleichen — nur Fakten.", vs:"VS", swap:"Tauschen", swapAria:"Beide Seiten tauschen", rand:"Zufall", randAria:"Zwei Artists zufällig wählen", pickAria:"Artist wählen", debut:"Debüt", years:"Aktive Jahre", agency:"Agentur", members:"Mitglieder", fandom:"Fandom", lightstick:"Lightstick", gen:"Generation", genres:"Genres", profile:"Profil ansehen", yr:"Jahr", yrs:"Jahre", solo:"Solo", na:"—", memCount:function(n){return n+(n===1?" Mitglied":" Mitglieder");} },
      pt: { title:"Grupo vs Grupo", sub:"Escolha dois e compare — só os fatos.", vs:"VS", swap:"Trocar", swapAria:"Trocar os dois lados", rand:"Aleatório", randAria:"Escolher dois artistas ao acaso", pickAria:"Escolher artista", debut:"Estreia", years:"Anos de carreira", agency:"Agência", members:"Integrantes", fandom:"Fandom", lightstick:"Lightstick", gen:"Geração", genres:"Gêneros", profile:"Ver perfil", yr:"ano", yrs:"anos", solo:"Solo", na:"—", memCount:function(n){return n+(n===1?" integrante":" integrantes");} },
      id: { title:"Grup vs Grup", sub:"Pilih dua dan bandingkan — fakta saja.", vs:"VS", swap:"Tukar", swapAria:"Tukar kedua sisi", rand:"Acak", randAria:"Pilih dua artis acak", pickAria:"Pilih artis", debut:"Debut", years:"Tahun aktif", agency:"Agensi", members:"Member", fandom:"Fandom", lightstick:"Lightstick", gen:"Generasi", genres:"Genre", profile:"Lihat profil", yr:"thn", yrs:"thn", solo:"Solo", na:"—", memCount:function(n){return n+" member";} }
    };
    var T = I18N[L] || I18N.en;
    var tt = function(k){ return (T && T[k] != null) ? T[k] : (I18N.en[k] != null ? I18N.en[k] : k); };

    var esc = function(s){ return String(s==null?"":s).replace(/[&<>"']/g, function(c){ return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]; }); };

    var pf = function(id){
      var x = LANGS.indexOf(L) >= 0 ? L : "en";
      return (x === "en" ? "" : x + "/") + "kpop/" + id + "-profile";
    };
    var openArtist = function(id){
      try {
        if (typeof window.kpOpenArtist === "function") { window.kpOpenArtist(id); return; }
      } catch (e) {}
      try { window.location.href = pf(id); } catch (e2) {}
    };

    var byId = {};
    for (var i = 0; i < ROSTER.length; i++){ if (ROSTER[i] && ROSTER[i].id) byId[ROSTER[i].id] = ROSTER[i]; }

    // ── helpers (purely from provided data) ─────────────────────────────────
    var parseDebut = function(iso){
      if (!iso || typeof iso !== "string" || iso.length < 4) return null;
      var p = iso.split("-");
      var y = parseInt(p[0],10);
      if (!isFinite(y)) return null;
      var mo = p[1] ? parseInt(p[1],10) : 1;
      var d  = p[2] ? parseInt(p[2],10) : 1;
      if (!isFinite(mo) || mo < 1 || mo > 12) mo = 1;
      if (!isFinite(d)  || d  < 1 || d  > 31) d  = 1;
      return { y:y, date:new Date(Date.UTC(y, mo-1, d)) };
    };
    var yearsActive = function(iso){
      var p = parseDebut(iso); if (!p) return null;
      var now = new Date();
      var ms = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - p.date.getTime();
      var yrs = Math.floor(ms / (365.25 * 86400000));
      return yrs < 0 ? 0 : yrs;
    };
    var fmtDebut = function(iso){
      var p = parseDebut(iso); if (!p) return tt("na");
      try { return p.date.toLocaleDateString(L === "en" ? undefined : L, { year:"numeric", month:"short", day:"numeric", timeZone:"UTC" }); }
      catch (e) { return iso; }
    };
    // Generation by debut year (standard K-pop generation buckets)
    var generation = function(iso){
      var p = parseDebut(iso); if (!p) return tt("na");
      var y = p.y;
      var g = (y <= 2002) ? 1 : (y <= 2011) ? 2 : (y <= 2017) ? 3 : (y <= 2022) ? 4 : 5;
      return "Gen " + g;
    };
    var memberCount = function(a){
      if (!a) return 0;
      if (a.type === "soloist") return 0;
      return Array.isArray(a.members) ? a.members.length : 0;
    };

    // ── default + random picks ──────────────────────────────────────────────
    var preferOrder = ["blackpink","bts","newjeans","twice","seventeen","straykids","ive","aespa"];
    var firstAvail = function(skip){
      for (var k = 0; k < preferOrder.length; k++){ if (preferOrder[k] !== skip && byId[preferOrder[k]]) return preferOrder[k]; }
      for (var j = 0; j < ROSTER.length; j++){ if (ROSTER[j].id !== skip) return ROSTER[j].id; }
      return null;
    };
    var idA = firstAvail(null);
    var idB = firstAvail(idA);
    if (!idA || !idB || idA === idB) {
      idA = ROSTER[0].id;
      idB = (ROSTER[1] && ROSTER[1].id !== idA) ? ROSTER[1].id : (ROSTER[ROSTER.length-1].id);
    }

    var randomize = function(){
      if (ROSTER.length < 2) return;
      var a = ROSTER[Math.floor(Math.random()*ROSTER.length)].id;
      var b = a;
      var guard = 0;
      while (b === a && guard < 50){ b = ROSTER[Math.floor(Math.random()*ROSTER.length)].id; guard++; }
      if (b === a){ // fallback deterministic
        for (var z = 0; z < ROSTER.length; z++){ if (ROSTER[z].id !== a){ b = ROSTER[z].id; break; } }
      }
      idA = a; idB = b;
    };

    // ── styles (inject once) ────────────────────────────────────────────────
    if (!document.getElementById("kpp-compare-css")) {
      var st = document.createElement("style");
      st.id = "kpp-compare-css";
      st.textContent =
        "#kpp-compare{background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:16px;padding:16px 18px;margin-bottom:16px;color:var(--text,#fff)}"+
        "#kpp-compare .kpp-c-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px}"+
        "#kpp-compare .kpp-c-tt{font-size:15px;font-weight:900;line-height:1.2;margin:0}"+
        "#kpp-compare .kpp-c-sub{font-size:12px;color:var(--text3,#8a93a0);margin:2px 0 0}"+
        "#kpp-compare .kpp-c-acts{display:flex;gap:8px;flex-shrink:0}"+
        "#kpp-compare .kpp-c-btn{appearance:none;-webkit-appearance:none;cursor:pointer;font:inherit;font-size:12px;font-weight:800;color:var(--text2,#aab);background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:999px;padding:7px 12px;display:inline-flex;align-items:center;gap:5px;line-height:1}"+
        "#kpp-compare .kpp-c-btn:hover{color:var(--text,#fff);border-color:var(--accent,#ff2e74)}"+
        "#kpp-compare .kpp-c-btn:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px}"+
        "#kpp-compare .kpp-c-heads{display:grid;grid-template-columns:1fr auto 1fr;align-items:stretch;gap:8px;margin-bottom:10px}"+
        "#kpp-compare .kpp-c-side{min-width:0;text-align:center}"+
        "#kpp-compare .kpp-c-emoji{font-size:30px;line-height:1;margin-bottom:6px}"+
        "#kpp-compare .kpp-c-pick{width:100%;max-width:100%;appearance:none;-webkit-appearance:none;cursor:pointer;font:inherit;font-size:13px;font-weight:800;color:var(--text,#fff);background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:10px;padding:8px 26px 8px 10px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;background-image:linear-gradient(45deg,transparent 50%,var(--text2,#aab) 50%),linear-gradient(135deg,var(--text2,#aab) 50%,transparent 50%);background-position:calc(100% - 14px) 16px,calc(100% - 9px) 16px;background-size:5px 5px,5px 5px;background-repeat:no-repeat}"+
        "#kpp-compare .kpp-c-pick:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:1px}"+
        "#kpp-compare .kpp-c-name{display:block;margin-top:4px;font-size:11px;color:var(--text3,#8a93a0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
        "#kpp-compare .kpp-c-vs{align-self:center;font-size:12px;font-weight:900;color:#fff;background:var(--kp-grad,linear-gradient(135deg,#ff2e74,#7a5cff));border-radius:999px;padding:5px 9px;line-height:1}"+
        "#kpp-compare table.kpp-c-tbl{width:100%;border-collapse:collapse;table-layout:fixed}"+
        "#kpp-compare .kpp-c-tbl td,#kpp-compare .kpp-c-tbl th{padding:9px 6px;font-size:13px;vertical-align:top;border-top:1px solid var(--border,rgba(255,255,255,.12))}"+
        "#kpp-compare .kpp-c-tbl tr:first-child td,#kpp-compare .kpp-c-tbl tr:first-child th{border-top:0}"+
        "#kpp-compare .kpp-c-tbl .kpp-c-lbl{width:34%;text-align:center;font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--text3,#8a93a0);white-space:nowrap}"+
        "#kpp-compare .kpp-c-tbl .kpp-c-val{width:33%;text-align:center;color:var(--text,#fff);font-weight:600;word-break:break-word}"+
        "#kpp-compare .kpp-c-tbl .kpp-c-muted{color:var(--text2,#aab);font-weight:500}"+
        "#kpp-compare .kpp-c-foot{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}"+
        "#kpp-compare .kpp-c-link{appearance:none;-webkit-appearance:none;cursor:pointer;font:inherit;font-size:12px;font-weight:800;color:#fff;background:var(--kp-grad,linear-gradient(135deg,#ff2e74,#7a5cff));border:0;border-radius:10px;padding:9px 8px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"+
        "#kpp-compare .kpp-c-link:focus-visible{outline:2px solid var(--text,#fff);outline-offset:2px}"+
        "@media (max-width:380px){#kpp-compare{padding:14px 14px}#kpp-compare .kpp-c-tbl .kpp-c-lbl{font-size:9.5px}#kpp-compare .kpp-c-pick{font-size:12px}}"+
        "@media (prefers-reduced-motion:reduce){#kpp-compare *{transition:none!important;animation:none!important}}";
      (document.head || document.documentElement).appendChild(st);
    }

    // ── build shell ─────────────────────────────────────────────────────────
    var root = document.createElement("section");
    root.id = "kpp-compare";
    root.setAttribute("aria-label", tt("title"));

    var optionsHtml = function(selId){
      var html = "";
      for (var n = 0; n < ROSTER.length; n++){
        var a = ROSTER[n];
        if (!a || !a.id) continue;
        var label = (a.emoji ? a.emoji + " " : "") + (a.nameEn || a.id);
        html += '<option value="' + esc(a.id) + '"' + (a.id === selId ? " selected" : "") + ">" + esc(label) + "</option>";
      }
      return html;
    };

    var rowsHtml = function(a, b){
      var na = tt("na");
      var rows = [];
      var add = function(lbl, va, vb, mutedA, mutedB){
        rows.push(
          '<tr>'+
            '<td class="kpp-c-val'+(mutedA?" kpp-c-muted":"")+'">'+va+'</td>'+
            '<td class="kpp-c-lbl">'+esc(lbl)+'</td>'+
            '<td class="kpp-c-val'+(mutedB?" kpp-c-muted":"")+'">'+vb+'</td>'+
          '</tr>'
        );
      };
      var dispYears = function(a){
        var y = yearsActive(a && a.debut);
        if (y == null) return na;
        return y + " " + (y === 1 ? tt("yr") : tt("yrs"));
      };
      var dispMembers = function(a){
        if (!a) return na;
        if (a.type === "soloist") return tt("solo");
        var c = memberCount(a);
        return c > 0 ? esc(T.memCount(c)) : na;
      };
      var dispGenres = function(a){
        if (a && Array.isArray(a.genres) && a.genres.length) return esc(a.genres.join(", "));
        return na;
      };
      var dispLight = function(a){
        var e = a && ENRICH[a.id];
        if (e && e.lightstick) return esc(e.lightstick);
        return na;
      };
      var dispFandom = function(a){ return (a && a.fandom) ? esc(a.fandom) : na; };
      var dispAgency = function(a){ return (a && a.agency) ? esc(a.agency) : na; };

      add(tt("debut"),      esc(fmtDebut(a && a.debut)), esc(fmtDebut(b && b.debut)));
      add(tt("years"),      esc(dispYears(a)),           esc(dispYears(b)));
      add(tt("gen"),        esc(generation(a && a.debut)), esc(generation(b && b.debut)));
      add(tt("agency"),     dispAgency(a),               dispAgency(b));
      add(tt("members"),    dispMembers(a),              dispMembers(b));
      add(tt("fandom"),     dispFandom(a),               dispFandom(b),  !(a && a.fandom), !(b && b.fandom));
      add(tt("lightstick"), dispLight(a),                dispLight(b),   !(ENRICH[a&&a.id]&&ENRICH[a.id].lightstick), !(ENRICH[b&&b.id]&&ENRICH[b.id].lightstick));
      add(tt("genres"),     dispGenres(a),               dispGenres(b));
      return rows.join("");
    };

    var render = function(){
      var a = byId[idA] || ROSTER[0];
      var b = byId[idB] || ROSTER[1] || ROSTER[0];
      idA = a.id; idB = b.id;

      root.innerHTML =
        '<div class="kpp-c-hd">'+
          '<div>'+
            '<p class="kpp-c-tt">'+esc(tt("title"))+'</p>'+
            '<p class="kpp-c-sub">'+esc(tt("sub"))+'</p>'+
          '</div>'+
          '<div class="kpp-c-acts">'+
            '<button type="button" class="kpp-c-btn" data-act="swap" aria-label="'+esc(tt("swapAria"))+'">⇄ '+esc(tt("swap"))+'</button>'+
            '<button type="button" class="kpp-c-btn" data-act="rand" aria-label="'+esc(tt("randAria"))+'">🎲 '+esc(tt("rand"))+'</button>'+
          '</div>'+
        '</div>'+
        '<div class="kpp-c-heads">'+
          '<div class="kpp-c-side">'+
            '<div class="kpp-c-emoji" aria-hidden="true">'+esc(a.emoji||"🎤")+'</div>'+
            '<select class="kpp-c-pick" data-side="a" aria-label="'+esc(tt("pickAria"))+'">'+optionsHtml(idA)+'</select>'+
            '<span class="kpp-c-name">'+esc(a.nameKo||"")+'</span>'+
          '</div>'+
          '<div class="kpp-c-vs" aria-hidden="true">'+esc(tt("vs"))+'</div>'+
          '<div class="kpp-c-side">'+
            '<div class="kpp-c-emoji" aria-hidden="true">'+esc(b.emoji||"🎤")+'</div>'+
            '<select class="kpp-c-pick" data-side="b" aria-label="'+esc(tt("pickAria"))+'">'+optionsHtml(idB)+'</select>'+
            '<span class="kpp-c-name">'+esc(b.nameKo||"")+'</span>'+
          '</div>'+
        '</div>'+
        '<table class="kpp-c-tbl"><tbody>'+rowsHtml(a,b)+'</tbody></table>'+
        '<div class="kpp-c-foot">'+
          '<button type="button" class="kpp-c-link" data-go="'+esc(a.id)+'" aria-label="'+esc(tt("profile")+" — "+(a.nameEn||a.id))+'">'+esc(a.nameEn||a.id)+'</button>'+
          '<button type="button" class="kpp-c-link" data-go="'+esc(b.id)+'" aria-label="'+esc(tt("profile")+" — "+(b.nameEn||b.id))+'">'+esc(b.nameEn||b.id)+'</button>'+
        '</div>';
    };

    // ── event delegation (bound once on root) ───────────────────────────────
    root.addEventListener("change", function(ev){
      var sel = ev.target;
      if (!sel || sel.className.indexOf("kpp-c-pick") < 0) return;
      var side = sel.getAttribute("data-side");
      var val = sel.value;
      if (!byId[val]) return;
      if (side === "a"){
        if (val === idB){ idB = idA; } // avoid duplicate: swap instead
        idA = val;
      } else {
        if (val === idA){ idA = idB; }
        idB = val;
      }
      render();
    });
    root.addEventListener("click", function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest("button") : null;
      if (!btn) return;
      var go = btn.getAttribute("data-go");
      if (go){ openArtist(go); return; }
      var act = btn.getAttribute("data-act");
      if (act === "swap"){ var tmp = idA; idA = idB; idB = tmp; render(); return; }
      if (act === "rand"){ randomize(); render(); return; }
    });

    render();
    mount.appendChild(root);

  } catch (e) {
    /* never throw into the page */
  }
})();

/* ===== stats: Adds a "Stan Wrapped" card to #kpop-foryou summarizing the user's follows (bias count, top agency, K-pop generation mix, girl/boy split, sta ===== */
(function(){ "use strict";
  var MOUNT="#kpop-foryou", FLAG="kppStats";
  var mount=document.querySelector(MOUNT);
  if(!mount) return;

  var SUP=["en","ko","ja","zh","es","fr","de","pt","id"];
  var L=(localStorage.getItem("kp_lang")||(navigator.language||"en").slice(0,2)||"en").toLowerCase();
  if(SUP.indexOf(L)<0) L="en";

  var I={
    en:{title:"Your Stan Wrapped",sub:"A snapshot of your bias list",biases:"Biases",bias1:"Bias",topAgency:"Top label",mix:"Generation mix",split:"Girl / Boy groups",since:"Stanning since",sticks:"Lightsticks collected",girl:"girl",boy:"boy",none:"—",empty:"You haven't followed anyone yet",emptyHint:"Tap the ★ on any artist to start building your stats.",share:"Share my Wrapped",shareTip:"Share your fan stats",gen:"Gen",genQ:"Mixed gens",artists:"artists",shareText:"My K-pop Stan Wrapped 🎤",open:"Open profile"},
    ko:{title:"나의 스탠 결산",sub:"내 최애 리스트 요약",biases:"최애",bias1:"최애",topAgency:"대표 소속사",mix:"세대 구성",split:"걸/보이 그룹",since:"덕질 시작",sticks:"모은 응원봉",girl:"걸",boy:"보이",none:"—",empty:"아직 팔로우한 아티스트가 없어요",emptyHint:"아티스트의 ★를 눌러 통계를 채워보세요.",share:"내 결산 공유",shareTip:"내 팬 통계 공유",gen:"세대",genQ:"여러 세대",artists:"명",shareText:"나의 K-pop 스탠 결산 🎤",open:"프로필 열기"},
    ja:{title:"あなたの推し活まとめ",sub:"推しリストのまとめ",biases:"推し",bias1:"推し",topAgency:"主な事務所",mix:"世代の構成",split:"女性/男性グループ",since:"推し始め",sticks:"集めたペンライト",girl:"女性",boy:"男性",none:"—",empty:"まだ誰もフォローしていません",emptyHint:"アーティストの★をタップして統計を作りましょう。",share:"総集編をシェア",shareTip:"ファン統計をシェア",gen:"世代",genQ:"複数世代",artists:"組",shareText:"私のK-POP推し活まとめ 🎤",open:"プロフィールを開く"},
    zh:{title:"你的追星总结",sub:"你的本命清单概览",biases:"本命",bias1:"本命",topAgency:"主要公司",mix:"世代构成",split:"女团 / 男团",since:"入坑于",sticks:"收集的应援棒",girl:"女团",boy:"男团",none:"—",empty:"你还没有关注任何人",emptyHint:"点击艺人的★开始积累你的数据。",share:"分享我的总结",shareTip:"分享你的粉丝数据",gen:"代",genQ:"多个世代",artists:"位",shareText:"我的K-pop追星总结 🎤",open:"打开主页"},
    es:{title:"Tu Resumen Stan",sub:"Un vistazo a tus biases",biases:"Biases",bias1:"Bias",topAgency:"Agencia top",mix:"Mezcla de generaciones",split:"Grupos femeninos / masculinos",since:"Fan desde",sticks:"Lightsticks reunidos",girl:"femenino",boy:"masculino",none:"—",empty:"Aún no sigues a nadie",emptyHint:"Toca la ★ de un artista para empezar tus estadísticas.",share:"Compartir mi resumen",shareTip:"Comparte tus estadísticas",gen:"Gen",genQ:"Varias gens",artists:"artistas",shareText:"Mi resumen Stan de K-pop 🎤",open:"Abrir perfil"},
    fr:{title:"Ton Stan Wrapped",sub:"Un aperçu de vos biases",biases:"Biases",bias1:"Bias",topAgency:"Agence principale",mix:"Mix de générations",split:"Groupes filles / garçons",since:"Fan depuis",sticks:"Lightsticks collectés",girl:"filles",boy:"garçons",none:"—",empty:"Vous ne suivez encore personne",emptyHint:"Touchez l'★ d'un artiste pour commencer vos stats.",share:"Partager mon Wrapped",shareTip:"Partage tes stats de fan",gen:"Gén",genQ:"Plusieurs gén",artists:"artistes",shareText:"Mon Stan Wrapped K-pop 🎤",open:"Ouvrir le profil"},
    de:{title:"Dein Stan Wrapped",sub:"Ein Blick auf deine Biases",biases:"Biases",bias1:"Bias",topAgency:"Top-Label",mix:"Generationen-Mix",split:"Girl- / Boygroups",since:"Fan seit",sticks:"Lightsticks gesammelt",girl:"Girl",boy:"Boy",none:"—",empty:"Du folgst noch niemandem",emptyHint:"Tippe auf den ★ eines Artists, um Stats zu sammeln.",share:"Mein Wrapped teilen",shareTip:"Teile deine Fan-Stats",gen:"Gen",genQ:"Mehrere Gen",artists:"Artists",shareText:"Mein K-Pop Stan Wrapped 🎤",open:"Profil öffnen"},
    pt:{title:"Seu Stan Wrapped",sub:"Um resumo dos seus biases",biases:"Biases",bias1:"Bias",topAgency:"Agência principal",mix:"Mix de gerações",split:"Girl / Boy groups",since:"Fã desde",sticks:"Lightsticks coletados",girl:"girl",boy:"boy",none:"—",empty:"Você ainda não segue ninguém",emptyHint:"Toque na ★ de um artista para começar suas estatísticas.",share:"Compartilhar meu Wrapped",shareTip:"Compartilhe suas estatísticas",gen:"Ger",genQ:"Várias gerações",artists:"artistas",shareText:"Meu Stan Wrapped de K-pop 🎤",open:"Abrir perfil"},
    id:{title:"Stan Wrapped Kamu",sub:"Ringkasan daftar bias kamu",biases:"Bias",bias1:"Bias",topAgency:"Agensi teratas",mix:"Campuran generasi",split:"Grup cewek / cowok",since:"Ngefans sejak",sticks:"Lightstick terkumpul",girl:"cewek",boy:"cowok",none:"—",empty:"Kamu belum mengikuti siapa pun",emptyHint:"Ketuk ★ pada artis untuk mulai membangun statistikmu.",share:"Bagikan Wrapped-ku",shareTip:"Bagikan statistik fanmu",gen:"Gen",genQ:"Beberapa gen",artists:"artis",shareText:"K-pop Stan Wrapped-ku 🎤",open:"Buka profil"}
  };
  var t=I[L]||I.en, en=I.en;
  function T(k){ return (t[k]!=null?t[k]:en[k])||""; }

  var pf=function(id){ var x=SUP.indexOf(L)>=0?L:"en"; return (x==="en"?"":x+"/")+"kpop/"+id+"-profile"; };

  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

  function readFollows(){
    var a; try{ a=JSON.parse(localStorage.getItem("kp_kpop_follow")||"[]"); }catch(e){ a=[]; }
    return Array.isArray(a)?a.filter(function(x){ return typeof x==="string"; }):[];
  }
  function readSince(){
    var s; try{ s=JSON.parse(localStorage.getItem("kp_kpop_since")||"{}"); }catch(e){ s={}; }
    return (s&&typeof s==="object")?s:{};
  }
  function roster(){ return Array.isArray(window.KPOP_ROSTER)?window.KPOP_ROSTER:[]; }
  function enrich(){ return (window.KPOP_ENRICH&&typeof window.KPOP_ENRICH==="object")?window.KPOP_ENRICH:{}; }

  function byId(){
    var m={}, r=roster();
    for(var i=0;i<r.length;i++){ var a=r[i]; if(a&&a.id) m[a.id]=a; }
    return m;
  }

  function decadeOf(debut){
    var y=parseInt(String(debut||"").slice(0,4),10);
    if(!y||y<1990||y>2100) return null;
    return Math.floor(y/10)*10;
  }
  // K-pop generation heuristic by debut year.
  function genOf(debut){
    var y=parseInt(String(debut||"").slice(0,4),10);
    if(!y) return null;
    if(y<2003) return 1;
    if(y<2012) return 2;
    if(y<2018) return 3;
    if(y<2023) return 4;
    return 5;
  }
  function isGirl(g){ g=String(g||"").toLowerCase(); return g==="girl"||g==="female"; }
  function isBoy(g){ g=String(g||"").toLowerCase(); return g==="boy"||g==="male"; }

  function compute(){
    var follows=readFollows(), map=byId(), since=readSince(), ENR=enrich();
    var arts=[];
    for(var i=0;i<follows.length;i++){ var a=map[follows[i]]; if(a) arts.push(a); }
    if(!arts.length) return { count:0 };

    var agencyCount={}, topAgency=null, topN=0;
    var genCount={}, girl=0, boy=0, sticks=0, earliest=null;

    for(var j=0;j<arts.length;j++){
      var a=arts[j];
      var ag=String(a.agency||"").trim();
      if(ag){ agencyCount[ag]=(agencyCount[ag]||0)+1; if(agencyCount[ag]>topN){ topN=agencyCount[ag]; topAgency=ag; } }
      var g=genOf(a.debut); if(g){ genCount[g]=(genCount[g]||0)+1; }
      if(a.type!=="soloist"){ if(isGirl(a.gender)) girl++; else if(isBoy(a.gender)) boy++; }
      var en2=ENR[a.id];
      if(en2&&en2.lightstick&&String(en2.lightstick).trim()) sticks++;
      var yr=since[a.id];
      if(typeof yr==="number"&&yr>1990&&yr<2100){ if(earliest==null||yr<earliest) earliest=yr; }
    }

    // generation summary string e.g. "Gen 4 ×3 · Gen 3 ×1"
    var gens=Object.keys(genCount).map(function(k){ return [parseInt(k,10),genCount[k]]; })
      .sort(function(x,y){ return y[1]-x[1]||x[0]-y[0]; });

    return {
      count:arts.length, arts:arts, topAgency:topAgency, gens:gens,
      girl:girl, boy:boy, sticks:sticks, since:earliest
    };
  }

  function genLabel(gens){
    if(!gens||!gens.length) return T("none");
    if(gens.length===1) return T("gen")+" "+gens[0][0];
    return gens.slice(0,3).map(function(p){ return T("gen")+" "+p[0]+" ×"+p[1]; }).join(" · ");
  }

  function injectCss(){
    if(document.getElementById("kpp-stats-css")) return;
    var s=document.createElement("style");
    s.id="kpp-stats-css";
    s.textContent=[
      ".kpp-stats{background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:16px;padding:16px 18px;margin-bottom:16px;color:var(--text,#fff)}",
      ".kpp-stats *{box-sizing:border-box}",
      ".kpp-stats .kpp-h{display:flex;align-items:center;gap:10px;margin-bottom:4px}",
      ".kpp-stats .kpp-h .kpp-ic{font-size:20px;line-height:1}",
      ".kpp-stats .kpp-t{font-size:15px;font-weight:900;letter-spacing:.2px}",
      ".kpp-stats .kpp-sub{font-size:12px;color:var(--text3,#8a93a0);margin:0 0 14px 30px}",
      ".kpp-stats .kpp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}",
      "@media(min-width:520px){.kpp-stats .kpp-grid{grid-template-columns:repeat(3,1fr)}}",
      ".kpp-stats .kpp-cell{background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:12px;padding:12px 12px 11px;min-width:0}",
      ".kpp-stats .kpp-k{font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;color:var(--text3,#8a93a0);font-weight:800;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".kpp-stats .kpp-v{font-size:20px;font-weight:900;line-height:1.1;color:var(--text,#fff);overflow-wrap:anywhere}",
      ".kpp-stats .kpp-v.kpp-sm{font-size:14px;font-weight:800}",
      ".kpp-stats .kpp-v .kpp-u{font-size:12px;font-weight:700;color:var(--text2,#aab);margin-left:3px}",
      ".kpp-stats .kpp-split{display:flex;align-items:center;gap:8px}",
      ".kpp-stats .kpp-bar{flex:1;height:8px;border-radius:6px;background:var(--border,rgba(255,255,255,.12));overflow:hidden;display:flex;min-width:34px}",
      ".kpp-stats .kpp-bar i{display:block;height:100%}",
      ".kpp-stats .kpp-bar .kpp-g{background:var(--accent,#ff2e74)}",
      ".kpp-stats .kpp-bar .kpp-b{background:#38d4ff}",
      ".kpp-stats .kpp-legend{font-size:10px;color:var(--text3,#8a93a0);font-weight:700;white-space:nowrap}",
      ".kpp-stats .kpp-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:13px}",
      ".kpp-stats .kpp-chip{display:inline-flex;align-items:center;gap:5px;background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));color:var(--text2,#aab);border-radius:999px;padding:5px 10px 5px 8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;line-height:1.2;transition:border-color .15s,color .15s,transform .15s}",
      ".kpp-stats .kpp-chip:hover{border-color:var(--accent,#ff2e74);color:var(--text,#fff);transform:translateY(-1px)}",
      ".kpp-stats .kpp-chip:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px}",
      ".kpp-stats .kpp-chip .kpp-e{font-size:14px}",
      ".kpp-stats .kpp-share{margin-top:15px;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;border:0;cursor:pointer;font-family:inherit;font-size:14px;font-weight:800;color:#fff;padding:12px 16px;border-radius:12px;background:var(--kp-grad,linear-gradient(135deg,#ff2e74,#b14bff));transition:filter .15s,transform .15s}",
      ".kpp-stats .kpp-share:hover{filter:brightness(1.08)}",
      ".kpp-stats .kpp-share:active{transform:scale(.985)}",
      ".kpp-stats .kpp-share:focus-visible{outline:2px solid #fff;outline-offset:2px}",
      ".kpp-stats .kpp-share[disabled]{opacity:.6;cursor:default}",
      ".kpp-stats .kpp-empty{text-align:center;padding:14px 6px 8px}",
      ".kpp-stats .kpp-empty .kpp-em{font-size:34px;line-height:1;margin-bottom:8px}",
      ".kpp-stats .kpp-empty .kpp-et{font-size:14px;font-weight:800;color:var(--text,#fff);margin-bottom:6px}",
      ".kpp-stats .kpp-empty .kpp-eh{font-size:12.5px;color:var(--text3,#8a93a0);line-height:1.5;max-width:300px;margin:0 auto}",
      "@media(prefers-reduced-motion:reduce){.kpp-stats *{transition:none!important}}"
    ].join("");
    (document.head||document.documentElement).appendChild(s);
  }

  var root=null;

  function el(tag,cls,html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }

  function cell(k,vHtml,sm){
    var c=el("div","kpp-cell");
    c.appendChild(el("div","kpp-k",esc(k)));
    var v=el("div","kpp-v"+(sm?" kpp-sm":"")); v.innerHTML=vHtml; c.appendChild(v);
    return c;
  }

  function openArtist(id){
    if(typeof window.kpOpenArtist==="function"){ try{ window.kpOpenArtist(id); return; }catch(e){} }
    try{ window.location.href=pf(id); }catch(e){}
  }

  function shareSummary(d){
    var parts=[T("shareText")];
    parts.push(T("biases")+": "+d.count);
    if(d.topAgency) parts.push(T("topAgency")+": "+d.topAgency);
    if(d.gens&&d.gens.length) parts.push(T("mix")+": "+genLabel(d.gens));
    if(d.since) parts.push(T("since")+": "+d.since);
    if(d.sticks) parts.push("🔦 "+d.sticks);
    var origin=""; try{ origin=window.location.origin; }catch(e){}
    var url=(origin||"https://koreaplus-lifes.com")+"/kpop";
    var text=parts.join("\n")+"\n"+url;
    if(navigator.share){
      Promise.resolve(navigator.share({ title:T("title"), text:text, url:url })).catch(function(){});
      return;
    }
    if(navigator.clipboard&&navigator.clipboard.writeText){
      Promise.resolve(navigator.clipboard.writeText(text)).then(function(){
        flashShare(); 
      }).catch(function(){});
      return;
    }
    try{ window.prompt(T("share"),text); }catch(e){}
  }

  function flashShare(){
    if(!root) return;
    var b=root.querySelector(".kpp-share .kpp-lbl");
    if(!b) return;
    var prev=b.textContent;
    b.textContent="✓";
    setTimeout(function(){ try{ b.textContent=prev; }catch(e){} },1400);
  }

  function onShare(d){
    var SC=window.KpopShareCard;
    if(SC&&typeof SC.fanCard==="function"){
      // Lead with the user's top bias for a richer visual card.
      var lead=d.arts&&d.arts[0]?d.arts[0]:null;
      var ENR=enrich(); var le=lead?(ENR[lead.id]||{}):{};
      try{
        Promise.resolve(SC.fanCard({
          artist:lead?(L==="ko"&&lead.nameKo?lead.nameKo:lead.nameEn):"K-pop",
          emoji:lead?lead.emoji:"🎤",
          fandom:T("biases")+" ×"+d.count,
          lightstick:d.sticks?("🔦 ×"+d.sticks):(le.lightstick||""),
          color:le.color,
          since:d.since||"",
          sinceLabel:T("since")
        })).catch(function(){ shareSummary(d); });
        return;
      }catch(e){}
    }
    shareSummary(d);
  }

  function render(){
    if(!root) return;
    root.textContent="";
    var d=compute();

    var head=el("div","kpp-h");
    head.appendChild(el("span","kpp-ic","🎁"));
    head.appendChild(el("span","kpp-t",esc(T("title"))));
    root.appendChild(head);

    if(!d.count){
      var emp=el("div","kpp-empty");
      emp.appendChild(el("div","kpp-em","✨"));
      emp.appendChild(el("div","kpp-et",esc(T("empty"))));
      emp.appendChild(el("div","kpp-eh",esc(T("emptyHint"))));
      root.appendChild(emp);
      return;
    }

    root.appendChild(el("div","kpp-sub",esc(T("sub"))));

    var grid=el("div","kpp-grid");
    // biases
    grid.appendChild(cell(T("biases"),esc(d.count)+'<span class="kpp-u">'+esc(d.count===1?T("bias1"):T("artists"))+'</span>'));
    // top agency
    grid.appendChild(cell(T("topAgency"),esc(d.topAgency||T("none")),true));
    // generation mix
    grid.appendChild(cell(T("mix"),esc(genLabel(d.gens)),true));
    // girl/boy split
    var tot=d.girl+d.boy;
    var splitHtml;
    if(tot){
      var gp=Math.round(d.girl/tot*100), bp=100-gp;
      splitHtml='<div class="kpp-split"><span class="kpp-bar">'+
        (d.girl?'<i class="kpp-g" style="width:'+gp+'%"></i>':'')+
        (d.boy?'<i class="kpp-b" style="width:'+bp+'%"></i>':'')+
        '</span><span class="kpp-legend">'+esc(d.girl)+"/"+esc(d.boy)+'</span></div>';
    } else { splitHtml=esc(T("none")); }
    var splitCell=el("div","kpp-cell");
    splitCell.appendChild(el("div","kpp-k",esc(T("split"))));
    var sv=el("div","kpp-v"+(tot?" kpp-sm":"")); sv.innerHTML=splitHtml; splitCell.appendChild(sv);
    grid.appendChild(splitCell);
    // since
    grid.appendChild(cell(T("since"),d.since?esc(d.since):esc(T("none"))));
    // lightsticks
    grid.appendChild(cell(T("sticks"),'🔦 '+esc(d.sticks)));
    root.appendChild(grid);

    // bias chips (open internal modal/profile)
    var chips=el("div","kpp-chips");
    var shown=d.arts.slice(0,8);
    shown.forEach(function(a){
      var btn=document.createElement("button");
      btn.type="button"; btn.className="kpp-chip";
      var nm=(L==="ko"&&a.nameKo?a.nameKo:a.nameEn)||a.nameEn||a.id;
      btn.setAttribute("aria-label",T("open")+": "+nm);
      btn.innerHTML='<span class="kpp-e" aria-hidden="true">'+esc(a.emoji||"🎤")+'</span>'+esc(nm);
      btn.addEventListener("click",function(){ openArtist(a.id); });
      chips.appendChild(btn);
    });
    root.appendChild(chips);

    // share
    var share=document.createElement("button");
    share.type="button"; share.className="kpp-share";
    share.setAttribute("aria-label",T("shareTip"));
    share.innerHTML='<span aria-hidden="true">📤</span><span class="kpp-lbl">'+esc(T("share"))+'</span>';
    share.addEventListener("click",function(){ onShare(d); });
    root.appendChild(share);
  }

  function init(){
    if(!mount||mount.getAttribute("data-"+FLAG)==="1") return;
    mount.setAttribute("data-"+FLAG,"1");
    injectCss();
    root=el("section","kpp-stats");
    root.setAttribute("role","region");
    root.setAttribute("aria-label",T("title"));
    mount.appendChild(root);
    render();
  }

  var rT=null;
  function scheduleRender(){
    if(rT) return;
    rT=setTimeout(function(){ rT=null; try{ render(); }catch(e){} },60);
  }

  try{ init(); }catch(e){}
  window.addEventListener("kp:follows",scheduleRender);
  window.addEventListener("kp:view",scheduleRender);
})();

/* ===== badges: A celebratory, compact "Achievements / Badges" shelf (adapts Duolingo / gaming achievements) that derives unlocked state from shared K-pop s ===== */
(function(){ "use strict";
  var MOUNT="#kpop-foryou", FKEY="badges", CSSID="kpp-"+FKEY+"-css", FLAG="kpp"+FKEY;
  var mount=document.querySelector(MOUNT);
  if(!mount) return;

  var SUP=["en","ko","ja","zh","es","fr","de","pt","id"];
  var L=(localStorage.getItem("kp_lang")||(navigator.language||"en").slice(0,2)||"en").toLowerCase();
  if(SUP.indexOf(L)<0) L="en";

  var pf=function(id){var x=SUP.indexOf(L)>=0?L:"en"; return (x==="en"?"":x+"/")+"kpop/"+id+"-profile";};

  var I18N={
    en:{title:"Your achievements",sub:"Unlock badges as you explore",done:"unlocked",of:"of",how:"How to unlock",
        firstBias:"First Bias",firstBiasH:"Follow your first artist",
        multistan:"Multistan",multistanH:"Follow 5 artists",
        devoted:"Devoted",devotedH:"Follow 10 artists",
        quizStreak:"Quiz Streak",quizStreakH:"Reach a 3-day quiz streak",
        voter:"Voter",voterH:"Cast a vote in Bias Battle",
        explorer:"Explorer",explorerH:"View 8 different artists",
        polyglot:"Polyglot",polyglotH:"Switch the app language",
        allDone:"All badges unlocked — legend! 🏆",cta:"Discover artists"},
    ko:{title:"내 업적",sub:"탐험하며 배지를 잠금 해제하세요",done:"획득",of:"/",how:"잠금 해제 방법",
        firstBias:"첫 최애",firstBiasH:"첫 아티스트를 팔로우하세요",
        multistan:"멀티스탠",multistanH:"아티스트 5명 팔로우",
        devoted:"찐팬",devotedH:"아티스트 10명 팔로우",
        quizStreak:"퀴즈 연속",quizStreakH:"3일 연속 퀴즈 달성",
        voter:"투표자",voterH:"최애 대결에서 투표하기",
        explorer:"탐험가",explorerH:"서로 다른 아티스트 8명 보기",
        polyglot:"폴리글롯",polyglotH:"앱 언어를 변경하세요",
        allDone:"모든 배지 획득 — 레전드! 🏆",cta:"아티스트 둘러보기"},
    ja:{title:"あなたの実績",sub:"探索してバッジを解放しよう",done:"解放",of:"/",how:"解放方法",
        firstBias:"はじめての推し",firstBiasH:"最初のアーティストをフォロー",
        multistan:"複数推し",multistanH:"アーティストを5組フォロー",
        devoted:"ガチ勢",devotedH:"アーティストを10組フォロー",
        quizStreak:"クイズ連続",quizStreakH:"クイズを3日連続で達成",
        voter:"投票者",voterH:"推し対決で投票する",
        explorer:"探究者",explorerH:"8組のアーティストを見る",
        polyglot:"ポリグロット",polyglotH:"アプリの言語を変更",
        allDone:"全バッジ解放 — 伝説！🏆",cta:"アーティストを探す"},
    zh:{title:"你的成就",sub:"探索即可解锁徽章",done:"已解锁",of:"/",how:"解锁方法",
        firstBias:"初见本命",firstBiasH:"关注你的第一位艺人",
        multistan:"多担",multistanH:"关注 5 位艺人",
        devoted:"铁粉",devotedH:"关注 10 位艺人",
        quizStreak:"问答连胜",quizStreakH:"达成 3 天问答连胜",
        voter:"投票者",voterH:"在本命对决中投票",
        explorer:"探索者",explorerH:"浏览 8 位不同艺人",
        polyglot:"语言达人",polyglotH:"切换应用语言",
        allDone:"全部徽章已解锁 — 传奇！🏆",cta:"发现艺人"},
    es:{title:"Tus logros",sub:"Desbloquea insignias al explorar",done:"desbloqueadas",of:"de",how:"Cómo desbloquear",
        firstBias:"Primer bias",firstBiasH:"Sigue a tu primer artista",
        multistan:"Multistan",multistanH:"Sigue a 5 artistas",
        devoted:"Devoto",devotedH:"Sigue a 10 artistas",
        quizStreak:"Racha de quiz",quizStreakH:"Logra una racha de 3 días",
        voter:"Votante",voterH:"Vota en la Batalla de Bias",
        explorer:"Explorador",explorerH:"Ve a 8 artistas distintos",
        polyglot:"Políglota",polyglotH:"Cambia el idioma de la app",
        allDone:"Todas las insignias desbloqueadas — ¡leyenda! 🏆",cta:"Descubrir artistas"},
    fr:{title:"Vos succès",sub:"Débloquez des badges en explorant",done:"débloqués",of:"sur",how:"Comment débloquer",
        firstBias:"Premier bias",firstBiasH:"Suivez votre premier artiste",
        multistan:"Multistan",multistanH:"Suivez 5 artistes",
        devoted:"Dévoué",devotedH:"Suivez 10 artistes",
        quizStreak:"Série de quiz",quizStreakH:"Atteignez une série de 3 jours",
        voter:"Votant",voterH:"Votez au Bias Battle",
        explorer:"Explorateur",explorerH:"Voyez 8 artistes différents",
        polyglot:"Polyglotte",polyglotH:"Changez la langue de l'appli",
        allDone:"Tous les badges débloqués — légende ! 🏆",cta:"Découvrir des artistes"},
    de:{title:"Deine Erfolge",sub:"Schalte Abzeichen beim Entdecken frei",done:"freigeschaltet",of:"von",how:"So schaltest du frei",
        firstBias:"Erster Bias",firstBiasH:"Folge deinem ersten Act",
        multistan:"Multistan",multistanH:"Folge 5 Acts",
        devoted:"Treuer Fan",devotedH:"Folge 10 Acts",
        quizStreak:"Quiz-Serie",quizStreakH:"Erreiche eine 3-Tage-Serie",
        voter:"Wähler",voterH:"Stimme im Bias Battle ab",
        explorer:"Entdecker",explorerH:"Sieh dir 8 verschiedene Acts an",
        polyglot:"Polyglott",polyglotH:"Ändere die App-Sprache",
        allDone:"Alle Abzeichen frei — Legende! 🏆",cta:"Acts entdecken"},
    pt:{title:"Suas conquistas",sub:"Desbloqueie selos ao explorar",done:"desbloqueados",of:"de",how:"Como desbloquear",
        firstBias:"Primeiro bias",firstBiasH:"Siga seu primeiro artista",
        multistan:"Multistan",multistanH:"Siga 5 artistas",
        devoted:"Devoto",devotedH:"Siga 10 artistas",
        quizStreak:"Sequência de quiz",quizStreakH:"Alcance uma sequência de 3 dias",
        voter:"Votante",voterH:"Vote na Batalha de Bias",
        explorer:"Explorador",explorerH:"Veja 8 artistas diferentes",
        polyglot:"Poliglota",polyglotH:"Mude o idioma do app",
        allDone:"Todos os selos desbloqueados — lenda! 🏆",cta:"Descobrir artistas"},
    id:{title:"Pencapaianmu",sub:"Buka lencana sambil menjelajah",done:"terbuka",of:"dari",how:"Cara membuka",
        firstBias:"Bias Pertama",firstBiasH:"Ikuti artis pertamamu",
        multistan:"Multistan",multistanH:"Ikuti 5 artis",
        devoted:"Setia",devotedH:"Ikuti 10 artis",
        quizStreak:"Streak Kuis",quizStreakH:"Capai streak kuis 3 hari",
        voter:"Pemilih",voterH:"Beri suara di Bias Battle",
        explorer:"Penjelajah",explorerH:"Lihat 8 artis berbeda",
        polyglot:"Poliglot",polyglotH:"Ganti bahasa aplikasi",
        allDone:"Semua lencana terbuka — legenda! 🏆",cta:"Temukan artis"}
  };
  var t=function(k){var o=I18N[L]||I18N.en; return (o&&o[k]!=null)?o[k]:(I18N.en[k]!=null?I18N.en[k]:k);};

  function readJSON(key){try{var v=localStorage.getItem(key); return v==null?null:JSON.parse(v);}catch(e){return null;}}
  function arr(v){return Array.isArray(v)?v:[];}

  function followCount(){return arr(readJSON("kp_kpop_follow")).length;}

  function quizStreak(){
    var q=readJSON("kpp_quiz");
    if(q==null) return 0;
    if(typeof q==="number") return q;
    if(typeof q==="object"){
      var keys=["streak","s","count","days","best"];
      for(var i=0;i<keys.length;i++){ if(typeof q[keys[i]]==="number") return q[keys[i]]; }
    }
    return 0;
  }
  function hasVoted(){
    var p=readJSON("kpp_poll");
    if(p==null) return false;
    if(Array.isArray(p)) return p.length>0;
    if(typeof p==="object"){ for(var k in p){ if(Object.prototype.hasOwnProperty.call(p,k)) return true; } return false; }
    return !!p;
  }
  function recentCount(){
    var r=readJSON("kpp_recent");
    if(Array.isArray(r)) return r.length;
    if(r&&Array.isArray(r.ids)) return r.ids.length;
    return 0;
  }
  // Polyglot: track if the language was ever changed from the initial. Best-effort.
  function langChanged(){
    try{
      var seen=localStorage.getItem("kpp"+FKEY+"_seenlang");
      var cur=localStorage.getItem("kp_lang")||"";
      var flag=localStorage.getItem("kpp"+FKEY+"_changed")==="1";
      if(seen==null){ localStorage.setItem("kpp"+FKEY+"_seenlang",cur); return flag; }
      if(cur && cur!==seen){ localStorage.setItem("kpp"+FKEY+"_changed","1"); localStorage.setItem("kpp"+FKEY+"_seenlang",cur); return true; }
      return flag;
    }catch(e){return false;}
  }

  function pop(){
    var r=(window.KPOP_ROSTER&&Array.isArray(window.KPOP_ROSTER))?window.KPOP_ROSTER:[];
    return r.length?r[0]:null;
  }

  function badges(){
    var f=followCount(), qs=quizStreak(), rc=recentCount();
    var list=[
      {key:"firstBias",emoji:"⭐",cur:Math.min(f,1),goal:1,unlocked:f>=1,prog:f>=1?null:f+"/1"},
      {key:"multistan",emoji:"💞",cur:Math.min(f,5),goal:5,unlocked:f>=5,prog:f>=5?null:Math.min(f,5)+"/5"},
      {key:"devoted",emoji:"🔥",cur:Math.min(f,10),goal:10,unlocked:f>=10,prog:f>=10?null:Math.min(f,10)+"/10"},
      {key:"quizStreak",emoji:"🧠",cur:Math.min(qs,3),goal:3,unlocked:qs>=3,prog:qs>=3?null:Math.min(qs,3)+"/3"},
      {key:"voter",emoji:"🗳️",cur:hasVoted()?1:0,goal:1,unlocked:hasVoted(),prog:hasVoted()?null:"0/1"},
      {key:"explorer",emoji:"🧭",cur:Math.min(rc,8),goal:8,unlocked:rc>=8,prog:rc>=8?null:Math.min(rc,8)+"/8"}
    ];
    if(langChanged()) list.push({key:"polyglot",emoji:"🌐",cur:1,goal:1,unlocked:true,prog:null});
    return list;
  }

  function injectCSS(){
    if(document.getElementById(CSSID)) return;
    var s=document.createElement("style"); s.id=CSSID;
    s.textContent=
    '#kpp-'+FKEY+'-card{background:var(--surface,#15151f);border:1px solid var(--border,rgba(255,255,255,.12));border-radius:16px;padding:16px 18px;margin-bottom:16px}'+
    '#kpp-'+FKEY+'-card .kpp-'+FKEY+'-hd{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:2px}'+
    '#kpp-'+FKEY+'-card h3{font-size:15px;font-weight:900;margin:0;color:var(--text,#fff);letter-spacing:-.01em}'+
    '#kpp-'+FKEY+'-card .kpp-'+FKEY+'-count{font-size:12px;font-weight:800;color:var(--accent,#ff2e74);margin-left:auto}'+
    '#kpp-'+FKEY+'-card .kpp-'+FKEY+'-sub{font-size:12px;color:var(--text3,#8a93a0);margin:0 0 12px}'+
    '#kpp-'+FKEY+'-bar{height:6px;border-radius:99px;background:var(--bg,#0c0c14);overflow:hidden;margin:0 0 14px;border:1px solid var(--border,rgba(255,255,255,.12))}'+
    '#kpp-'+FKEY+'-bar>i{display:block;height:100%;background:var(--kp-grad,linear-gradient(90deg,#ff2e74,#b14bff));border-radius:99px;transition:width .5s ease}'+
    '#kpp-'+FKEY+'-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px}'+
    '.kpp-'+FKEY+'-b{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:12px 8px 11px;border-radius:14px;background:var(--bg,#0c0c14);border:1px solid var(--border,rgba(255,255,255,.12));cursor:default}'+
    '.kpp-'+FKEY+'-b .ico{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:23px;line-height:1;background:rgba(255,255,255,.05)}'+
    '.kpp-'+FKEY+'-b.on{border-color:var(--accent,#ff2e74)}'+
    '.kpp-'+FKEY+'-b.on .ico{background:var(--kp-grad,linear-gradient(135deg,#ff2e74,#b14bff));box-shadow:0 4px 16px rgba(255,46,116,.32)}'+
    '.kpp-'+FKEY+'-b.off{opacity:.55}'+
    '.kpp-'+FKEY+'-b.off .ico{filter:grayscale(1)}'+
    '.kpp-'+FKEY+'-b .nm{font-size:11.5px;font-weight:800;color:var(--text,#fff);line-height:1.15}'+
    '.kpp-'+FKEY+'-b.off .nm{color:var(--text2,#aab)}'+
    '.kpp-'+FKEY+'-b .hint{font-size:10px;line-height:1.2;color:var(--text3,#8a93a0)}'+
    '.kpp-'+FKEY+'-b .pg{font-size:10px;font-weight:800;color:var(--accent,#ff2e74)}'+
    '.kpp-'+FKEY+'-b .tick{position:absolute;top:7px;right:7px;font-size:11px;color:var(--accent,#ff2e74)}'+
    '.kpp-'+FKEY+'-b:focus-visible{outline:2px solid var(--accent,#ff2e74);outline-offset:2px}'+
    '#kpp-'+FKEY+'-foot{margin-top:13px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}'+
    '#kpp-'+FKEY+'-foot .msg{font-size:12px;font-weight:800;color:var(--text,#fff)}'+
    '#kpp-'+FKEY+'-foot button{margin-left:auto;border:0;border-radius:99px;padding:8px 14px;font-size:12px;font-weight:800;color:#fff;cursor:pointer;background:var(--kp-grad,linear-gradient(90deg,#ff2e74,#b14bff))}'+
    '#kpp-'+FKEY+'-foot button:focus-visible{outline:2px solid var(--text,#fff);outline-offset:2px}'+
    '@media (prefers-reduced-motion:reduce){#kpp-'+FKEY+'-bar>i{transition:none}.kpp-'+FKEY+'-b.on .ico{box-shadow:none}}';
    document.head.appendChild(s);
  }

  function el(tag,cls,txt){var e=document.createElement(tag); if(cls)e.className=cls; if(txt!=null)e.textContent=txt; return e;}

  var card=null;
  function build(){
    card=el("div"); card.id="kpp-"+FKEY+"-card";
    card.setAttribute("aria-label",t("title"));
    mount.appendChild(card);
  }

  function render(){
    if(!card) return;
    while(card.firstChild) card.removeChild(card.firstChild);
    var bs=badges();
    var got=0; for(var i=0;i<bs.length;i++){ if(bs[i].unlocked) got++; }

    var hd=el("div","kpp-"+FKEY+"-hd");
    hd.appendChild(el("h3",null,t("title")));
    hd.appendChild(el("span","kpp-"+FKEY+"-count",got+" "+t("of")+" "+bs.length+" "+t("done")));
    card.appendChild(hd);
    card.appendChild(el("p","kpp-"+FKEY+"-sub",t("sub")));

    var bar=el("div"); bar.id="kpp-"+FKEY+"-bar";
    var fill=el("i"); fill.style.width=(bs.length?Math.round(got/bs.length*100):0)+"%";
    bar.appendChild(fill); card.appendChild(bar);

    var grid=el("div"); grid.id="kpp-"+FKEY+"-grid";
    for(var j=0;j<bs.length;j++){
      var b=bs[j];
      var name=t(b.key), how=b.unlocked?name:(t(b.key+"H")||t("how"));
      var aria=name+" — "+(b.unlocked?t("done"):how+(b.prog?" ("+b.prog+")":""));
      var cell=el("div","kpp-"+FKEY+"-b "+(b.unlocked?"on":"off"));
      cell.setAttribute("role","img");
      cell.setAttribute("aria-label",aria);
      cell.setAttribute("tabindex","0");
      var ico=el("span","ico",b.emoji);
      ico.setAttribute("aria-hidden","true");
      cell.appendChild(ico);
      cell.appendChild(el("span","nm",name));
      if(b.unlocked){
        var tk=el("span","tick","✓"); tk.setAttribute("aria-hidden","true"); cell.appendChild(tk);
      }else{
        cell.appendChild(el("span","hint",t(b.key+"H")));
        if(b.prog) cell.appendChild(el("span","pg",b.prog));
      }
      grid.appendChild(cell);
    }
    card.appendChild(grid);

    var allDone=got===bs.length && bs.length>0;
    var needsMore=got<bs.length;
    if(allDone || (got>0 && needsMore)){
      var foot=el("div"); foot.id="kpp-"+FKEY+"-foot";
      if(allDone){
        foot.appendChild(el("span","msg",t("allDone")));
      }else{
        var p=pop();
        if(p){
          var btn=el("button",null,t("cta")); btn.type="button";
          btn.setAttribute("aria-label",t("cta"));
          (function(id){
            btn.addEventListener("click",function(){
              if(typeof window.kpOpenArtist==="function"){ try{ window.kpOpenArtist(id); return; }catch(e){} }
              location.href=pf(id);
            });
          })(p.id);
          foot.appendChild(btn);
        }
      }
      if(foot.firstChild) card.appendChild(foot);
    }
  }

  // idempotent mount guard
  if(mount.getAttribute("data-"+FLAG)==="1") return;
  mount.setAttribute("data-"+FLAG,"1");

  injectCSS();
  build();
  render();

  var pending=false;
  function schedule(){
    if(pending) return; pending=true;
    (window.requestAnimationFrame||function(f){setTimeout(f,16);})(function(){ pending=false; try{render();}catch(e){} });
  }
  window.addEventListener("kp:follows",schedule);
  window.addEventListener("kpp:update",schedule);
  window.addEventListener("storage",function(e){
    if(!e||!e.key) return;
    if(e.key==="kp_kpop_follow"||e.key==="kpp_quiz"||e.key==="kpp_poll"||e.key==="kpp_recent"||e.key==="kp_lang") schedule();
  });
})();

/* ===== discover: Popular comparisons & deep guides — internal linking for SEO traffic ===== */
(function(){
  "use strict";
  var mount=document.querySelector("#kpop-discover-slot");
  if(!mount||mount.getAttribute("data-kpp-discover")==="1") return;
  mount.setAttribute("data-kpp-discover","1");
  var L=(localStorage.getItem("kp_lang")||(navigator.language||"en").slice(0,2)||"en").toLowerCase();
  var SUP=["en","ko","ja","zh","es","fr","de","pt","id","ar","hi","ru","vi","th"];
  if(SUP.indexOf(L)<0) L="en";
  var T={
    en:{h:"Discover K-Pop",sub:"Popular comparisons and deep guides",vs:"Group comparison",browse:"Browse all artists",glossary:"K-Pop glossary",light:"Lightstick guide",releases:"2026 releases"},
    ko:{h:"K-Pop 둘러보기",sub:"인기 비교 · 심화 가이드",vs:"그룹 비교",browse:"전체 아티스트",glossary:"K-Pop 용어집",light:"응원봉 가이드",releases:"2026 발매"},
    ja:{h:"K-POPを発見",sub:"人気比較と深掘りガイド",vs:"グループ比較",browse:"全アーティスト",glossary:"K-POP用語集",light:"ペンライトガイド",releases:"2026リリース"},
    zh:{h:"探索 K-pop",sub:"热门对比与深度指南",vs:"团体对比",browse:"全部艺人",glossary:"K-pop 术语",light:"应援棒指南",releases:"2026 发行"},
    es:{h:"Descubre K-pop",sub:"Comparaciones y guías",vs:"Comparación",browse:"Todos los artistas",glossary:"Glosario K-pop",light:"Guía de lightsticks",releases:"Lanzamientos 2026"},
    fr:{h:"Découvrir la K-pop",sub:"Comparaisons et guides",vs:"Comparaison",browse:"Tous les artistes",glossary:"Glossaire K-pop",light:"Guide lightsticks",releases:"Sorties 2026"},
    de:{h:"K-Pop entdecken",sub:"Vergleiche & Guides",vs:"Gruppenvergleich",browse:"Alle Künstler",glossary:"K-Pop-Glossar",light:"Lightstick-Guide",releases:"Releases 2026"},
    pt:{h:"Descubra K-pop",sub:"Comparações e guias",vs:"Comparação",browse:"Todos os artistas",glossary:"Glossário K-pop",light:"Guia de lightsticks",releases:"Lançamentos 2026"},
    id:{h:"Jelajahi K-pop",sub:"Perbandingan & panduan",vs:"Perbandingan grup",browse:"Semua artis",glossary:"Glosarium K-pop",light:"Panduan lightstick",releases:"Rilis 2026"},
    ar:{h:"اكتشف K-Pop",sub:"مقارنات وأدلة",vs:"مقارنة فرق",browse:"كل الفنانين",glossary:"قاموس K-Pop",light:"دليل اللايت ستيك",releases:"إصدارات 2026"},
    hi:{h:"K-Pop खोजें",sub:"तुलना और गाइड",vs:"ग्रुप तुलना",browse:"सभी आर्टिस्ट",glossary:"K-Pop शब्दकोश",light:"लाइटस्टिक गाइड",releases:"2026 रिलीज़"},
    ru:{h:"Откройте K-pop",sub:"Сравнения и гайды",vs:"Сравнение групп",browse:"Все артисты",glossary:"Глоссарий K-pop",light:"Гайд по лайтстикам",releases:"Релизы 2026"},
    vi:{h:"Khám phá K-pop",sub:"So sánh và hướng dẫn",vs:"So sánh nhóm",browse:"Tất cả nghệ sĩ",glossary:"Thuật ngữ K-pop",light:"Hướng dẫn lightstick",releases:"Phát hành 2026"},
    th:{h:"ค้นพบ K-pop",sub:"เปรียบเทียบและไกด์",vs:"เปรียบเทียบวง",browse:"ศิลปินทั้งหมด",glossary:"ศัพท์ K-pop",light:"ไกด์ไลท์สติ๊ก",releases:"ผลงาน 2026"}
  };
  var t=T[L]||T.en;
  function d(){return SUP.indexOf(L)>=0&&L!=="en"?L+"/":"";}
  function vsPf(a,b){return "/"+d()+"kpop-vs/"+a+"-vs-"+b;}
  function guidePf(s){return "/"+d()+"kpop/"+s;}
  var PAIRS=[["bts","seventeen"],["blackpink","twice"],["newjeans","lesserafim"],["aespa","ive"],["straykids","ateez"],["txt","enhypen"]];
  var roster=Array.isArray(window.KPOP_ROSTER)?window.KPOP_ROSTER:[],byId={};
  roster.forEach(function(a){if(a&&a.id)byId[a.id]=a;});
  var cards="";
  PAIRS.forEach(function(p){
    var ra=byId[p[0]],rb=byId[p[1]];if(!ra||!rb)return;
    var label=(ra.nameEn||p[0])+" vs "+(rb.nameEn||p[1]);
    cards+='<a class="kp-discover-card is-vs" href="'+vsPf(p[0],p[1])+'"><span>⚖️ '+label+'</span><small>'+t.vs+'</small></a>';
  });
  cards+='<a class="kp-discover-card" href="'+guidePf("browse")+'"><span>📚 '+t.browse+'</span></a>';
  cards+='<a class="kp-discover-card" href="'+guidePf("glossary")+'"><span>📖 '+t.glossary+'</span></a>';
  cards+='<a class="kp-discover-card" href="'+guidePf("kpop-lightsticks-list")+'"><span>💡 '+t.light+'</span></a>';
  cards+='<a class="kp-discover-card" href="'+guidePf("kpop-releases-2026")+'"><span>💿 '+t.releases+'</span></a>';
  mount.innerHTML='<section class="kp-discover" aria-label="'+t.h+'"><h2 class="kp-discover-h">'+t.h+'</h2><p class="kp-discover-sub">'+t.sub+'</p><div class="kp-discover-grid">'+cards+'</div></section>';
})();

/* ===== hub-faq: Visible FAQ + FAQPage JSON-LD for rich results ===== */
(function(){
  "use strict";
  var mount=document.querySelector("#kpop-faq-slot");
  if(!mount||mount.getAttribute("data-kpp-faq")==="1") return;
  mount.setAttribute("data-kpp-faq","1");
  var L=(localStorage.getItem("kp_lang")||(navigator.language||"en").slice(0,2)||"en").toLowerCase();
  var FAQ={
    en:{h:"K-Pop FAQ",items:[["What is KoreaPlus K-Pop Now?","A free real-time hub for charts, comeback countdowns, idol birthdays, artist profiles and news — in 14 languages."],["How often are charts updated?","Apple Music Korea charts refresh when you load the page; comeback and birthday data update daily from our curated roster."],["Can I follow my bias?","Yes — tap the star on any artist. Your follows personalize countdowns, news and the For You tab (saved on this device)."],["Are the group comparison pages biased?","No — comparison pages list only verifiable facts (debut, members, agency, genre). We never rank one group above another."],["How do I read guides in my language?","Use the language picker in the header, or open localized URLs like /ko/kpop/ for Korean profiles and guides."]]},
    ko:{h:"K-Pop FAQ",items:[["KoreaPlus K-Pop Now란?","실시간 차트, 컴백 카운트다운, 생일, 프로필, 뉴스를 14개 언어로 제공하는 무료 허브입니다."],["차트는 얼마나 자주 갱신되나요?","Apple Music Korea 차트는 페이지 로드 시 갱신되며, 컴백·생일 데이터는 매일 업데이트됩니다."],["최애를 팔로우할 수 있나요?","네 — 아티스트 카드의 별을 누르면 이 기기에 저장되어 컴백·뉴스가 맞춤화됩니다."],["그룹 비교 페이지는 편향되나요?","아니요 — 데뷔, 멤버 수, 소속사, 장르만 나열하며 순위를 매기지 않습니다."],["내 언어로 가이드를 보려면?","헤더 언어 선택기를 쓰거나 /ko/kpop/ 같은 로컬 URL을 이용하세요."]]}
  };
  var pack=FAQ[L]||FAQ.en;
  var html='<section class="kp-hub-faq"><h2 class="kpop-sec-title">❓ '+pack.h+'</h2><div class="seo-faq">';
  var ld={"@context":"https://schema.org","@type":"FAQPage","mainEntity":[]};
  pack.items.forEach(function(row){
    html+='<details><summary>'+row[0]+'</summary><p>'+row[1]+'</p></details>';
    ld.mainEntity.push({"@type":"Question","name":row[0],"acceptedAnswer":{"@type":"Answer","text":row[1]}});
  });
  html+='</div></section>';
  mount.innerHTML=html;
  var s=document.createElement("script");s.type="application/ld+json";
  s.textContent=JSON.stringify(ld).replace(/</g,"\\u003c");
  document.head.appendChild(s);
})();
