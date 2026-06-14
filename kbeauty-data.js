/* ══════════════════════════════════════════════════════════════════════════
   kbeauty-data.js — manual source-of-truth tier for the /k-beauty vertical.

   PURPOSE: the hub renders 100% with ZERO API keys from this file. Live data
   (AliExpress product grid, Wikidata brand bios) layers on top via the Worker
   (/api/kbeauty/*) ONLY when reachable — never required for the page to work.

   CONTENT POLICY (legal-safe, FTC/FDA-aware):
   - Facts only. Ingredient/benefit copy uses STRUCTURE-FUNCTION language
     ("helps, supports, hydrates, soothes") — never "treats / cures / heals".
   - No reproduced proprietary ratings (EWG/COSDNA/Paula's Choice) and no
     trademarked quiz wording — our quiz maps to published skin-type facts only.
   - Brand & product names are nominative fair use; we host NO brand/agency
     images (emoji + text only here; product photos come only from the live
     AliExpress seller-listing grid in the Worker).

   IDs are stable keys cross-referenced across sections (concerns ↔ ingredients
   ↔ routine ↔ conflicts). Edit freely; keep ids consistent.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Skin types (simple taxonomy) ──────────────────────────────────────────
   The quiz scores into one of these. Each drives routine + product emphasis. */
const KBEAUTY_SKINTYPES = [
  { id:'dry',         name:'Dry',         emoji:'🏜️', desc:'Tight, flaky or rough; little visible oil. Craves hydration + barrier support.',           focus:['hydration','barrier','occlusives'] },
  { id:'oily',        name:'Oily',        emoji:'💧', desc:'Shiny by midday, enlarged pores, prone to congestion. Likes lightweight, balancing care.', focus:['oil-control','lightweight','pores'] },
  { id:'combination', name:'Combination', emoji:'🌗', desc:'Oily T-zone, normal-to-dry cheeks. Needs zone-aware, balanced layering.',                  focus:['balance','lightweight-hydration'] },
  { id:'sensitive',   name:'Sensitive',   emoji:'🌸', desc:'Reacts, stings or flushes easily. Prioritises soothing, fragrance-free, minimal actives.', focus:['soothing','barrier','minimal'] },
  { id:'normal',      name:'Normal',      emoji:'✨', desc:'Balanced, few concerns. A simple maintenance routine keeps it glowing.',                   focus:['maintenance','glow'] },
];

/* ── Skin-type quiz (in-house wording; maps to the taxonomy above) ──────────
   Each option adds points to skin-type ids. Highest total wins; ties → combination. */
const KBEAUTY_QUIZ = [
  { id:'q1', q:'A few hours after washing, your skin feels…',
    options:[
      { label:'Tight or flaky',                 score:{ dry:2, sensitive:1 } },
      { label:'Shiny all over',                 score:{ oily:2 } },
      { label:'Oily T-zone, normal cheeks',     score:{ combination:2 } },
      { label:'Comfortable and balanced',       score:{ normal:2 } },
    ] },
  { id:'q2', q:'How do your pores look?',
    options:[
      { label:'Barely visible',                 score:{ dry:1, normal:1 } },
      { label:'Large in the T-zone',            score:{ oily:2, combination:1 } },
      { label:'Visible on nose & forehead only',score:{ combination:2 } },
      { label:'Average, even',                  score:{ normal:2 } },
    ] },
  { id:'q3', q:'New products or actives tend to…',
    options:[
      { label:'Sting, redden or itch',          score:{ sensitive:3 } },
      { label:'Be fine most of the time',       score:{ normal:1, oily:1 } },
      { label:'Sometimes cause dry patches',    score:{ dry:1, combination:1 } },
      { label:'Never bother me',                score:{ normal:2 } },
    ] },
  { id:'q4', q:'By the end of the day, your makeup / skin is…',
    options:[
      { label:'Clinging to dry patches',        score:{ dry:2 } },
      { label:'Slipping from oil',              score:{ oily:2 } },
      { label:'Oily nose, dry elsewhere',       score:{ combination:2 } },
      { label:'Pretty much how it started',     score:{ normal:2 } },
    ] },
  { id:'q5', q:'Which bothers you most?',
    options:[
      { label:'Redness & reactivity',           score:{ sensitive:2 } },
      { label:'Dehydration & dullness',         score:{ dry:2 } },
      { label:'Shine & breakouts',              score:{ oily:2 } },
      { label:'Nothing major',                  score:{ normal:2 } },
    ] },
];

/* ── Concerns (concern-first entry — the strongest search & shopping intent) ─
   lookFor references KBEAUTY_INGREDIENTS ids. */
const KBEAUTY_CONCERNS = [
  { id:'acne',        name:'Acne & breakouts',      emoji:'🔴', desc:'Clogged pores, blemishes and post-acne marks.',            lookFor:['bha','niacinamide','centella','azelaic','heartleaf'],   avoid:'Heavy occlusive oils, high fragrance', tip:'Treat gently — over-stripping makes oil & breakouts worse. Patch-test new actives.' },
  { id:'aging',       name:'Anti-ageing & firmness',emoji:'⏳', desc:'Fine lines, loss of bounce and firmness.',                  lookFor:['retinol','peptides','vitaminc','pdrn','bakuchiol'],     avoid:'Skipping daily SPF (the #1 ageing factor)', tip:'Sunscreen every morning does more for ageing than any serum.' },
  { id:'pigmentation',name:'Dark spots & tone',     emoji:'🟤', desc:'Hyperpigmentation, melasma, uneven tone, post-acne marks.', lookFor:['vitaminc','niacinamide','tranexamic','arbutin','azelaic'], avoid:'Unprotected sun exposure', tip:'Brightening actives only work paired with diligent SPF — UV undoes the progress.' },
  { id:'redness',     name:'Redness & sensitivity', emoji:'🌡️', desc:'Flushing, reactivity, compromised barrier.',                lookFor:['centella','madecassoside','panthenol','mugwort','ceramide'], avoid:'Fragrance, drying alcohol, harsh scrubs', tip:'Repair the barrier first; add actives slowly, one at a time.' },
  { id:'pores',       name:'Pores & texture',       emoji:'🕳️', desc:'Visible pores, rough or bumpy texture.',                    lookFor:['bha','niacinamide','pha','retinol','aha'],            avoid:'Pore-clogging heavy creams if oily', tip:'BHA dissolves oil inside pores; niacinamide helps refine the look over weeks.' },
  { id:'dryness',     name:'Dryness & dehydration', emoji:'🥵', desc:'Tightness, flaking, dull dehydrated skin.',                 lookFor:['hyaluronic','ceramide','panthenol','squalane','betaglucan'], avoid:'Hot water, foaming over-cleansing', tip:'Layer a humectant on damp skin, then seal with a cream — the “7-skin” idea.' },
  { id:'dullness',    name:'Dullness & glow',       emoji:'🌟', desc:'Tired, flat, uneven, lacklustre skin.',                     lookFor:['vitaminc','aha','niacinamide','ginseng','galactomyces'], avoid:'Build-up from skipping exfoliation', tip:'Gentle exfoliation + vitamin C + hydration = the “glass skin” glow.' },
  { id:'oiliness',    name:'Oil control',           emoji:'🛢️', desc:'Excess shine and midday grease.',                          lookFor:['niacinamide','bha','greentea','pha','azelaic'],        avoid:'Stripping cleansers (rebound oil)', tip:'Don’t fight oil with harsh products — balance and lightweight hydration work better.' },
];

/* ── The Korean routine (canonical order; AM/PM aware) ──────────────────────
   time: 'am' | 'pm' | 'both'. The builder shows AM and PM views and filters
   optional/exfoliation steps appropriately. */
const KBEAUTY_ROUTINE = [
  { id:'oilcleanse',  step:1, name:'Oil cleanser / balm', emoji:'🫗', time:'pm',   desc:'First half of the double cleanse — melts sunscreen, makeup and sebum.', layering:'On dry hands & dry face, then emulsify with water.', productType:'cleansing oil/balm', optional:false, freq:'PM daily' },
  { id:'watercleanse',step:2, name:'Water-based cleanser',emoji:'🧼', time:'both', desc:'Gentle low-pH cleanser removes the rest without stripping the barrier.', layering:'Lukewarm water; 30–60s massage.', productType:'gel/foam cleanser', optional:false, freq:'AM & PM' },
  { id:'exfoliate',   step:3, name:'Exfoliant',           emoji:'✨', time:'pm',   desc:'Chemical exfoliant (AHA/BHA/PHA) clears dead cells & unclogs pores.', layering:'1–3× per week, PM only. Never with retinol the same night.', productType:'AHA/BHA/PHA', optional:true, freq:'1–3×/week PM' },
  { id:'toner',       step:4, name:'Toner / skin',        emoji:'💦', time:'both', desc:'Hydrating toner rebalances and preps skin to absorb the next steps.', layering:'Pat in with hands; layer 2–3× for the “7-skin” method.', productType:'hydrating toner', optional:false, freq:'AM & PM' },
  { id:'essence',     name:'Essence',     step:5, time:'both', emoji:'🌿', desc:'Lightweight ferment/hydration layer — the heart of K-beauty glow.', layering:'Press into damp skin.', productType:'essence', optional:false, freq:'AM & PM' },
  { id:'treatment',   name:'Serum / ampoule', step:6, time:'both', emoji:'🧪', desc:'Your targeted active for your concern (brightening, firming, calming).', layering:'AM: antioxidants (vit C). PM: retinol/exfoliating actives.', productType:'serum/ampoule', optional:false, freq:'AM & PM (concern-based)' },
  { id:'mask',        name:'Sheet mask',  step:7, time:'pm',   emoji:'🎭', desc:'Optional flood of hydration/soothing actives.', layering:'10–20 min; pat in the leftover essence.', productType:'sheet/wash-off mask', optional:true, freq:'1–4×/week' },
  { id:'eye',         name:'Eye cream',   step:8, time:'both', emoji:'👁️', desc:'Lighter formula for the delicate eye area; hydration & peptides.', layering:'Gentle ring-finger tap.', productType:'eye cream', optional:true, freq:'AM & PM' },
  { id:'moisturizer', name:'Moisturizer', step:9, time:'both', emoji:'🧴', desc:'Locks in everything; ceramides & humectants seal the barrier.', layering:'Thinnest → thickest rule ends here (before SPF).', productType:'moisturizer/cream', optional:false, freq:'AM & PM' },
  { id:'sunscreen',   name:'Sunscreen (SPF)', step:10, time:'am', emoji:'☀️', desc:'The single most important anti-ageing step. Every morning, rain or shine.', layering:'Last AM step; ~2 finger-lengths; reapply midday.', productType:'SPF 50+ PA++++', optional:false, freq:'AM daily' },
  { id:'sleeping',    name:'Sleeping mask / occlusive', step:11, time:'pm', emoji:'🌙', desc:'Optional final PM seal (“slugging”) for extra overnight repair.', layering:'Thin layer as the very last PM step.', productType:'sleeping mask', optional:true, freq:'PM as needed' },
];

/* ── Hero ingredient encyclopedia ──────────────────────────────────────────
   preg: 'safe' | 'caution'  ·  bestFor references KBEAUTY_CONCERNS ids.
   pairsWith / avoidWith reference other ingredient ids. */
const KBEAUTY_INGREDIENTS = [
  { id:'snail',       name:'Snail Mucin',          korean:'달팽이 점액', emoji:'🐌', cat:'repair',     star:true,  bestFor:['dryness','redness','acne'],       benefits:['Hydrates & helps support a smoother, bouncier skin feel','Loved for soothing post-blemish marks'], pairsWith:['hyaluronic','niacinamide','centella'], avoidWith:[], preg:'safe',    time:'both', explainer:'Snail secretion filtrate is a K-beauty icon — a glossy hydrator famed for that plump, dewy finish.' },
  { id:'centella',    name:'Centella (Cica)',      korean:'센텔라/시카', emoji:'🌿', cat:'soothing',   star:true,  bestFor:['redness','acne','aging'],         benefits:['Helps calm visible redness & irritation','Supports a comfortable, resilient barrier'], pairsWith:['niacinamide','panthenol','hyaluronic'], avoidWith:[], preg:'safe', time:'both', explainer:'“Cica” = Centella asiatica (tiger grass). The go-to soother for sensitive, stressed or breakout-prone skin.' },
  { id:'niacinamide', name:'Niacinamide (B3)',     korean:'나이아신아마이드', emoji:'🧫', cat:'multi',  star:true,  bestFor:['pores','oiliness','pigmentation','acne'], benefits:['Helps refine the look of pores & even tone','Supports oil balance & barrier'], pairsWith:['hyaluronic','retinol','centella','vitaminc'], avoidWith:[], preg:'safe', time:'both', explainer:'The ultimate multitasker — 2–5% suits most skin. The old “don’t mix with vitamin C” rule is a debunked myth.' },
  { id:'hyaluronic',  name:'Hyaluronic Acid',      korean:'히알루론산', emoji:'💧', cat:'hydration',  star:true,  bestFor:['dryness','dullness'],             benefits:['Draws water into skin for instant plumping','Layers under anything'], pairsWith:['niacinamide','ceramide','snail'], avoidWith:[], preg:'safe', time:'both', explainer:'A humectant magnet for moisture. Apply to damp skin and seal with cream so it pulls water IN, not out.' },
  { id:'ceramide',    name:'Ceramides',            korean:'세라마이드', emoji:'🧱', cat:'barrier',    star:true,  bestFor:['dryness','redness'],              benefits:['Rebuilds the skin’s “mortar” to lock in moisture','Calms tightness & flaking'], pairsWith:['hyaluronic','panthenol','squalane'], avoidWith:[], preg:'safe', time:'both', explainer:'The skin barrier’s own lipids. Essential for dry, sensitive, or over-exfoliated skin.' },
  { id:'panthenol',   name:'Panthenol (Pro-B5)',   korean:'판테놀', emoji:'🩹', cat:'soothing',     star:false, bestFor:['redness','dryness'],              benefits:['Soothes & helps support healing of stressed skin','Lightweight hydration'], pairsWith:['centella','ceramide','hyaluronic'], avoidWith:[], preg:'safe', time:'both', explainer:'A gentle, universally tolerated soother — great in barrier-repair and post-active routines.' },
  { id:'propolis',    name:'Propolis',             korean:'프로폴리스', emoji:'🍯', cat:'soothing',   star:true,  bestFor:['acne','redness','dryness'],       benefits:['Comforting, nourishing glow','Antioxidant support'], pairsWith:['niacinamide','snail','centella'], avoidWith:[], preg:'safe', time:'both', explainer:'Bee-derived honey-like extract; a glow-giving favourite (skip if you have a bee-product allergy).' },
  { id:'mugwort',     name:'Mugwort (Artemisia)',  korean:'쑥', emoji:'🍵', cat:'soothing',         star:true,  bestFor:['redness','acne'],                 benefits:['Calms visibly irritated, reactive skin'], pairsWith:['centella','panthenol','heartleaf'], avoidWith:[], preg:'safe', time:'both', explainer:'A traditional Korean botanical (“ssuk”) prized for soothing sensitive, troubled skin.' },
  { id:'heartleaf',   name:'Heartleaf (Houttuynia)',korean:'어성초', emoji:'🌱', cat:'soothing',     star:true,  bestFor:['acne','redness','oiliness'],      benefits:['Calms & helps balance blemish-prone skin'], pairsWith:['centella','niacinamide','bha'], avoidWith:[], preg:'safe', time:'both', explainer:'Houttuynia cordata — a trending calming extract for oily, breakout-prone skin.' },
  { id:'rice',        name:'Rice Extract',         korean:'쌀', emoji:'🍚', cat:'brightening',       star:true,  bestFor:['dullness','dryness','pigmentation'], benefits:['Nourishing glow & softening','Helps brighten a tired look'], pairsWith:['niacinamide','hyaluronic'], avoidWith:[], preg:'safe', time:'both', explainer:'A heritage Korean ingredient for that soft, luminous “mochi skin” finish.' },
  { id:'ginseng',     name:'Ginseng',             korean:'인삼', emoji:'🫚', cat:'antioxidant',      star:false, bestFor:['aging','dullness'],               benefits:['Antioxidant, energising glow','Traditional firming favourite'], pairsWith:['peptides','niacinamide'], avoidWith:[], preg:'safe', time:'both', explainer:'A premium hanbang (Korean herbal) hero, central to luxury anti-ageing lines.' },
  { id:'greentea',    name:'Green Tea',           korean:'녹차', emoji:'🍃', cat:'antioxidant',      star:false, bestFor:['oiliness','acne','redness'],      benefits:['Antioxidant protection','Helps calm & balance oily skin'], pairsWith:['niacinamide','bha'], avoidWith:[], preg:'safe', time:'both', explainer:'Camellia sinensis from Jeju — antioxidant-rich and beloved for oily, sensitive skin.' },
  { id:'galactomyces',name:'Galactomyces Ferment', korean:'갈락토미세스', emoji:'🍶', cat:'brightening', star:false, bestFor:['dullness','pores'],            benefits:['Glow & smoother-looking texture'], pairsWith:['niacinamide','hyaluronic'], avoidWith:[], preg:'safe', time:'both', explainer:'A fermented essence star (think “first essence”) for radiance and refined texture.' },
  { id:'pdrn',        name:'PDRN (Salmon DNA)',    korean:'연어 DNA', emoji:'🐟', cat:'repair',      star:true,  bestFor:['aging','dullness'],               benefits:['Trending for a firm, “glass-skin” bounce'], pairsWith:['peptides','hyaluronic','niacinamide'], avoidWith:[], preg:'caution', time:'both', explainer:'Polydeoxyribonucleotide — the 2026 “salmon DNA” buzz active. Note: topical evidence is emerging; benefits are cosmetic, not the same as clinical injectables.' },
  { id:'peptides',    name:'Peptides',            korean:'펩타이드', emoji:'🔗', cat:'anti-aging',    star:true,  bestFor:['aging','redness'],                benefits:['Support firmness & a smoother look','Gentle, layer-friendly'], pairsWith:['niacinamide','hyaluronic','pdrn'], avoidWith:[], preg:'safe', time:'both', explainer:'Amino-acid chains that signal skin to look firmer — a gentle anti-ageing route, even for sensitive skin.' },
  { id:'vitaminc',    name:'Vitamin C',           korean:'비타민C', emoji:'🍊', cat:'brightening',    star:true,  bestFor:['pigmentation','dullness','aging'], benefits:['Brightens & evens tone','Antioxidant defence under SPF'], pairsWith:['niacinamide','hyaluronic'], avoidWith:['retinol'], preg:'safe', time:'am', explainer:'Best in the AM under sunscreen. Pure L-ascorbic acid is potent; derivatives are gentler for sensitive skin.' },
  { id:'retinol',     name:'Retinol',             korean:'레티놀', emoji:'🌙', cat:'anti-aging',      star:true,  bestFor:['aging','pores','acne'],           benefits:['Gold-standard for lines & texture over time'], pairsWith:['niacinamide','hyaluronic','ceramide'], avoidWith:['vitaminc','aha','bha'], preg:'caution', time:'pm', explainer:'PM only, start low & slow (1–2×/week), always SPF next day. Avoid during pregnancy.' },
  { id:'bakuchiol',   name:'Bakuchiol',           korean:'바쿠치올', emoji:'🌼', cat:'anti-aging',    star:false, bestFor:['aging','redness'],               benefits:['Plant “retinol alternative” feel, gentler'], pairsWith:['niacinamide','hyaluronic','vitaminc'], avoidWith:[], preg:'caution', time:'both', explainer:'A gentler, often better-tolerated alternative to retinol — but data on pregnancy safety is limited.' },
  { id:'aha',         name:'AHA (Glycolic/Lactic)',korean:'AHA', emoji:'🍋', cat:'exfoliant',        star:false, bestFor:['dullness','pigmentation','pores'],benefits:['Surface exfoliation for glow & even tone'], pairsWith:['hyaluronic','niacinamide'], avoidWith:['retinol','bha'], preg:'safe', time:'pm', explainer:'Water-loving acids that resurface the top layer. Lactic is gentler; glycolic is stronger. SPF a must.' },
  { id:'bha',         name:'BHA (Salicylic)',     korean:'BHA', emoji:'🧽', cat:'exfoliant',         star:true,  bestFor:['acne','pores','oiliness'],        benefits:['Oil-soluble — clears inside pores'], pairsWith:['niacinamide','centella','hyaluronic'], avoidWith:['retinol','aha'], preg:'caution', time:'pm', explainer:'Salicylic acid dives into oily pores to decongest. Ideal for blackheads & breakouts.' },
  { id:'pha',         name:'PHA (Gluconolactone)', korean:'PHA', emoji:'🫧', cat:'exfoliant',        star:false, bestFor:['pores','redness','dullness'],     benefits:['Gentlest exfoliating acid + hydration'], pairsWith:['hyaluronic','niacinamide'], avoidWith:[], preg:'safe', time:'pm', explainer:'Large-molecule acid that exfoliates very gently — great for sensitive skin new to acids.' },
  { id:'azelaic',     name:'Azelaic Acid',        korean:'아젤라산', emoji:'🌾', cat:'multi',         star:false, bestFor:['acne','redness','pigmentation'], benefits:['Helps calm redness & even tone','Gentle on reactive skin'], pairsWith:['niacinamide','centella'], avoidWith:[], preg:'safe', time:'both', explainer:'A multitasker beloved for redness, bumps and post-acne marks — usually well tolerated.' },
  { id:'tranexamic',  name:'Tranexamic Acid',     korean:'트라넥삼산', emoji:'⚪', cat:'brightening',  star:false, bestFor:['pigmentation','dullness'],        benefits:['Targets stubborn dark spots & tone'], pairsWith:['niacinamide','vitaminc'], avoidWith:[], preg:'safe', time:'both', explainer:'A favourite for melasma and stubborn pigmentation, often paired with niacinamide.' },
  { id:'arbutin',     name:'Alpha-Arbutin',       korean:'알부틴', emoji:'🫐', cat:'brightening',     star:false, bestFor:['pigmentation','dullness'],        benefits:['Gentle brightening for spots & tone'], pairsWith:['vitaminc','niacinamide'], avoidWith:[], preg:'caution', time:'both', explainer:'A gentle, stable brightener — a softer route to fading dark spots.' },
  { id:'madecassoside',name:'Madecassoside',      korean:'마데카소사이드', emoji:'🍀', cat:'soothing',  star:false, bestFor:['redness','aging'],               benefits:['The purified calming hero from centella'], pairsWith:['centella','panthenol','ceramide'], avoidWith:[], preg:'safe', time:'both', explainer:'The most studied active in cica — concentrated soothing & barrier support.' },
  { id:'betaglucan',  name:'Beta-Glucan',         korean:'베타글루칸', emoji:'🌾', cat:'hydration',    star:false, bestFor:['dryness','redness'],             benefits:['Deep hydration + soothing, rivals HA'], pairsWith:['hyaluronic','ceramide','centella'], avoidWith:[], preg:'safe', time:'both', explainer:'A soothing humectant that hydrates and calms — gentle enough for the most reactive skin.' },
  { id:'squalane',    name:'Squalane',            korean:'스쿠알란', emoji:'🫒', cat:'barrier',        star:false, bestFor:['dryness'],                       benefits:['Lightweight, non-greasy moisture seal'], pairsWith:['hyaluronic','ceramide'], avoidWith:[], preg:'safe', time:'both', explainer:'A skin-mimicking emollient (usually plant-derived) that softens without heaviness.' },
];

/* ── Active-conflict matrix ("what NOT to mix") ─────────────────────────────
   verdict: 'safe' | 'caution' | 'avoid'. Unlisted pairs default to 'safe'.
   The checker picks from CHECKABLE actives below. */
const KBEAUTY_CHECKABLE = ['retinol','vitaminc','aha','bha','pha','niacinamide','azelaic','bakuchiol','peptides','snail','centella','hyaluronic','arbutin','tranexamic'];
const KBEAUTY_CONFLICTS = [
  { a:'retinol', b:'aha',        verdict:'caution', reason:'Both increase irritation & sensitivity. Alternate on different nights rather than layering.' },
  { a:'retinol', b:'bha',        verdict:'caution', reason:'Combined exfoliation can over-strip. Use on separate nights.' },
  { a:'retinol', b:'vitaminc',   verdict:'caution', reason:'Not harmful, but better split: vitamin C in the AM, retinol in the PM.' },
  { a:'retinol', b:'bakuchiol',  verdict:'caution', reason:'Both target ageing — fine for some, but doubling up can irritate. Introduce one at a time.' },
  { a:'aha',     b:'bha',        verdict:'caution', reason:'Risk of over-exfoliation unless formulated together. Don’t stack separate strong products.' },
  { a:'aha',     b:'vitaminc',   verdict:'caution', reason:'Low-pH overlap can sting. Use at different times of day.' },
  { a:'bha',     b:'vitaminc',   verdict:'caution', reason:'Possible irritation for sensitive skin — separate AM/PM.' },
  { a:'aha',     b:'pha',        verdict:'caution', reason:'Both exfoliate — combining raises irritation risk. Pick one.' },
  { a:'bha',     b:'pha',        verdict:'caution', reason:'Both exfoliate — combining raises irritation risk. Pick one.' },
  { a:'niacinamide', b:'vitaminc', verdict:'safe',  reason:'The “don’t mix” claim is a debunked myth — they pair well in modern formulas.' },
  { a:'niacinamide', b:'retinol',  verdict:'safe',  reason:'Great pairing — niacinamide helps buffer retinol irritation.' },
  { a:'niacinamide', b:'aha',      verdict:'safe',  reason:'Fine together; niacinamide can soothe acid sensitivity.' },
  { a:'azelaic', b:'retinol',    verdict:'caution', reason:'Both can sensitise — introduce slowly or alternate.' },
];

/* ── Brand directory (tiered) ──────────────────────────────────────────────
   tier: 'drugstore' | 'mid' | 'luxury'  ·  hero = signature products (text only).
   wikidataId enables an optional 9-language bio via the Worker (zero-key). */
const KBEAUTY_BRANDS = [
  // Drugstore / Olive-Young tier (great value, beginner-friendly)
  { id:'cosrx',        name:'COSRX',             korean:'코스알엑스', emoji:'🐌', tier:'drugstore', vegan:false, men:true,  hero:['Advanced Snail 96 Essence','Snail Mucin','Centella Blemish'], knownFor:'Minimalist, ingredient-led blockbusters', intl:true,  wikidataId:'' },
  { id:'beautyofjoseon',name:'Beauty of Joseon', korean:'조선미녀', emoji:'🏯', tier:'drugstore', vegan:false, men:true,  hero:['Relief Sun SPF50','Glow Serum (Rice+Arbutin)','Ginseng Cream'], knownFor:'Hanbang glow & a cult sunscreen', intl:true, wikidataId:'' },
  { id:'anua',         name:'Anua',              korean:'아누아', emoji:'🌱', tier:'drugstore', vegan:false, men:true,  hero:['Heartleaf 77 Toner','Niacinamide Serum','PDRN Cream'], knownFor:'Heartleaf calming line', intl:true,  wikidataId:'' },
  { id:'skin1004',     name:'SKIN1004',          korean:'스킨천사', emoji:'🌴', tier:'drugstore', vegan:false, men:true,  hero:['Madagascar Centella Ampoule','Centella Tone Brightening','Hyalu-Cica'], knownFor:'Centella from Madagascar', intl:true, wikidataId:'' },
  { id:'roundlab',     name:'Round Lab',         korean:'라운드랩', emoji:'🌊', tier:'drugstore', vegan:false, men:true,  hero:['1025 Dokdo Toner','Birch Juice Moisturizer','Pine Calming'], knownFor:'Mineral-water, gentle daily care', intl:true, wikidataId:'' },
  { id:'isntree',      name:'Isntree',           korean:'이즌트리', emoji:'💙', tier:'drugstore', vegan:false, men:false, hero:['Hyaluronic Acid Toner','Green Tea Fresh','Chestnut BHA'], knownFor:'Hydration & gentle exfoliation', intl:true, wikidataId:'' },
  { id:'somebymi',     name:'Some By Mi',        korean:'썸바이미', emoji:'🌿', tier:'drugstore', vegan:false, men:false, hero:['AHA-BHA-PHA 30 Days Miracle','Snail Truecica','Yuja Niacin'], knownFor:'Blemish & texture sets', intl:true, wikidataId:'' },
  { id:'numbuzin',     name:'Numbuzin',          korean:'넘버즈인', emoji:'🔢', tier:'drugstore', vegan:false, men:true,  hero:['No.3 Skin Brightening Serum','No.5 Vitamin','No.1 Glass'], knownFor:'Numbered, concept-driven actives', intl:true, wikidataId:'' },
  { id:'torriden',     name:'Torriden',          korean:'토리든', emoji:'💎', tier:'drugstore', vegan:true,  men:true,  hero:['DIVE-IN Low Molecular HA Serum','Balanceful Cica','SolidIn'], knownFor:'Vegan hyaluronic hydration', intl:true, wikidataId:'' },
  { id:'mixsoon',      name:'Mixsoon',           korean:'믹순', emoji:'🫘', tier:'drugstore', vegan:true,  men:true,  hero:['Bean Essence','Centella Asiatica','Galactomyces'], knownFor:'Single-ingredient minimalism', intl:true, wikidataId:'' },
  { id:'medicube',     name:'Medicube',          korean:'메디큐브', emoji:'🩺', tier:'drugstore', vegan:false, men:true,  hero:['Zero Pore Pad','PDRN Pink Collagen','Deep Vita C'], knownFor:'Derma-tech tools & PDRN', intl:true, wikidataId:'' },
  { id:'tirtir',       name:'TIRTIR',            korean:'티르티르', emoji:'🎈', tier:'drugstore', vegan:false, men:false, hero:['Mask Fit Red Cushion','Milk Skin Toner'], knownFor:'Viral wide-shade cushion', intl:true, wikidataId:'' },
  { id:'innisfree',    name:'Innisfree',         korean:'이니스프리', emoji:'🍵', tier:'drugstore', vegan:false, men:true,  hero:['Green Tea Seed Serum','Volcanic Pore','Retinol Cica'], knownFor:'Jeju-sourced naturals', intl:true, wikidataId:'' },
  { id:'etude',        name:'ETUDE',             korean:'에뛰드', emoji:'🎀', tier:'drugstore', vegan:false, men:false, hero:['SoonJung Line','Fixing Tint','Drawing Brow'], knownFor:'Soonjung soothing & playful makeup', intl:true, wikidataId:'' },
  { id:'missha',       name:'MISSHA',            korean:'미샤', emoji:'🟣', tier:'drugstore', vegan:false, men:true,  hero:['Time Revolution Essence','All Around Safe Block SPF','Cushion'], knownFor:'Ferment essence value icon', intl:true, wikidataId:'' },
  { id:'naturerepublic',name:'Nature Republic', korean:'네이처리퍼블릭', emoji:'🌵', tier:'drugstore', vegan:false, men:true, hero:['Aloe Vera 92% Gel','Ginseng Royal Silk','Vitapair C'], knownFor:'Aloe vera staple', intl:true, wikidataId:'' },
  // Mid tier (derma & cult favourites)
  { id:'laneige',      name:'Laneige',           korean:'라네즈', emoji:'💤', tier:'mid', vegan:false, men:true,  hero:['Water Sleeping Mask','Lip Sleeping Mask','Cream Skin'], knownFor:'Hydration & sleeping masks', intl:true, wikidataId:'' },
  { id:'drjart',       name:'Dr.Jart+',          korean:'닥터자르트', emoji:'🧪', tier:'mid', vegan:false, men:true,  hero:['Cicapair Tiger Grass','Ceramidin','Vital Hydra'], knownFor:'Derma cica & ceramide', intl:true, wikidataId:'' },
  { id:'belif',        name:'belif',             korean:'빌리프', emoji:'🌼', tier:'mid', vegan:false, men:true,  hero:['The True Cream Aqua Bomb','Moisturizing Bomb'], knownFor:'Herbal “true cream” moisturizers', intl:true, wikidataId:'' },
  { id:'pyunkangyul',  name:'Pyunkang Yul',      korean:'편강율', emoji:'🌾', tier:'mid', vegan:false, men:true,  hero:['Essence Toner','Moisture Cream','ATO Cica'], knownFor:'Minimalist barrier care', intl:true, wikidataId:'' },
  { id:'purito',       name:'Purito SEOUL',      korean:'퓨리토', emoji:'♻️', tier:'mid', vegan:true,  men:true,  hero:['Centella Unscented','Daily Go-To SPF','Wonder Releaf'], knownFor:'Vegan, fragrance-free', intl:true, wikidataId:'' },
  { id:'abib',         name:'Abib',              korean:'아비브', emoji:'📄', tier:'mid', vegan:false, men:true,  hero:['Heartleaf Spot Pad','Gummy Sheet Mask','Sun Stick'], knownFor:'Calming pads & masks', intl:true, wikidataId:'' },
  { id:'klairs',       name:'Dear, Klairs',      korean:'클레어스', emoji:'🤍', tier:'mid', vegan:true,  men:true,  hero:['Supple Preparation Toner','Freshly Juiced Vitamin C','Midnight Blue'], knownFor:'Gentle vegan basics', intl:true, wikidataId:'' },
  { id:'mediheal',     name:'Mediheal',          korean:'메디힐', emoji:'🎭', tier:'mid', vegan:false, men:true,  hero:['Tea Tree Mask','N.M.F Aquaring','Madecassoside'], knownFor:'Best-selling sheet masks', intl:true, wikidataId:'' },
  { id:'maryandmay',   name:'Mary&May',          korean:'메리앤메이', emoji:'🌷', tier:'mid', vegan:true,  men:true,  hero:['Vitamin B,C,E Serum','Cica Collagen','Idebenone'], knownFor:'Clean vegan duos', intl:true, wikidataId:'' },
  // Luxury tier (hanbang & prestige)
  { id:'sulwhasoo',    name:'Sulwhasoo',         korean:'설화수', emoji:'🌺', tier:'luxury', vegan:false, men:true,  hero:['First Care Activating Serum','Concentrated Ginseng','Essential'], knownFor:'Hanbang ginseng prestige', intl:true, wikidataId:'' },
  { id:'whoo',         name:'The History of Whoo',korean:'후', emoji:'👑', tier:'luxury', vegan:false, men:true,  hero:['Bichup Self-Generating Anti-Aging','Cheongidan','Gongjinhyang'], knownFor:'Royal-court hanbang luxury', intl:true, wikidataId:'' },
  { id:'ohui',         name:'O HUI',             korean:'오휘', emoji:'💠', tier:'luxury', vegan:false, men:false, hero:['The First Geniture','Prime Advancer','Age Recovery'], knownFor:'Cellular science luxury', intl:true, wikidataId:'' },
  { id:'hera',         name:'HERA',              korean:'헤라', emoji:'🖤', tier:'luxury', vegan:false, men:true,  hero:['Black Cushion','Cell Bio Essence','Signia'], knownFor:'Seoul-chic prestige & cushions', intl:true, wikidataId:'' },
  { id:'amorepacific', name:'AMOREPACIFIC',      korean:'아모레퍼시픽', emoji:'🍵', tier:'luxury', vegan:false, men:true, hero:['Time Response','Vintage Single Extract Essence','Green Tea'], knownFor:'Green-tea science flagship', intl:true, wikidataId:'' },
];

/* ── Glossary (definitions = facts; inline tooltips reuse these) ────────────*/
const KBEAUTY_GLOSSARY = [
  { term:'Toner / Skin',     korean:'토너/스킨', def:'A watery first hydration step that rebalances skin and preps it to absorb the next layers. K-beauty toners hydrate (they don’t “strip”).' },
  { term:'Essence',          korean:'에센스', def:'A lightweight, watery hydrator — often fermented — that is the signature heart of a K-beauty routine, layered between toner and serum.' },
  { term:'Serum / Ampoule',  korean:'세럼/앰플', def:'Concentrated treatment for a specific concern. An “ampoule” is typically a more potent serum.' },
  { term:'Emulsion',         korean:'에멀전', def:'A light, milky moisturizer — common in Korean routines for those who find creams too heavy.' },
  { term:'Double Cleansing', korean:'이중세안', def:'Cleansing twice at night: an oil cleanser to melt SPF/makeup, then a water cleanser to wash away the rest.' },
  { term:'Glass Skin',       korean:'유리 피부', def:'The goal look: poreless-appearing, luminous, ultra-hydrated, “see-through” clarity.' },
  { term:'Slugging',         korean:'슬러깅', def:'Sealing the routine with a thin occlusive (e.g. petrolatum) overnight to lock in moisture — best for dry skin.' },
  { term:'Skin Cycling',     korean:'스킨 사이클링', def:'Rotating active nights (exfoliate → retinoid → recover → recover) to get results with less irritation.' },
  { term:'Skin Barrier',     korean:'피부 장벽', def:'The skin’s outer protective layer of cells & lipids. Healthy barrier = calm, hydrated, resilient skin.' },
  { term:'7-Skin Method',    korean:'7스킨법', def:'Layering a hydrating toner up to seven times to deeply plump the skin — adjust the count to your skin.' },
  { term:'Sheet Mask',       korean:'시트 마스크', def:'A serum-soaked fabric mask for a quick hydration or soothing boost.' },
  { term:'Cushion',          korean:'쿠션', def:'A Korean invention: liquid foundation/SPF in a sponge compact for dewy, buildable, on-the-go coverage.' },
  { term:'Chemical Sunscreen',korean:'유기자차', def:'Filters that absorb UV. Lightweight, no white cast — Korean formulas are famous for elegant textures.' },
  { term:'Mineral Sunscreen',korean:'무기자차', def:'Zinc oxide / titanium dioxide that sit on skin and deflect UV. Best for very sensitive skin (can leave a slight cast).' },
  { term:'PA Rating',        korean:'PA 등급', def:'The Asian measure of UVA (ageing-ray) protection. PA++++ is the highest — look for it alongside SPF.' },
  { term:'Hanbang',          korean:'한방', def:'Traditional Korean herbal medicine ingredients (ginseng, etc.) used in heritage & luxury skincare.' },
  { term:'Fermentation',     korean:'발효', def:'Fermented ingredients (galactomyces, bifida) broken into smaller, skin-friendly molecules prized for glow.' },
];

/* ── 2026 trends (cite-worthy framing; the ticker + trends feed) ────────────*/
const KBEAUTY_TRENDS = [
  { id:'pdrn',       emoji:'🐟', title:'PDRN “Salmon DNA”',     blurb:'The breakout firming active of 2026 — in serums, creams & pads.' },
  { id:'barrier',    emoji:'🧱', title:'Barrier-first skincare', blurb:'Less is more: repair the barrier before piling on actives.' },
  { id:'microbiome', emoji:'🦠', title:'Microbiome & postbiotics', blurb:'Ferment & probiotic care to support skin’s natural balance.' },
  { id:'exosome',    emoji:'🧬', title:'Exosomes & next-gen',   blurb:'Lab-advanced regenerative claims move from clinics into cosmetics.' },
  { id:'heartleaf',  emoji:'🌱', title:'Heartleaf everything',  blurb:'Houttuynia (어성초) is the calming hero for oily, troubled skin.' },
  { id:'mens',       emoji:'🧔', title:'Men’s K-beauty boom',   blurb:'Korea leads the world in men’s skincare — simple, effective routines.' },
  { id:'suncare',    emoji:'☀️', title:'Sun-stick & reapply',   blurb:'Sticks & cushions make midday SPF reapplication effortless.' },
  { id:'skinimalism',emoji:'🤍', title:'Skinimalism',           blurb:'Curated 4–5 step routines beat the maximalist 10-step for many.' },
];

/* ── Static seasonal "skin forecast" (zero-key; live UV is a future upgrade) ─
   Keyed by hemisphere-agnostic season — modules/kbeauty.js picks by month. */
const KBEAUTY_FORECAST = {
  spring: { emoji:'🌸', headline:'Spring: pollen, fine dust & rising UV', tips:['Double cleanse to remove fine dust & pollen','Add a calming toner (centella/heartleaf) for reactive days','UV climbs fast — daily SPF 50+ from now'] },
  summer: { emoji:'☀️', headline:'Summer: high UV, heat & sweat', tips:['Lightweight gel hydration; skip heavy creams','SPF 50+ PA++++ and reapply midday (stick/cushion)','Niacinamide/BHA help with oil & congestion'] },
  autumn: { emoji:'🍂', headline:'Autumn: dropping humidity, repair season', tips:['Reintroduce richer moisturizers & ceramides','Great window to start retinol (PM, slowly)','Layer humectants to pre-empt winter dryness'] },
  winter: { emoji:'❄️', headline:'Winter: cold, dry air & indoor heating', tips:['Switch to barrier creams; consider slugging at night','Avoid hot water & over-cleansing','Hydrate on damp skin, then seal — and keep SPF going'] },
};

/* ── Men's grooming preset (a major, under-served K-beauty segment) ─────────*/
const KBEAUTY_MENS = {
  emoji:'🧔', title:'Men’s simple routine',
  desc:'Korea leads the world in men’s skincare. You don’t need 10 steps — start with four.',
  steps:[
    { name:'Gentle cleanser',  emoji:'🧼', note:'Low-pH, non-stripping; AM & PM.' },
    { name:'Hydrating toner/essence', emoji:'💦', note:'One light hydration layer.' },
    { name:'Moisturizer',      emoji:'🧴', note:'Lightweight gel-cream for most skin.' },
    { name:'Sunscreen',        emoji:'☀️', note:'Every morning — the easiest anti-ageing win.' },
  ],
};

/* ── Shopping / affiliate config ────────────────────────────────────────────
   aliSeeds: K-beauty search terms the Worker passes to AliExpress product.query
   (live grid, with seller-listing photos). Per concern + general.
   retailers: curated "authentic" links — fill `url` once an affiliate account is
   approved. Empty url => rendered as info text (no dead links), rel sponsored. */
const KBEAUTY_SHOP = {
  aliSeeds: {
    general:      'korean skincare',
    acne:         'cosrx snail mucin centella serum',
    aging:        'korean retinol pdrn peptide serum',
    pigmentation: 'korean vitamin c niacinamide brightening serum',
    redness:      'centella cica calming toner korean',
    pores:        'bha salicylic pore korean',
    dryness:      'hyaluronic ceramide korean moisturizer',
    dullness:     'rice glow vitamin c korean essence',
    oiliness:     'niacinamide oil control korean toner',
    suncare:      'korean sunscreen spf50 pa beauty of joseon',
    cleanser:     'korean cleansing oil low ph cleanser',
  },
  retailers: [
    { id:'aliexpress', name:'AliExpress', emoji:'🛒', note:'Official brand stores (COSRX, Anua, Beauty of Joseon, SKIN1004…), localized pricing & shipping.', url:'', cta:'Shop deals' },
    { id:'yesstyle',   name:'YesStyle',   emoji:'💝', note:'Huge authentic K-beauty catalog with worldwide shipping.', url:'', cta:'Browse' },
    { id:'oliveyoung', name:'Olive Young Global', emoji:'🫒', note:'Korea’s #1 beauty retailer — the authenticity benchmark.', url:'', cta:'Visit' },
  ],
  disclosure:'Some links are affiliate links — they help keep KoreaPlus free, at no extra cost to you. We only suggest authentic K-beauty retailers.',
};

/* ── Expose for the browser (modules/kbeauty.js) and SEO builder (vm) ───────*/
const KBEAUTY_ALL = {
  KBEAUTY_SKINTYPES, KBEAUTY_QUIZ, KBEAUTY_CONCERNS, KBEAUTY_ROUTINE,
  KBEAUTY_INGREDIENTS, KBEAUTY_CHECKABLE, KBEAUTY_CONFLICTS, KBEAUTY_BRANDS,
  KBEAUTY_GLOSSARY, KBEAUTY_TRENDS, KBEAUTY_FORECAST, KBEAUTY_MENS, KBEAUTY_SHOP,
};
if (typeof window !== 'undefined') Object.assign(window, KBEAUTY_ALL);
if (typeof module !== 'undefined' && module.exports) module.exports = KBEAUTY_ALL;
