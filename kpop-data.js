/* ══════════════════════════════════════════════════════════════════════════
   kpop-data.js — manual source-of-truth tier for the /k-pop vertical.

   PURPOSE: the hub must render fully with ZERO API keys. This file seeds the
   roster cards, the (accurate, recurring) debut-anniversary countdowns, and the
   SEO profile generator. Live data (charts, news, MV views) layers on top via
   the Worker (/api/kpop/*) only when keys exist.

   EXTERNAL IDs (spotifyId / youtubeChannelId / wikidataId):
     - wikidataId  → enables a 9-language bio with NO key (Wikidata is keyless).
     - spotifyId   → popularity/followers/artwork  (needs SPOTIFY_* secret).
     - youtubeChannelId → subscribers/MV views      (needs YOUTUBE_API_KEY).
   An empty value simply SKIPS that enrichment — never breaks the page.
   IDs are verified/enriched out-of-band; only stable facts are hand-curated here.

   FACTS POLICY: only verifiable, stable facts (debut date, agency, member names,
   fandom). No speculative future "comeback" dates — countdowns are derived from
   debut anniversaries (always accurate) and the curated KPOP_UPCOMING list below.
   ══════════════════════════════════════════════════════════════════════════ */

const KPOP_ROSTER = [
  // ── Girl groups ──────────────────────────────────────────────────────────
  { id:'newjeans',   nameEn:'NewJeans',   nameKo:'뉴진스',   type:'group', gender:'girl', agency:'ADOR (HYBE)',            debut:'2022-07-22', members:['Minji','Hanni','Danielle','Haerin','Hyein'], fandom:'Bunnies',  emoji:'🐰', genres:['K-pop','R&B'],      city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q113189277' },
  { id:'blackpink',  nameEn:'BLACKPINK',  nameKo:'블랙핑크',  type:'group', gender:'girl', agency:'YG Entertainment',        debut:'2016-08-08', members:['Jisoo','Jennie','Rosé','Lisa'],                  fandom:'BLINK',    emoji:'🖤', genres:['K-pop'],            city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q25056945' },
  { id:'twice',      nameEn:'TWICE',      nameKo:'트와이스',  type:'group', gender:'girl', agency:'JYP Entertainment',       debut:'2015-10-20', members:['Nayeon','Jeongyeon','Momo','Sana','Jihyo','Mina','Dahyun','Chaeyoung','Tzuyu'], fandom:'ONCE', emoji:'🍭', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q20645861' },
  { id:'aespa',      nameEn:'aespa',      nameKo:'에스파',   type:'group', gender:'girl', agency:'SM Entertainment',        debut:'2020-11-17', members:['Karina','Giselle','Winter','Ningning'],          fandom:'MY',       emoji:'🦋', genres:['K-pop'],            city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q100877982' },
  { id:'ive',        nameEn:'IVE',        nameKo:'아이브',   type:'group', gender:'girl', agency:'Starship Entertainment',  debut:'2021-12-01', members:['Yujin','Gaeul','Rei','Wonyoung','Liz','Leeseo'],  fandom:'DIVE',     emoji:'💎', genres:['K-pop'],            city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q109375061' },
  { id:'lesserafim', nameEn:'LE SSERAFIM',nameKo:'르세라핌', type:'group', gender:'girl', agency:'Source Music (HYBE)',     debut:'2022-05-02', members:['Sakura','Kim Chaewon','Huh Yunjin','Kazuha','Hong Eunchae'], fandom:'FEARNOT', emoji:'🔥', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q111381707' },
  { id:'gidle',      nameEn:'(G)I-DLE',   nameKo:'아이들',   type:'group', gender:'girl', agency:'Cube Entertainment',      debut:'2018-05-02', members:['Miyeon','Minnie','Soyeon','Yuqi','Shuhua'],      fandom:'Neverland',emoji:'👑', genres:['K-pop'],            city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q51885404' },
  { id:'itzy',       nameEn:'ITZY',       nameKo:'있지',     type:'group', gender:'girl', agency:'JYP Entertainment',       debut:'2019-02-12', members:['Yeji','Lia','Ryujin','Chaeryeong','Yuna'],       fandom:'MIDZY',    emoji:'⚡', genres:['K-pop'],            city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q60732823' },
  { id:'redvelvet',  nameEn:'Red Velvet', nameKo:'레드벨벳', type:'group', gender:'girl', agency:'SM Entertainment',        debut:'2014-08-01', members:['Irene','Seulgi','Wendy','Joy','Yeri'],            fandom:'ReVeluv',  emoji:'❤️', genres:['K-pop'],            city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q17466114' },
  { id:'nmixx',      nameEn:'NMIXX',      nameKo:'엔믹스',   type:'group', gender:'girl', agency:'JYP Entertainment',       debut:'2022-02-22', members:['Lily','Haewon','Sullyoon','Jiwoo','Bae','Kyujin'],fandom:'NSWER',    emoji:'🌀', genres:['K-pop'],            city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q109307762' },
  { id:'stayc',      nameEn:'STAYC',      nameKo:'스테이씨', type:'group', gender:'girl', agency:'High Up Entertainment',   debut:'2020-11-12', members:['Sumin','Sieun','Isa','Seeun','Yoon','J'],         fandom:'SWITH',    emoji:'🫧', genres:['K-pop'],            city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q101541493' },
  { id:'babymonster',nameEn:'BABYMONSTER',nameKo:'베이비몬스터',type:'group',gender:'girl',agency:'YG Entertainment',       debut:'2024-04-01', members:['Ruka','Pharita','Asa','Ahyeon','Rami','Rora','Chiquita'], fandom:'MONSTIEZ', emoji:'😈', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q115967938' },
  { id:'illit',      nameEn:'ILLIT',      nameKo:'아일릿',   type:'group', gender:'girl', agency:'BELIFT LAB (HYBE)',       debut:'2024-03-25', members:['Yunah','Minju','Moka','Wonhee','Iroha'],          fandom:'GLLIT',    emoji:'🍒', genres:['K-pop'],            city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q122179261' },
  { id:'kissoflife', nameEn:'KISS OF LIFE',nameKo:'키스오브라이프',type:'group',gender:'girl',agency:'S2 Entertainment',     debut:'2023-07-05', members:['Julie','Natty','Belle','Haneul'],                fandom:'KISSY',    emoji:'💋', genres:['K-pop','R&B'],      city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q118314702' },

  // ── Boy groups ───────────────────────────────────────────────────────────
  { id:'bts',        nameEn:'BTS',        nameKo:'방탄소년단',type:'group', gender:'boy',  agency:'BIGHIT MUSIC (HYBE)',     debut:'2013-06-13', members:['RM','Jin','SUGA','j-hope','Jimin','V','Jung Kook'],fandom:'ARMY',    emoji:'💜', genres:['K-pop','Hip-hop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q13580495' },
  { id:'seventeen',  nameEn:'SEVENTEEN',  nameKo:'세븐틴',   type:'group', gender:'boy',  agency:'PLEDIS (HYBE)',           debut:'2015-05-26', members:['S.Coups','Jeonghan','Joshua','Jun','Hoshi','Wonwoo','Woozi','DK','Mingyu','The8','Seungkwan','Vernon','Dino'], fandom:'CARAT', emoji:'💎', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'' },
  { id:'straykids',  nameEn:'Stray Kids', nameKo:'스트레이 키즈',type:'group',gender:'boy',agency:'JYP Entertainment',       debut:'2018-03-25', members:['Bang Chan','Lee Know','Changbin','Hyunjin','Han','Felix','Seungmin','I.N'], fandom:'STAY', emoji:'🐺', genres:['K-pop','Hip-hop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q46134670' },
  { id:'txt',        nameEn:'TOMORROW X TOGETHER',nameKo:'투모로우바이투게더',type:'group',gender:'boy',agency:'BIGHIT MUSIC (HYBE)',debut:'2019-03-04', members:['Soobin','Yeonjun','Beomgyu','Taehyun','Hueningkai'], fandom:'MOA', emoji:'✨', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q60550265' },
  { id:'enhypen',    nameEn:'ENHYPEN',    nameKo:'엔하이픈', type:'group', gender:'boy',  agency:'BELIFT LAB (HYBE)',       debut:'2020-11-30', members:['Jungwon','Heeseung','Jay','Jake','Sunghoon','Sunoo','Ni-ki'], fandom:'ENGENE', emoji:'🌙', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q99479445' },
  { id:'ateez',      nameEn:'ATEEZ',      nameKo:'에이티즈', type:'group', gender:'boy',  agency:'KQ Entertainment',        debut:'2018-10-24', members:['Hongjoong','Seonghwa','Yunho','Yeosang','San','Mingi','Wooyoung','Jongho'], fandom:'ATINY', emoji:'🏴‍☠️', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q59793088' },
  { id:'nct127',     nameEn:'NCT 127',    nameKo:'엔시티 127',type:'group', gender:'boy',  agency:'SM Entertainment',        debut:'2016-07-07', members:['Taeil','Johnny','Taeyong','Yuta','Doyoung','Jaehyun','Jungwoo','Mark','Haechan'], fandom:'NCTzen', emoji:'🟢', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q55624444' },
  { id:'nctdream',   nameEn:'NCT DREAM',  nameKo:'엔시티 드림',type:'group', gender:'boy',  agency:'SM Entertainment',        debut:'2016-08-25', members:['Mark','Renjun','Jeno','Haechan','Jaemin','Chenle','Jisung'], fandom:'NCTzen', emoji:'🌠', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q47002841' },
  { id:'treasure',   nameEn:'TREASURE',   nameKo:'트레저',   type:'group', gender:'boy',  agency:'YG Entertainment',        debut:'2020-08-07', members:['Hyunsuk','Jihoon','Yoshi','Junkyu','Jaehyuk','Asahi','Yedam','Doyoung','Haruto','Park Jeongwoo'], fandom:'TREASURE MAKER', emoji:'💰', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'' },
  { id:'zerobaseone',nameEn:'ZEROBASEONE',nameKo:'제로베이스원',type:'group',gender:'boy', agency:'WAKEONE',                 debut:'2023-07-10', members:['Kim Jiwoong','Zhang Hao','Sung Hanbin','Seok Matthew','Kim Taerae','Ricky','Kim Gyuvin','Park Gunwook','Han Yujin'], fandom:'ZEROSE', emoji:'🔵', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'Q117808633' },
  { id:'riize',      nameEn:'RIIZE',      nameKo:'라이즈',   type:'group', gender:'boy',  agency:'SM Entertainment',        debut:'2023-09-04', members:['Shotaro','Eunseok','Sungchan','Wonbin','Seunghan','Sohee','Anton'], fandom:'BRIIZE', emoji:'🌅', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'' },
  { id:'theboyz',    nameEn:'THE BOYZ',   nameKo:'더보이즈', type:'group', gender:'boy',  agency:'IST Entertainment',       debut:'2017-12-06', members:['Sangyeon','Jacob','Younghoon','Hyunjae','Juyeon','Kevin','New','Q','Juhaknyeon','Sunwoo','Eric'], fandom:'THE B', emoji:'🌟', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'' },
  { id:'exo',        nameEn:'EXO',        nameKo:'엑소',     type:'group', gender:'boy',  agency:'SM Entertainment',        debut:'2012-04-08', members:['Xiumin','Suho','Lay','Baekhyun','Chen','Chanyeol','D.O.','Kai','Sehun'], fandom:'EXO-L', emoji:'🌌', genres:['K-pop'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'' },

  // ── Soloists ─────────────────────────────────────────────────────────────
  { id:'iu',         nameEn:'IU',         nameKo:'아이유',   type:'soloist',gender:'female',agency:'EDAM Entertainment',     debut:'2008-09-18', members:[], fandom:'UAENA',   emoji:'🌸', genres:['K-pop','Ballad'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'' },
  { id:'jungkook',   nameEn:'Jung Kook',  nameKo:'정국',     type:'soloist',gender:'male', agency:'BIGHIT MUSIC (HYBE)',     debut:'2023-07-14', members:[], fandom:'ARMY',    emoji:'🐰', genres:['Pop'],            city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'' },
  { id:'lisa',       nameEn:'LISA',       nameKo:'리사',     type:'soloist',gender:'female',agency:'LLOUD / RCA',            debut:'2021-09-10', members:[], fandom:'BLINK',   emoji:'🐯', genres:['Pop','Hip-hop'],  city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'' },
  { id:'jennie',     nameEn:'JENNIE',     nameKo:'제니',     type:'soloist',gender:'female',agency:'ODD ATELIER',            debut:'2023-10-06', members:[], fandom:'BLINK',   emoji:'🤎', genres:['Pop'],            city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'' },
  { id:'rose',       nameEn:'ROSÉ',       nameKo:'로제',     type:'soloist',gender:'female',agency:'THE BLACK LABEL',        debut:'2021-03-12', members:[], fandom:'BLINK',   emoji:'🌹', genres:['Pop'],            city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'' },
  { id:'gdragon',    nameEn:'G-DRAGON',   nameKo:'지드래곤', type:'soloist',gender:'male', agency:'Galaxy Corporation',      debut:'2009-08-18', members:[], fandom:'VIP',     emoji:'🐉', genres:['K-pop','Hip-hop'],city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'' },
  { id:'taeyeon',    nameEn:'TAEYEON',    nameKo:'태연',     type:'soloist',gender:'female',agency:'SM Entertainment',       debut:'2015-10-07', members:[], fandom:'',        emoji:'🎶', genres:['K-pop','Ballad'], city:'Seoul', spotifyId:'', youtubeChannelId:'', wikidataId:'' },
];

/* KPOP_UPCOMING — CURATED confirmed releases/tours. EDITABLE: append entries as
   official announcements drop. Leave empty rather than guess. Countdowns also
   come (automatically) from each act's debut anniversary, computed in modules/kpop.js.
   Shape: { artistId, title, date:'YYYY-MM-DD', type:'album'|'single'|'ep'|'tour'|'event', confirmed:true } */
const KPOP_UPCOMING = [
  // e.g. { artistId:'newjeans', title:'3rd EP', date:'2026-07-22', type:'ep', confirmed:false },
];

// Expose for the browser (modules/kpop.js) and the SEO builder (build-seo.cjs vm).
if (typeof window !== 'undefined') {
  window.KPOP_ROSTER = KPOP_ROSTER;
  window.KPOP_UPCOMING = KPOP_UPCOMING;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KPOP_ROSTER, KPOP_UPCOMING };
}
