/* ===== CONFIG ===== */
const MAPS_KEY = window.MAPS_KEY || '';
const WORKER_URL = window.WORKER_URL || '';

/* ===== NIGHT-FROM-SPACE SVG MAP ===== */
function initMap() {
  const mapEl = document.getElementById('korea-map');
  if (!mapEl) return;
  mapEl.style.position = 'relative';

  const W = 1400, H = 700;
  const NS = 'http://www.w3.org/2000/svg';

  function ll(lat, lng) {
    return [+(580 + (lng - 124.0) * 60).toFixed(1), +(108 + (42.0 - lat) * 48).toFixed(1)];
  }

  // Catmull-Rom → Cubic Bezier (tension 1/9 — minimal overshoot at capes/bays)
  function smoothPath(pts) {
    const n = pts.length;
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n; i++) {
      const p0=pts[(i-1+n)%n], p1=pts[i], p2=pts[(i+1)%n], p3=pts[(i+2)%n];
      const c1x=+(p1[0]+(p2[0]-p0[0])/9).toFixed(1), c1y=+(p1[1]+(p2[1]-p0[1])/9).toFixed(1);
      const c2x=+(p2[0]-(p3[0]-p1[0])/9).toFixed(1), c2y=+(p2[1]-(p3[1]-p1[1])/9).toFixed(1);
      d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
    }
    return d + ' Z';
  }

  // Open smooth path (for rivers / mountain lines — not closed)
  function openPath(pts) {
    if (pts.length < 2) return '';
    const n = pts.length;
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0,i-1)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(n-1,i+2)];
      const c1x=+(p1[0]+(p2[0]-p0[0])/7).toFixed(1), c1y=+(p1[1]+(p2[1]-p0[1])/7).toFixed(1);
      const c2x=+(p2[0]-(p3[0]-p1[0])/7).toFixed(1), c2y=+(p2[1]-(p3[1]-p1[1])/7).toFixed(1);
      d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
    }
    return d;
  }

  function el(tag, attrs={}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k,v] of Object.entries(attrs)) e.setAttribute(k,v);
    if (parent) parent.appendChild(e);
    return e;
  }

  const svg = el('svg',{viewBox:`0 0 ${W} ${H}`,preserveAspectRatio:'xMidYMid slice'});
  // pan-y: vertical swipes scroll the PAGE; map drag engages only when zoomed in
  svg.style.cssText = 'width:100%;height:100%;display:block;cursor:grab;touch-action:pan-y pinch-zoom;';
  const defs = el('defs',{},svg);

  // Gradients & filters
  const bgG = el('radialGradient',{id:'bgG',cx:'50%',cy:'55%',r:'75%'},defs);
  [['0%','#06102a'],['65%','#020910'],['100%','#000204']].forEach(([o,c])=>el('stop',{offset:o,'stop-color':c},bgG));
  const oceanG = el('radialGradient',{id:'oceanG',cx:'40%',cy:'40%',r:'70%'},defs);
  [['0%','#071828'],['100%','#010810']].forEach(([o,c])=>el('stop',{offset:o,'stop-color':c},oceanG));
  const atmG = el('linearGradient',{id:'atmG',x1:'0',y1:'1',x2:'0',y2:'0'},defs);
  el('stop',{offset:'0%','stop-color':'#1a96e0','stop-opacity':'0.55'},atmG);
  el('stop',{offset:'50%','stop-color':'#0a60b0','stop-opacity':'0.12'},atmG);
  el('stop',{offset:'100%','stop-color':'#001530','stop-opacity':'0'},atmG);
  const glowF = el('filter',{id:'glow',x:'-60%',y:'-60%',width:'220%',height:'220%'},defs);
  el('feGaussianBlur',{in:'SourceGraphic',stdDeviation:'4',result:'b'},glowF);
  const gm=el('feMerge',{},glowF); el('feMergeNode',{in:'b'},gm); el('feMergeNode',{in:'SourceGraphic'},gm);

  // Background & stars
  el('rect',{width:W,height:H,fill:'url(#bgG)'},svg);
  const rnd = n => { let x=Math.sin(n)*10000; return x-Math.floor(x); };
  for (let i=0;i<160;i++) el('circle',{cx:rnd(i*3.7+1)*W,cy:rnd(i*5.1+2)*H*0.75,r:rnd(i*2.3+3)*1.5+0.2,fill:'#fff',opacity:rnd(i*4.9+4)*0.6+0.15},svg);
  for (let i=0;i<80;i++)  el('circle',{cx:rnd(i*7.3+10)*W*0.7+W*0.15,cy:rnd(i*9.7+20)*H*0.4+H*0.05,r:rnd(i*1.9+30)*0.9+0.1,fill:'#d0e8ff',opacity:rnd(i*6.1+40)*0.3+0.05},svg);

  // Earth surface & atmosphere
  el('ellipse',{cx:W*0.47,cy:H+180,rx:1250,ry:590,fill:'url(#oceanG)'},svg);
  el('path',{d:`M 0,${H} L 0,${H*0.42} C ${W*0.25},${H*0.28} ${W*0.75},${H*0.3} ${W},${H*0.44} L ${W},${H} Z`,fill:'url(#atmG)',opacity:'0.22'},svg);
  el('path',{d:`M -20,${H*0.43} C ${W*0.25},${H*0.27} ${W*0.75},${H*0.29} ${W+20},${H*0.45}`,fill:'none',stroke:'#40b8f0','stroke-width':'2',opacity:'0.45',filter:'url(#glow)'},svg);

  // ═══════════════════════════════════════════════════════
  // KOREAN PENINSULA — 88 waypoints (geographically accurate)
  // ═══════════════════════════════════════════════════════
  // South Korea — clockwise from DMZ west junction
  const SK = [
    // DMZ: west (Han River estuary) → east coast (~38°N northward arc)
    [37.92,126.62],[37.97,126.86],[38.03,127.14],[38.09,127.44],
    [38.15,127.74],[38.22,128.03],[38.30,128.25],[38.42,128.37],[38.58,128.41],
    // East coast: Goseong → Sokcho → Yangyang → Gangneung → Donghae →
    //             Samcheok → Uljin → Yeongdeok → Pohang → Ulsan → Busan
    [38.39,128.49],[38.21,128.57],[38.07,128.63],[37.92,128.70],
    [37.75,128.92],[37.56,129.09],[37.43,129.17],[37.22,129.31],
    [36.98,129.41],[36.74,129.46],[36.51,129.49],[36.29,129.44],
    [36.07,129.57],              // Homigot cape (easternmost point!)
    [35.99,129.37],[35.87,129.54], // Pohang south → SE cape
    [35.73,129.49],[35.55,129.36],
    [35.35,129.23],[35.13,129.18],[35.04,129.02],
    // South coast: Busan → Geoje → Tongyeong → Goseong bay → Namhae →
    //              Yeosu → Boseong → Goheung → Jangheung → Haenam →
    //              Ttangkkeut (Land's End 34.17°N) → Mokpo
    [34.89,128.80],[34.77,128.66],[34.63,128.50],[34.60,128.33],
    [34.56,128.14],[34.71,128.03],[34.62,127.88],[34.59,127.74],
    [34.74,127.73],[34.67,127.57],[34.56,127.40],[34.51,127.22],
    [34.54,127.07],[34.62,126.95],[34.57,126.81],[34.61,126.65],
    [34.57,126.55],[34.46,126.48],[34.35,126.49],[34.17,126.52],
    [34.31,126.36],[34.55,126.27],[34.70,126.33],[34.79,126.40],
    // West coast: Mokpo → Buan/Saemangeum → Gunsan → Boryeong →
    //             Taean Peninsula (126.11°E westernmost) →
    //             Ansan → Incheon → Gimpo → DMZ junction
    [34.88,126.43],[35.02,126.48],[35.19,126.52],[35.37,126.57],
    [35.53,126.53],[35.69,126.57],[35.84,126.60],[35.99,126.73],
    [36.10,126.65],[36.22,126.56],[36.35,126.52],[36.44,126.58],
    [36.54,126.62],[36.64,126.56],[36.74,126.47],[36.81,126.25],
    [36.87,126.10],[36.92,126.31],[36.98,126.49],[37.08,126.57],
    [37.23,126.63],[37.38,126.68],[37.50,126.66],[37.61,126.64],
    [37.68,126.67],[37.76,126.64],[37.84,126.63],[37.88,126.62],
  ].map(([a,b])=>ll(a,b));

  // North Korea — clockwise from DMZ west junction
  const NK = [
    [37.92,126.62],[37.97,126.42],[38.07,126.14],[38.22,125.87],
    [38.41,125.59],[38.59,125.33],[38.76,124.86],[38.96,124.61],
    [39.19,124.39],[39.46,124.17],[39.76,124.31],[40.07,124.39],
    // North border: Yalu River → Tumen River (China/Russia border)
    [40.31,124.65],[40.56,124.91],[40.77,125.37],[41.01,126.69],
    [41.36,127.46],[41.64,128.19],[41.86,128.57],[42.08,129.19],
    [42.23,129.76],[42.36,130.21],[42.39,130.56],
    // East coast NK: south to DMZ
    [42.14,130.63],[41.91,129.86],[41.59,129.45],[41.21,129.52],
    [40.83,129.37],[40.45,129.27],[40.05,129.14],[39.65,128.91],
    [39.23,128.67],[38.89,128.54],[38.62,128.41],
    // DMZ east → west
    [38.58,128.41],[38.42,128.37],[38.30,128.25],[38.22,128.03],
    [38.15,127.74],[38.09,127.44],[38.03,127.14],[37.97,126.86],
  ].map(([a,b])=>ll(a,b));

  el('path',{d:smoothPath(NK),fill:'#040c04',stroke:'rgba(30,60,30,0.18)','stroke-width':'0.7'},svg);
  el('path',{d:smoothPath(SK),fill:'#060e06'},svg);
  el('path',{d:smoothPath(SK),fill:'none',stroke:'#1a5888','stroke-width':'1.8',opacity:'0.58'},svg);

  // Terrain: Baekdudaegan mountain spine (subtle green ridge)
  const mtnPts=[[38.12,128.46],[37.79,128.54],[37.10,128.91],[36.54,128.33],[35.84,127.72],[35.34,127.73],[35.08,127.70],[34.86,127.56]].map(([a,b])=>ll(a,b));
  el('path',{d:openPath(mtnPts),fill:'none',stroke:'rgba(55,90,50,0.42)','stroke-width':'2.5','stroke-linecap':'round','stroke-linejoin':'round',filter:'url(#glow)'},svg);

  // Terrain: Han River
  const hanPts=[[37.27,127.98],[37.36,127.72],[37.44,127.51],[37.51,127.33],[37.55,127.05],[37.52,126.73]].map(([a,b])=>ll(a,b));
  el('path',{d:openPath(hanPts),fill:'none',stroke:'rgba(18,58,115,0.52)','stroke-width':'1.3','stroke-linecap':'round'},svg);

  // Terrain: Nakdong River
  const nakPts=[[36.97,128.63],[36.38,128.70],[35.87,128.60],[35.41,128.68],[35.13,128.87],[35.08,128.98]].map(([a,b])=>ll(a,b));
  el('path',{d:openPath(nakPts),fill:'none',stroke:'rgba(18,58,115,0.40)','stroke-width':'1.0','stroke-linecap':'round'},svg);

  // DMZ dashed line
  const dmzPts=[[37.92,126.62],[38.03,127.14],[38.15,127.74],[38.30,128.25],[38.58,128.41]].map(([a,b])=>ll(a,b));
  el('path',{d:`M ${dmzPts.map(p=>p.join(',')).join(' L ')}`,fill:'none',stroke:'#3a5858','stroke-width':'0.8','stroke-dasharray':'5,3',opacity:'0.55'},svg);

  // Islands: Jeju, Ulleungdo, Geoje, Namhae, Wando, Jindo
  const [jx,jy]=ll(33.49,126.53);
  el('ellipse',{cx:jx,cy:jy,rx:26,ry:14,fill:'#060c06',stroke:'#1a5888','stroke-width':'1.3','stroke-opacity':'0.55'},svg);
  const [ulx,uly]=ll(37.49,130.87);
  el('ellipse',{cx:ulx,cy:uly,rx:7,ry:7,fill:'#060e06',stroke:'#1a5888','stroke-width':'1','stroke-opacity':'0.45'},svg);
  [[34.88,128.60,7,4],[34.72,128.04,6,3.5],[34.40,126.30,8,4.5],[34.49,126.18,6,3]].forEach(([a,b,rx,ry])=>{
    const [ix,iy]=ll(a,b);
    el('ellipse',{cx:ix,cy:iy,rx,ry,fill:'#050a05',stroke:'#1a4868','stroke-width':'0.7','stroke-opacity':'0.38'},svg);
  });

  // City light halos
  const LIGHTS=[
    [37.57,126.97,88,38,'#ffb050',0.44],[37.46,126.70,40,18,'#ffaa45',0.30],
    [37.28,127.01,26,11,'#ffaa40',0.20],[35.18,129.07,58,26,'#ffc055',0.36],
    [35.87,128.60,38,17,'#ffb040',0.24],[36.35,127.38,30,14,'#ffaa40',0.22],
    [35.16,126.85,28,13,'#ffaa40',0.20],[35.54,129.31,26,12,'#ffb040',0.20],
    [35.84,129.21,18,8,'#ffb040',0.17],[35.82,127.15,20,9,'#ffaa38',0.18],
    [36.57,128.73,14,6,'#ffa830',0.15],[34.76,127.66,14,6,'#ffa030',0.16],
    [33.50,126.53,17,7,'#ffb040',0.20],[35.23,128.68,18,8,'#ffaa38',0.17],
  ];
  LIGHTS.forEach(([lat,lng,r2,r1,c,op],i)=>{
    const [lx,ly]=ll(lat,lng);
    const id=`lg${i}`,id2=`lc${i}`;
    const g=el('radialGradient',{id,cx:'50%',cy:'50%',r:'50%'},defs);
    el('stop',{offset:'0%','stop-color':c,'stop-opacity':op.toFixed(2)},g);
    el('stop',{offset:'50%','stop-color':c,'stop-opacity':(op*0.3).toFixed(2)},g);
    el('stop',{offset:'100%','stop-color':c,'stop-opacity':'0'},g);
    el('circle',{cx:lx,cy:ly,r:r2,fill:`url(#${id})`},svg);
    const g2=el('radialGradient',{id:id2,cx:'50%',cy:'50%',r:'50%'},defs);
    el('stop',{offset:'0%','stop-color':'#fff8e8','stop-opacity':Math.min(1,op*1.7).toFixed(2)},g2);
    el('stop',{offset:'100%','stop-color':c,'stop-opacity':'0'},g2);
    el('circle',{cx:lx,cy:ly,r:r1*0.55,fill:`url(#${id2})`},svg);
  });

  // ═══════════════════════════════════════════════════════
  // ZOOM / PAN
  // ═══════════════════════════════════════════════════════
  let zoom=1, panX=0, panY=0, isDrag=false, dragX=0, dragY=0;
  const detailLayer = el('g',{id:'detailLayer',opacity:'0'},svg);

  function applyView() {
    const vw=W/zoom, vh=H/zoom;
    svg.setAttribute('viewBox',`${W/2-vw/2-panX} ${H/2-vh/2-panY} ${vw} ${vh}`);
    detailLayer.setAttribute('opacity', zoom>1.9 ? Math.min(1,(zoom-1.9)*2).toFixed(2) : '0');
    svg.style.cursor = isDrag ? 'grabbing' : 'grab';
  }

  const zCtrl = el('g',{class:'zoom-ctrl'},svg);
  [['+',20,0.5],['−',56,-0.5],['⌂',92,null]].forEach(([lbl,dy,dz])=>{
    const bg=el('rect',{x:W-48,y:dy,width:34,height:32,rx:8,fill:'rgba(255,255,255,0.1)',stroke:'rgba(255,255,255,0.18)','stroke-width':'1'},zCtrl);
    const t=el('text',{x:W-31,y:dy+20.5,fill:'rgba(255,255,255,0.8)','font-size':lbl==='⌂'?'16':'18','text-anchor':'middle','font-family':'Inter,sans-serif'},zCtrl);
    t.textContent=lbl;
    [bg,t].forEach(e=>{ e.style.cursor='pointer'; e.addEventListener('click',()=>{
      if(dz===null){zoom=1;panX=0;panY=0;hidePanel();}
      else zoom=Math.max(1,Math.min(5,zoom+dz));
      if(zoom<=1){panX=0;panY=0;}
      applyView();
    });});
  });

  mapEl.addEventListener('wheel',e=>{
    if(!e.ctrlKey && !e.metaKey) return; // plain scroll = page scroll (Ctrl+wheel zooms)
    e.preventDefault();
    const rect=svg.getBoundingClientRect();
    const mx=(e.clientX-rect.left)/rect.width*W, my=(e.clientY-rect.top)/rect.height*H;
    const f=e.deltaY<0?1.14:0.88, nz=Math.max(1,Math.min(5,zoom*f));
    panX+=((mx-W/2)/zoom)*(1-zoom/nz);
    panY+=((my-H/2)/zoom)*(1-zoom/nz);
    zoom=nz; if(zoom<=1){panX=0;panY=0;}
    applyView();
  },{passive:false});

  mapEl.addEventListener('mousedown',e=>{
    if(e.target.closest('.city-dot,.zoom-ctrl'))return;
    isDrag=true; dragX=e.clientX; dragY=e.clientY; svg.style.cursor='grabbing';
  });
  window.addEventListener('mousemove',e=>{
    if(!isDrag)return;
    const rect=svg.getBoundingClientRect();
    panX+=(e.clientX-dragX)*(W/rect.width)/zoom;
    panY+=(e.clientY-dragY)*(H/rect.height)/zoom;
    dragX=e.clientX; dragY=e.clientY; applyView();
  });
  window.addEventListener('mouseup',()=>{isDrag=false; if(svg)svg.style.cursor='grab';});

  let lastD=0;
  mapEl.addEventListener('touchstart',e=>{
    if(e.touches.length===2) lastD=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    else if(e.touches.length===1 && zoom>1){isDrag=true;dragX=e.touches[0].clientX;dragY=e.touches[0].clientY;}
  },{passive:true});
  mapEl.addEventListener('touchmove',e=>{
    if(e.touches.length===2){
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      zoom=Math.max(1,Math.min(5,zoom*(d/lastD))); lastD=d; applyView();
    } else if(e.touches.length===1&&isDrag){
      const rect=svg.getBoundingClientRect();
      panX+=(e.touches[0].clientX-dragX)*(W/rect.width)/zoom;
      panY+=(e.touches[0].clientY-dragY)*(H/rect.height)/zoom;
      dragX=e.touches[0].clientX; dragY=e.touches[0].clientY; applyView();
    }
  },{passive:true});
  mapEl.addEventListener('touchend',()=>{isDrag=false;});

  // ═══════════════════════════════════════════════════════
  // CITY ATTRACTION PANEL
  // ═══════════════════════════════════════════════════════
  const CITY_SPOTS = {
    Seoul:    [{e:'🏯',n:'Gyeongbokgung Palace',d:'Joseon Dynasty grand royal palace'},{e:'🌸',n:'Bukchon Hanok Village',d:'600-year-old traditional Korean homes'},{e:'🗼',n:'N Seoul Tower',d:'City panorama from Namsan Mountain'},{e:'🛍️',n:'Myeongdong',d:'K-beauty, fashion & street food hub'},{e:'🎵',n:'Hongdae',d:'Art, indie music & vibrant nightlife'},{e:'🏛️',n:'Insadong',d:'Galleries, teahouses & antique shops'},{e:'🌊',n:'Han River Parks',d:'Cycling, picnics & stunning night views'}],
    Busan:    [{e:'🏖️',n:'Haeundae Beach',d:"Korea's most iconic urban beach"},{e:'🎨',n:'Gamcheon Culture Village',d:'Rainbow hillside open-air art village'},{e:'🦀',n:'Jagalchi Fish Market',d:"Korea's largest fresh seafood market"},{e:'⛩️',n:'Haedong Yonggungsa',d:'Dramatic Buddhist sea-cliff temple'},{e:'🌉',n:'Gwangandaegyo Bridge',d:'Twin-span bridge & Gwangalli Beach'},{e:'🎬',n:'BIFF Square',d:'Film festival street with star handprints'}],
    Incheon:  [{e:'✈️',n:"Incheon Int'l Airport",d:"Consistently ranked world's best airport"},{e:'🏮',n:'Chinatown',d:"Korea's only official Chinatown district"},{e:'🏖️',n:'Eurwangni Beach',d:'Scenic west-coast island sandy beach'},{e:'🏛️',n:'Songdo International City',d:'Futuristic eco smart city district'},{e:'⚓',n:'Incheon Old Port',d:'Historic harbor & open-air museum'},{e:'🏯',n:'Ganghwa Island',d:'Ancient temples & UNESCO dolmen'}],
    Gyeongju: [{e:'⛩️',n:'Bulguksa Temple',d:'UNESCO World Heritage Buddhist temple'},{e:'🕌',n:'Seokguram Grotto',d:'8th-century granite Buddha statue'},{e:'🌿',n:'Tumuli Park',d:'Royal burial mounds of Silla kings'},{e:'🎎',n:'Anapji Pond',d:'Moonlit ancient Silla palace garden'},{e:'🏛️',n:'Gyeongju Museum',d:'Silla gold crown & national treasures'},{e:'🚲',n:'Gyeongju Bike Trails',d:'Cycle past ancient monuments & rice fields'}],
    Jeonju:   [{e:'🏘️',n:'Jeonju Hanok Village',d:'700+ preserved traditional Korean houses'},{e:'🍚',n:'Jeonju Bibimbap',d:"Korea's culinary capital signature dish"},{e:'📜',n:'Gyeonggijeon Shrine',d:'Portrait shrine of founding King Taejo'},{e:'🌸',n:'Omokdae Pavilion',d:'Historic hilltop pavilion & sunset views'},{e:'🎭',n:'Hanji Paper Museum',d:'Traditional Korean handmade paper art'},{e:'🍺',n:'Makgeolli Alley',d:'Traditional rice wine bars & night snacks'}],
    Jeju:     [{e:'🌋',n:'Hallasan Mountain',d:"Korea's highest peak & UNESCO biosphere"},{e:'🌅',n:'Seongsan Ilchulbong',d:'Dramatic UNESCO sunrise crater peak'},{e:'🕳️',n:'Manjanggul Lava Cave',d:"World's longest lava tube system"},{e:'🏖️',n:'Hyeopjae Beach',d:'Crystal turquoise shallow tropical waters'},{e:'🐴',n:'Jeju Folk Village',d:'Traditional Jeju life & haenyeo culture'},{e:'🍊',n:'Hallabong Orchards',d:'Famous sweet Jeju tangerine farms'}],
    Andong:   [{e:'🎎',n:'Hahoe Folk Village',d:'UNESCO living Joseon-era village'},{e:'🏛️',n:'Dosan Seowon Academy',d:'Confucian academy of scholar Yi Hwang'},{e:'🎭',n:'Andong Mask Dance',d:'Traditional exorcism masked drama (UNESCO)'},{e:'🍗',n:'Andong Jjimdak',d:'Famous braised soy chicken hometown'},{e:'🏯',n:'Bongjeongsa Temple',d:"Korea's oldest surviving wooden structure"},{e:'🌿',n:'Woryeonggyo Bridge',d:"Korea's longest traditional wooden bridge"}],
    Yeosu:    [{e:'🌉',n:'Yeosu Expo Ocean Park',d:'2012 World Expo permanent waterfront'},{e:'🌅',n:'Odongdo Island',d:'Camellia island with iconic lighthouse'},{e:'🚡',n:'Yeosu Cable Car',d:'Panoramic ocean gondola ride'},{e:'🏖️',n:'Manseongri Black Beach',d:'Unique volcanic black sand beach'},{e:'🦞',n:'Yeosu Night Market',d:'Fresh seafood & local coastal delicacies'},{e:'⛵',n:'Hallyeo Maritime Park',d:'Scenic island-studded national marine park'}],
  };

  const panel = document.createElement('div');
  panel.style.cssText = [
    'position:absolute','top:16px','right:54px','width:252px',
    'background:rgba(3,8,22,0.95)','border:1px solid rgba(255,255,255,0.09)',
    'border-radius:18px','padding:20px 20px 12px','z-index:20',
    'transform:translateX(130%)','transition:transform 0.38s cubic-bezier(0.34,1.15,0.64,1)',
    'pointer-events:auto','max-height:86%','overflow-y:auto',
    'scrollbar-width:thin','scrollbar-color:rgba(255,255,255,0.08) transparent',
    'box-shadow:0 8px 40px rgba(0,0,0,0.7)',
  ].join(';');
  mapEl.appendChild(panel);

  function showPanel(city) {
    const spots = CITY_SPOTS[city.name] || [];
    panel.innerHTML = `
      <button id="pClose" style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:15px;width:40px;height:40px;border-radius:50%;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center;">✕</button>
      <div style="font-size:16px;font-weight:700;color:#fff;letter-spacing:-0.01em;padding-right:28px;">${city.name}</div>
      <div style="font-size:11px;color:${city.color};margin-bottom:14px;letter-spacing:0.04em;">${city.kr} &nbsp;·&nbsp; ${window.kpI18n?.t('city.top') || 'Top Attractions'}</div>
      <div style="border-top:1px solid rgba(255,255,255,0.06);"></div>
      ${spots.map((s,i)=>`
        <div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);${i===spots.length-1?'border-bottom:none':''}">
          <span style="font-size:16px;line-height:1.4;flex-shrink:0;margin-top:1px;">${s.e}</span>
          <div>
            <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.9);line-height:1.45;">${s.n}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.62);margin-top:2px;line-height:1.35;">${s.d}</div>
          </div>
        </div>`).join('')}
      <div style="padding-top:12px;">
        <button id="pAsk" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.78);font-size:10px;padding:8px 12px;border-radius:20px;cursor:pointer;font-family:Inter,sans-serif;transition:background 0.2s;">
          ${window.kpI18n?.t('chat.askCity') || '💬 Ask AI Guide about'} ${city.name}
        </button>
      </div>`;
    panel.style.transform = 'translateX(0)';
    panel.querySelector('#pClose').onclick = hidePanel;
    panel.querySelector('#pAsk').onmouseenter = e=>e.target.style.background='rgba(255,255,255,0.1)';
    panel.querySelector('#pAsk').onmouseleave = e=>e.target.style.background='rgba(255,255,255,0.05)';
    panel.querySelector('#pAsk').onclick = ()=>{
      const q = (window.kpI18n?.t('chat.q.city') || 'Tell me about the top attractions in {city}, Korea').replace('{city}', city.name);
      hidePanel();
      if (typeof sendQuick === 'function') sendQuick(q);
      else { openChat(); const inp = document.getElementById('chat-input'); if (inp) { inp.value = q; inp.focus(); } }
    };
  }

  function hidePanel() { panel.style.transform = 'translateX(130%)'; }

  // ═══════════════════════════════════════════════════════
  // CITY MARKERS
  // ═══════════════════════════════════════════════════════
  const CITIES_MAP = [
    {name:'Seoul',   kr:'서울',lat:37.57,lng:126.97,color:'#ff7675',r:5.5},
    {name:'Busan',   kr:'부산',lat:35.18,lng:129.07,color:'#74b9ff',r:4.5},
    {name:'Incheon', kr:'인천',lat:37.46,lng:126.70,color:'#55efc4',r:3.5},
    {name:'Gyeongju',kr:'경주',lat:35.84,lng:129.21,color:'#fdcb6e',r:3},
    {name:'Jeonju',  kr:'전주',lat:35.82,lng:127.15,color:'#a29bfe',r:3},
    {name:'Jeju',    kr:'제주',lat:33.50,lng:126.53,color:'#00cec9',r:3.5},
    {name:'Andong',  kr:'안동',lat:36.57,lng:128.73,color:'#fd79a8',r:3},
    {name:'Yeosu',   kr:'여수',lat:34.76,lng:127.66,color:'#81ecec',r:3},
  ];

  function zoomToCity(city) {
    const [tx,ty] = ll(city.lat, city.lng);
    zoom=2.5; panX=tx-W/2-70; panY=ty-H/2; applyView();
    showPanel(city);
  }

  CITIES_MAP.forEach(city=>{
    const [cx,cy]=ll(city.lat,city.lng);
    const g=el('g',{class:'city-dot',style:'cursor:pointer'},svg);
    el('circle',{cx,cy,r:22,fill:'transparent','pointer-events':'all'},g); // touch hit area
    el('circle',{cx,cy,r:city.r*2.3,fill:'none',stroke:city.color,'stroke-width':'1.2',class:'city-pulse',opacity:'0.7'},g);
    el('circle',{cx,cy,r:city.r,fill:city.color,filter:'url(#glow)'},g);
    el('circle',{cx,cy,r:city.r*0.4,fill:'#fffaf0'},g);
    // Hover tooltip
    const lx = cx>820 ? cx-92 : cx+10;
    const tip=el('g',{opacity:'0',style:'pointer-events:none'},g);
    el('rect',{x:lx,y:cy-20,width:86,height:31,rx:7,fill:'rgba(0,4,18,0.9)',stroke:city.color,'stroke-width':'0.8'},tip);
    const tn=el('text',{x:lx+8,y:cy-5,fill:'#fff','font-size':'10','font-weight':'700','font-family':'Inter,sans-serif'},tip); tn.textContent=city.name;
    const tk=el('text',{x:lx+8,y:cy+7,fill:city.color,'font-size':'9','font-family':'Inter,sans-serif'},tip); tk.textContent=city.kr;
    g.addEventListener('mouseenter',()=>tip.setAttribute('opacity','1'));
    g.addEventListener('mouseleave',()=>tip.setAttribute('opacity','0'));
    g.addEventListener('click',()=>{
      document.querySelectorAll('.city-pill').forEach(p=>p.classList.remove('active'));
      document.querySelector(`.city-pill[data-name="${city.name}"]`)?.classList.add('active');
      zoomToCity(city);
    });
  });

  // ═══════════════════════════════════════════════════════
  // DETAIL LAYER — clean glow dots (no overlapping text)
  // ═══════════════════════════════════════════════════════
  const SPOTS = [
    {lat:37.577,lng:126.977},{lat:37.551,lng:126.988},{lat:37.563,lng:126.983},
    {lat:37.556,lng:126.923},{lat:37.574,lng:126.987},{lat:37.529,lng:126.993},
    {lat:37.511,lng:127.059},{lat:35.159,lng:129.161},{lat:35.097,lng:129.010},
    {lat:35.097,lng:129.030},{lat:33.362,lng:126.529},{lat:33.458,lng:126.942},
    {lat:35.790,lng:129.332},{lat:35.815,lng:127.153},{lat:36.540,lng:128.518},
    {lat:34.760,lng:127.664},{lat:37.950,lng:126.800},{lat:37.790,lng:127.524},
    {lat:38.119,lng:128.465},
  ];
  SPOTS.forEach(s=>{
    const [ax,ay]=ll(s.lat,s.lng);
    const ag=el('g',{},detailLayer);
    el('circle',{cx:ax,cy:ay,r:5,fill:'rgba(255,210,100,0.10)',stroke:'rgba(255,200,80,0.45)','stroke-width':'0.8'},ag);
    el('circle',{cx:ax,cy:ay,r:2,fill:'rgba(255,230,140,0.75)'},ag);
  });

  // Zoom hint (data-i18n so applyTranslations repairs the boot-time raw key)
  const hint=el('text',{x:W-54,y:134,fill:'rgba(255,255,255,0.55)','font-size':'8.5','text-anchor':'middle','font-family':'Inter,sans-serif'},zCtrl); hint.setAttribute('data-i18n','map.hint1');
  const hv=window.kpI18n?.t('map.hint1'); hint.textContent=(hv&&hv!=='map.hint1')?hv:'Ctrl + scroll';
  const hint2=el('text',{x:W-54,y:145,fill:'rgba(255,255,255,0.55)','font-size':'8.5','text-anchor':'middle','font-family':'Inter,sans-serif'},zCtrl); hint2.setAttribute('data-i18n','map.hint2');
  const hv2=window.kpI18n?.t('map.hint2'); hint2.textContent=(hv2&&hv2!=='map.hint2')?hv2:'to zoom';
  mapEl.addEventListener('wheel',()=>{hint.remove();hint2.remove();},{once:true,passive:true});

  mapEl.appendChild(svg);
  mapEl.style.background = '#000204';

  // City pills
  const pillsEl = document.getElementById('city-pills');
  if (pillsEl) {
    CITIES_MAP.forEach(city=>{
      const btn=document.createElement('button');
      btn.className='city-pill'; btn.dataset.name=city.name;
      btn.innerHTML=`<span class="pill-dot" style="background:${city.color}"></span>${city.name}`;
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.city-pill').forEach(p=>p.classList.remove('active'));
        btn.classList.add('active');
        zoomToCity(city);
      });
      pillsEl.appendChild(btn);
    });
  }
}

/* ===== CONTENT GRID ===== */
function renderGrid(cat) {
  const grid = document.getElementById('content-grid');
  if (!grid) return;
  const i18n = (k, fb) => { const v = window.kpI18n?.t(k); return (!v || v === k) ? (fb || k) : v; };
  const items = KOREA_DATA[cat] || [];
  grid.innerHTML = items.map((item, i) => {
    const d = JSON.stringify(item).replace(/'/g, '&#39;');
    return `
      <div class="card" style="animation-delay:${i * 0.045}s" data-item='${d}' tabindex="0" role="button" aria-label="${i18n('card.learn', 'Learn about')} ${item.name}">
        <span class="card-emoji">${item.emoji}</span>
        <div class="card-name">${item.name}</div>
        <div class="card-kr">${item.kr} &nbsp;·&nbsp; ${item.region}</div>
        <div class="card-desc">${item.desc}</div>
        <div class="card-tags">${item.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="card-actions">
          <button class="card-detail-btn" data-item='${d}'>${i18n('card.fullguide', '📖 Full Guide →')}</button>
          <button class="card-map-btn" data-item='${d}'>${i18n('card.map', '📍 Map')}</button>
          ${window.kpTrip ? kpTrip.heartHTML({ name: item.name }) : ''}
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.classList.contains('card-map-btn')) {
        e.stopPropagation();
        try { openMapPanel(JSON.parse(e.target.dataset.item)); } catch {}
        return;
      }
      try { if (window.kpDetail) kpDetail.open(JSON.parse(card.dataset.item)); } catch {}
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        try { if (window.kpDetail) kpDetail.open(JSON.parse(card.dataset.item)); } catch {}
      }
    });
  });
}

/* ===== TABS ===== */
let activeCat = 'food';
function initTabs() {
  document.querySelectorAll('.cat-tab, .nav-btn, .hero-cta[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      if (!cat) return;
      activeCat = cat;
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
      document.querySelectorAll('.nav-btn').forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
      renderGrid(cat);
      document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ===== GOOGLE MAPS PANEL ===== */
let _mapReturnFocus = null;
function openMapPanel(item) {
  _mapReturnFocus = document.activeElement;
  const panel = document.getElementById('map-panel');
  const backdrop = document.getElementById('mp-backdrop');
  document.getElementById('mp-title').textContent = item.name;
  document.getElementById('mp-kr').textContent = item.kr;
  document.getElementById('mp-rating').innerHTML = '';
  document.getElementById('mp-reviews').innerHTML = `<div class="mp-no-reviews">${window.kpI18n?.t('mp.loading') || 'Loading reviews...'}</div>`;
  panel.classList.add('open');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.body.classList.add('kp-modal-open');
  setTimeout(() => document.getElementById('mp-close')?.focus(), 60);

  const gmapFrame = document.getElementById('gmap');
  const q = encodeURIComponent(item.mapQ || item.name + ' Korea');
  // Keyless Google embed — a real interactive map with NO API key required.
  // (If a premium embed key is configured, use it for the nicer tiles.)
  const src = (MAPS_KEY && MAPS_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY')
    ? `https://www.google.com/maps/embed/v1/search?key=${MAPS_KEY}&q=${q}&zoom=14&language=en&region=KR`
    : `https://maps.google.com/maps?q=${q}&z=14&hl=en&output=embed`;
  gmapFrame.innerHTML = `<iframe src="${src}" allowfullscreen loading="lazy" title="Map"></iframe>`;
  fetchPlaceDetails(item.mapQ || item.name + ' Korea');
  loadMapExtras(item);

  document.getElementById('mp-directions').href = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  document.getElementById('mp-gmaps').href = `https://www.google.com/maps/search/${q}`;
  const naver = document.getElementById('mp-naver');
  const kakao = document.getElementById('mp-kakao');
  if (naver) naver.href = `https://map.naver.com/p/search/${q}`;
  if (kakao) kakao.href = `https://map.kakao.com/?q=${q}`;
}

async function fetchPlaceDetails(query) {
  if (!WORKER_URL) return;
  try {
    const res = await fetch(`${WORKER_URL}/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    if (data.rating) renderPlaceDetails(data);
    else document.getElementById('mp-reviews').innerHTML = `<div class="mp-no-reviews">${window.kpI18n?.t('mp.no_reviews') || 'No ratings found'}</div>`;
  } catch {
    document.getElementById('mp-reviews').innerHTML = `<div class="mp-no-reviews">${window.kpI18n?.t('mp.no_reviews') || 'No reviews available yet'}</div>`;
  }
}

function renderPlaceDetails(data) {
  const stars = '⭐'.repeat(Math.round(data.rating || 0));
  document.getElementById('mp-rating').innerHTML = `
    <span class="mp-stars">${stars}</span>
    <span class="mp-score">${data.rating?.toFixed(1) || '—'}</span>
    <span class="mp-count">(${(data.userRatingsTotal || 0).toLocaleString()} ${window.kpI18n?.t('dp.reviews') || 'reviews'})</span>`;

  const reviewsEl = document.getElementById('mp-reviews');
  if (data.reviews?.length) {
    reviewsEl.innerHTML = data.reviews.slice(0, 3).map(r => `
      <div class="mp-review">
        <span class="mp-reviewer">${r.authorName}</span>
        <span class="mp-review-stars">${'⭐'.repeat(r.rating)}</span>
        <div class="mp-review-text">${(r.text || '').slice(0, 200)}${(r.text || '').length > 200 ? '…' : ''}</div>
        <div class="mp-review-time">${r.relativeTime}</div>
      </div>`).join('');
  } else {
    reviewsEl.innerHTML = `<div class="mp-no-reviews">${window.kpI18n?.t('mp.no_reviews') || 'No reviews available yet'}</div>`;
  }
}

/* Composite extras for the map panel: live festivals + related places
   from our own data, so the panel is a mini local hub — not just a map. */
function loadMapExtras(item) {
  const box = document.getElementById('mp-extra');
  if (!box) return;
  const t = (k, fb) => { const v = window.kpI18n?.t(k); return (v && v !== k) ? v : fb; };
  const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const region = String(item.region || '');
  const cityHit = (typeof CITIES !== 'undefined' ? CITIES : []).find(c => region.includes(c.name) || (item.mapQ || '').includes(c.name));
  const city = cityHit ? cityHit.name : 'Seoul';

  // Related: same-region items across all categories (tap → full detail)
  let related = [];
  if (typeof KOREA_DATA !== 'undefined') {
    for (const [cat, items] of Object.entries(KOREA_DATA)) {
      for (const it of items) {
        if (it.name === item.name) continue;
        if ((it.region || '').includes(region) || (region && (it.region || '').includes(city)) || (it.mapQ || '').includes(city)) {
          related.push({ ...it, cat });
        }
      }
    }
  }
  if (related.length < 3 && typeof KOREA_DATA !== 'undefined') {
    related = related.concat(KOREA_DATA.travel.filter(x => x.name !== item.name).map(x => ({ ...x, cat: 'travel' })));
  }
  related = related.slice(0, 6);

  let html = '';
  if (related.length) {
    html += `<div class="mp-sec-title">${t('mp.related', '🧭 Explore more in this area')}</div>
      <div class="mp-chips">${related.map((r, i) =>
        `<button class="mp-chip" data-rel="${i}">${r.emoji} ${esc(r.name)}</button>`).join('')}</div>`;
  }
  html += `<div class="mp-sec-title">${t('mp.festivals', '🎪 Festivals & events nearby')}</div>
    <div id="mp-fest"><div class="mp-no-reviews">${t('dash.loading', 'Loading…')}</div></div>`;
  box.innerHTML = html;

  box.querySelectorAll('.mp-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = related[+btn.dataset.rel];
      document.getElementById('mp-close')?.click();
      if (window.kpDetail) kpDetail.open(r);
    });
  });

  const fest = document.getElementById('mp-fest');
  if (window.KPApi) {
    // City filter first; TourAPI's per-city tagging is sparse, so fall back
    // to the nationwide list rather than showing an empty section.
    KPApi.getFestivals({ city })
      .then(d => {
        const l = (d.festivals || d || []);
        return l.length ? l : KPApi.getFestivals({}).then(d2 => (d2.festivals || d2 || []));
      })
      .then(listAll => {
      const list = listAll.slice(0, 3);
      if (!list.length) { fest.innerHTML = `<div class="mp-no-reviews">${t('mp.noFest', 'No events found right now')}</div>`; return; }
      fest.innerHTML = list.map(f => `
        <a class="mp-fest-row" href="festivals.html">
          <span class="mf-name">${esc(f.nameEn || f.nameKo)}</span>
          <span class="mf-date">${KPApi.fmtDateRange(f.eventStartDate || f.startDate, f.eventEndDate || f.endDate)}</span>
        </a>`).join('');
    }).catch(() => { fest.innerHTML = `<div class="mp-no-reviews">${t('mp.noFest', 'No events found right now')}</div>`; });
  } else {
    fest.innerHTML = `<a class="mp-fest-row" href="festivals.html"><span class="mf-name">📅 Festival calendar</span></a>`;
  }
}

function initMapPanel() {
  const close = () => {
    document.getElementById('map-panel').classList.remove('open');
    document.getElementById('mp-backdrop').classList.remove('open');
    document.body.style.overflow = '';
    document.body.classList.remove('kp-modal-open');
    try { _mapReturnFocus?.focus?.(); } catch {}
    _mapReturnFocus = null;
  };
  document.getElementById('mp-close')?.addEventListener('click', close);
  document.getElementById('mp-backdrop')?.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('map-panel')?.classList.contains('open')) close();
  });
}

/* ===== AI CHATBOT ===== */
let chatHistory = [], isThinking = false;

const CHAT_CAPS = [
  { builder: true,         lkey: 'tb.menu' },
  { qkey: 'chat.q.itin',   lkey: 'chat.quick.itin',   link: { href: 'plan.html',                          labelKey: 'chat.link.planner' } },
  { qkey: 'chat.q.food',   lkey: 'chat.quick.food' },
  { qkey: 'chat.q.visit',  lkey: 'chat.quick.visit' },
  { qkey: 'chat.q.budget', lkey: 'chat.quick.budget', link: { href: 'currency.html',                      labelKey: 'chat.link.budget' } },
  { qkey: 'chat.q.visa',   lkey: 'chat.quick.visa',   link: { href: 'guide/korea-visa-k-eta-guide.html',  labelKey: 'chat.link.visa' } },
];

function showChatMenu() {
  const msgs = document.getElementById('chat-messages');
  if (!msgs || document.getElementById('chat-menu')) return;
  const t = (k, fb) => { const v = window.kpI18n?.t(k); return (v && v !== k) ? v : fb; };
  const div = document.createElement('div');
  div.className = 'chat-msg assistant';
  div.id = 'chat-menu';
  div.innerHTML = `<div class="msg-bubble">
    <div class="chat-menu-title">${t('chat.menu.title', "Here's what I can do — tap one to try 👇")}</div>
    <div class="chat-menu-chips">${CHAT_CAPS.map((c, i) =>
      `<button class="chat-menu-chip" data-cap="${i}">${t(c.lkey, c.lkey)}</button>`).join('')}</div>
  </div>`;
  msgs.appendChild(div);
  div.querySelectorAll('.chat-menu-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = CHAT_CAPS[+btn.dataset.cap];
      if (c.builder) { startTripBuilder(); return; }
      const q = t(c.qkey, c.qkey);
      const follow = c.link ? { href: c.link.href, label: t(c.link.labelKey, c.link.labelKey) } : null;
      sendMessage(q, follow);
    });
  });
  msgs.scrollTop = msgs.scrollHeight;
}

/* Re-localize the capability menu in place after a language switch */
function refreshChatMenu() {
  const div = document.getElementById('chat-menu');
  if (!div) return;
  const t = (k, fb) => { const v = window.kpI18n?.t(k); return (v && v !== k) ? v : fb; };
  const title = div.querySelector('.chat-menu-title');
  if (title) title.textContent = t('chat.menu.title', "Here's what I can do — tap one to try 👇");
  div.querySelectorAll('.chat-menu-chip').forEach(btn => {
    const c = CHAT_CAPS[+btn.dataset.cap];
    if (c) btn.textContent = t(c.lkey, c.lkey);
  });
}

let _chatReturnFocus = null;
function openChat() {
  _chatReturnFocus = document.activeElement;
  document.getElementById('chatbot')?.classList.add('open');
  document.body.classList.add('kp-modal-open');
  hideChatTease();
  showChatMenu();
  // Move focus into the dialog for keyboard + screen-reader users.
  setTimeout(() => document.getElementById('chat-input')?.focus(), 60);
}
function closeChat() {
  document.getElementById('chatbot')?.classList.remove('open');
  document.body.classList.remove('kp-modal-open');
  try { _chatReturnFocus?.focus?.(); } catch {}
  _chatReturnFocus = null;
}

function addMsg(role, html) {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `<div class="msg-bubble">${html}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function addTyping() {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = 'chat-msg assistant';
  div.innerHTML = '<div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

async function sendMessage(text, followLink) {
  if (!text.trim() || isThinking) return;
  isThinking = true;
  const input = document.getElementById('chat-input');
  if (input) input.value = '';
  addMsg('user', text.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  chatHistory.push({ role: 'user', content: text });
  const typingEl = addTyping();
  try {
    const res = await fetch(`${WORKER_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: chatHistory.slice(-8), lang: window.kpI18n?.getLang?.() || 'en' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const reply = data.reply || (window.kpI18n?.t('chat.err') || '⚠️ AI temporarily unavailable. Please try again.');
    typingEl?.remove();
    addMsg('assistant', reply
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    );
    chatHistory.push({ role: 'assistant', content: reply });
    if (followLink) addLinkCard(followLink.href, followLink.label);
  } catch (err) {
    typingEl?.remove();
    addMsg('assistant', window.kpI18n?.t('chat.err') || '⚠️ AI temporarily unavailable. Please try again.');
  } finally {
    isThinking = false;
  }
}

function sendQuick(text, followLink) { openChat(); setTimeout(() => sendMessage(text, followLink), 80); }

/* In-chat link card — the bot's reply gets a tappable recommendation
   (planner / visa guide / budget calculator) right under it. */
function addLinkCard(href, label) {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;
  const a = document.createElement('a');
  a.className = 'chat-link-card';
  a.href = href;
  a.textContent = label;
  msgs.appendChild(a);
  msgs.scrollTop = msgs.scrollHeight;
}


/* ═══════════════════════════════════════════════════════
   CONVERSATIONAL TRIP BUILDER
   Chip-driven slot filling inside the chat → /api/plan →
   summary card with Save (My Trip) / Share (/i/{id}) / Open.
   Typed messages still flow to the normal LLM chat, so users
   can refine the generated plan conversationally afterwards.
═══════════════════════════════════════════════════════ */
const TB = { active: false, slots: {} };
const tbT = (k, fb) => { const v = window.kpI18n?.t(k); return (v && v !== k) ? v : fb; };

function tbBotMsg(html) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg assistant';
  div.innerHTML = `<div class="msg-bubble">${html}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}
function tbUserEcho(text) { addMsg('user', text.replace(/</g, '&lt;')); }

function tbChips(items, onPick, multi) {
  // items: [{id,label}] — renders inside a bot bubble; multi adds Done chip
  const picked = new Set();
  const html = `<div class="chat-menu-chips">${items.map(it =>
    `<button class="chat-menu-chip" data-id="${it.id}">${it.label}</button>`).join('')}
    ${multi ? `<button class="chat-menu-chip tb-done" data-id="__done">${tbT('tb.theme.done', '✅ Done')}</button>` : ''}</div>`;
  const bubble = tbBotMsg(html);
  bubble.querySelectorAll('.chat-menu-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (multi && id !== '__done') {
        picked.has(id) ? picked.delete(id) : picked.add(id);
        btn.classList.toggle('sel', picked.has(id));
        return;
      }
      // lock this chip row
      bubble.querySelectorAll('.chat-menu-chip').forEach(b => { b.disabled = true; b.style.opacity = .45; });
      if (multi) {
        if (!picked.size) picked.add('food');
        const labels = items.filter(i => picked.has(i.id)).map(i => i.label).join(', ');
        tbUserEcho(labels);
        onPick([...picked]);
      } else {
        tbUserEcho(btn.textContent.trim());
        onPick(id);
      }
    });
  });
}

function startTripBuilder() {
  openChat();
  if (TB.active) return;
  TB.active = true; TB.slots = {};
  tbBotMsg(tbT('tb.intro', "Let's design your Korea trip together!"));
  tbAskDays();
}

function tbAskDays() {
  tbBotMsg(tbT('tb.q.days', 'How many days will you stay?'));
  const dl = n => tbT('tb.days.n', '{n} days').replace('{n}', n);
  tbChips([3, 5, 7, 10].map(n => ({ id: String(n), label: dl(n) })), id => {
    TB.slots.days = +id; tbAskParty();
  });
}
function tbAskParty() {
  tbBotMsg(tbT('tb.q.party', "Who are you traveling with?"));
  tbChips([
    { id: 'solo',   label: tbT('tb.party.solo', '🧳 Solo') },
    { id: 'couple', label: tbT('tb.party.couple', '💑 Couple') },
    { id: 'family', label: tbT('tb.party.family', '👨‍👩‍👧 Family') },
    { id: 'group',  label: tbT('tb.party.group', '👥 Friends') },
  ], id => {
    TB.slots.party = id;
    // 틈틈이 추가 제안 — 동행 맞춤 팁
    if (id === 'family') tbBotMsg(tbT('tb.tip.family', "💡 I'll keep days relaxed and kid-friendly."));
    if (id === 'couple') tbBotMsg(tbT('tb.tip.couple', "💡 I'll weave in a romantic night view."));
    tbAskTheme();
  });
}
function tbAskTheme() {
  tbBotMsg(tbT('tb.q.theme', 'Pick all you like, then Done 👇'));
  const ints = ['kpop','food','history','nature','shopping','nightlife','wellness','temples'];
  tbChips(ints.map(i => ({ id: i, label: tbT('tb.int.' + i, i) })), ids => {
    TB.slots.interests = ids; tbAskBase();
  }, true);
}
function tbAskBase() {
  tbBotMsg(tbT('tb.q.base', 'Where will you be based?'));
  tbChips([
    { id: 'ICN', label: tbT('tb.base.seoul', '🏯 Seoul') },
    { id: 'PUS', label: tbT('tb.base.busan', '🌊 Busan') },
    { id: 'CJU', label: tbT('tb.base.jeju', '🌋 Jeju') },
  ], id => { TB.slots.airport = id; tbAskBudget(); });
}
function tbAskBudget() {
  tbBotMsg(tbT('tb.q.budget', 'Your daily budget per person?'));
  tbChips([
    { id: 'budget',  label: tbT('tb.bud.budget', '💰 ~$50') },
    { id: 'mid',     label: tbT('tb.bud.mid', '💳 ~$100') },
    { id: 'comfort', label: tbT('tb.bud.comfort', '🏨 ~$200') },
    { id: 'luxury',  label: tbT('tb.bud.luxury', '💎 $300+') },
  ], id => { TB.slots.budget = id; tbGenerate(); });
}

async function tbGenerate() {
  const wait = tbBotMsg(`${tbT('tb.building', '✨ Building your plan…')}<div class="typing-dots" style="margin-top:8px"><span></span><span></span><span></span></div>`);
  const start = new Date(Date.now() + 21 * 86400000); // 3 weeks out
  // worker's daysBetween = date diff, so a {days}-day plan needs end = start + days
  const end = new Date(start.getTime() + TB.slots.days * 86400000);
  const iso = d => d.toISOString().slice(0, 10);
  const inputs = {
    arrival: iso(start), departure: iso(end), airport: TB.slots.airport,
    interests: TB.slots.interests, pace: 'balanced', budget: TB.slots.budget,
    travelers: TB.slots.party, ageGroups: ['20s'], specialNeeds: [], mode: 'foreigner',
    lang: window.kpI18n?.getLang?.() || 'en',
  };
  try {
    const res = await fetch(`${WORKER_URL}/api/plan`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputs),
    });
    const data = await res.json();
    if (!res.ok || !data.itinerary) throw new Error(data.error || 'failed');
    wait.remove();
    tbShowResult(data.itinerary, inputs);
  } catch (e) {
    wait.remove();
    tbBotMsg(tbT('tb.fail', 'Hit the daily limit — use the full planner:'));
    addLinkCard('plan.html', tbT('chat.link.planner', '🗺️ Open the AI Trip Planner'));
    TB.active = false;
  }
}

function tbShowResult(itin, inputs) {
  TB.itin = itin; TB.inputs = inputs;
  const days = (itin.days || []).length || TB.slots.days;
  const stops = (itin.days || []).reduce((n, d) =>
    n + ['morning', 'afternoon', 'evening'].reduce((m, s) => m + ((d[s] || []).length), 0), 0);
  const esc = s => String(s || '').replace(/</g, '&lt;');
  const hl = (itin.highlights || []).slice(0, 3).map(h => `<li>${esc(h)}</li>`).join('');
  const d1 = (itin.days || [])[0];
  const d1names = d1 ? ['morning', 'afternoon'].flatMap(s => (d1[s] || []).slice(0, 2)).map(p => esc(p.name)).slice(0, 3).join(' → ') : '';
  tbBotMsg(`
    <div class="tb-card">
      <div class="tb-title">${tbT('tb.done', '🎉 Your plan is ready!').replace('{d}', days).replace('{n}', stops)}</div>
      <div class="tb-name">${esc(itin.title || tbT('tb.untitled', 'Korea Itinerary'))}</div>
      ${hl ? `<ul class="tb-hl">${hl}</ul>` : ''}
      ${d1names ? `<div class="tb-d1">${tbT('tb.day1', 'Day 1')} · ${d1names}…</div>` : ''}
      <div class="tb-actions">
        <button id="tb-save">${tbT('tb.save', '💾 Save')}</button>
        <button id="tb-share">${tbT('tb.share', '🔗 Share')}</button>
        <a id="tb-open" href="plan.html">${tbT('tb.open', '📄 Open full plan')}</a>
      </div>
    </div>`);
  // 전체 플랜을 플래너 페이지가 그대로 읽도록 저장
  try { localStorage.setItem('kp_itinerary', JSON.stringify({ itinerary: itin, inputs, savedAt: Date.now() })); } catch {}
  document.getElementById('tb-save').addEventListener('click', () => {
    if (window.kpTrip) { kpTrip.saveItinerary(itin, inputs); tbBotMsg(tbT('tb.saved', '💾 Saved!')); }
  });
  document.getElementById('tb-share').addEventListener('click', async () => {
    const btn = document.getElementById('tb-share');
    btn.disabled = true;
    try {
      const r = await fetch(`${WORKER_URL}/api/plan/share`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary: itin }),
      });
      const d = await r.json();
      if (!d.id) throw 0;
      const url = `${WORKER_URL}/i/${d.id}`;
      try { await navigator.clipboard.writeText(url); } catch {}
      tbBotMsg(tbT('tb.shared', '🔗 Link copied!'));
      addLinkCard(url, url.replace('https://', ''));
    } catch { tbBotMsg('⚠️'); }
    btn.disabled = false;
  });
  // 후속 수정 안내 + LLM 문맥 주입(타이핑으로 일정 다듬기 가능)
  tbBotMsg(tbT('tb.refine', 'Want tweaks? Just tell me ✍️'));
  const outline = (itin.days || []).map((d, i) =>
    `Day ${i + 1}: ` + ['morning', 'afternoon', 'evening'].flatMap(s => (d[s] || []).map(p => p.name)).join(', ')
  ).join(' | ');
  chatHistory.push({ role: 'assistant', content: `[Itinerary "${itin.title}" created] ${outline}`.slice(0, 900) });
  TB.active = false;
}

function initChat() {
  // Quick chips: resolve the question in the CURRENT language at click time
  document.querySelectorAll('#chat-quick [data-qkey]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.qkey;
      if (k === 'tb') { startTripBuilder(); return; }
      const q = window.kpI18n?.t(k);
      sendQuick(q && q !== k ? q : btn.textContent.trim());
    });
  });
  document.getElementById('chat-fab')?.addEventListener('click', openChat);
  document.getElementById('chat-close')?.addEventListener('click', closeChat);
  document.getElementById('ai-open-btn')?.addEventListener('click', openChat);
  document.getElementById('hero-ai-btn')?.addEventListener('click', openChat);
  const input = document.getElementById('chat-input');
  document.getElementById('chat-send')?.addEventListener('click', () => sendMessage(input?.value || ''));
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(input.value); });
}

/* ===== PROACTIVE CHAT TEASER ===== */
function hideChatTease() {
  document.getElementById('chat-tease')?.remove();
}

function initChatTease() {
  try { if (sessionStorage.getItem('kpTeased')) return; } catch {}
  setTimeout(() => {
    if (document.getElementById('chatbot')?.classList.contains('open')) return;
    const t = (k, fb) => { const v = window.kpI18n?.t(k); return (v && v !== k) ? v : fb; };
    const el = document.createElement('div');
    el.id = 'chat-tease';
    el.className = 'chat-tease';
    el.setAttribute('role', 'dialog');
    el.innerHTML = `
      <button class="ct-close" aria-label="Close">✕</button>
      <div class="ct-ava">🤖</div>
      <div class="ct-body">
        <div class="ct-hi">${t('tease.hi', '👋 Planning a Korea trip?')}</div>
        <div class="ct-sub">${t('tease.sub', "I'm your free AI guide — ask me anything.")}</div>
        <button class="ct-cta">${t('tease.cta', 'Ask me anything')} →</button>
      </div>`;
    document.body.appendChild(el);
    try { sessionStorage.setItem('kpTeased', '1'); } catch {}
    setTimeout(() => el.classList.add('show'), 60); // rAF stalls in background tabs
    el.querySelector('.ct-close').addEventListener('click', e => { e.stopPropagation(); hideChatTease(); });
    el.querySelector('.ct-cta').addEventListener('click', openChat);
    el.querySelector('.ct-body').addEventListener('click', openChat);
  }, 2500);
}

/* ===== SCROLL REVEAL ===== */
function initScrollReveal() {
  // Respect reduced-motion: show everything immediately, skip the animation.
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ===== HEADER SCROLL ===== */
function initHeader() {
  window.addEventListener('scroll', () => {
    document.getElementById('header')?.classList.toggle('scrolled', window.scrollY > 50);
  });
}

/* ===== RETENTION: welcome-back + recently-viewed ===== */
let _kpVisits = 0;
function initVisits() {
  try { _kpVisits = (parseInt(localStorage.getItem('kp_visits') || '0', 10) || 0) + 1;
    localStorage.setItem('kp_visits', String(_kpVisits)); } catch { _kpVisits = 1; }
}
function renderRetain() {
  const host = document.getElementById('kp-retain');
  if (!host) return;
  const tt = (k, fb) => { const v = window.kpI18n?.t(k); return (v && v !== k) ? v : fb; };
  let html = '';

  // Welcome-back strip — only for returning visitors with saved activity.
  let saved = 0, itin = null;
  try { saved = (window.kpTrip?.counts?.() || {}).total || 0; } catch {}
  try { itin = JSON.parse(localStorage.getItem('kp_itinerary') || 'null'); } catch {}
  if (_kpVisits >= 2 && (saved > 0 || itin)) {
    const cards = [];
    if (itin && itin.itinerary) {
      const title = String(itin.itinerary.title || tt('plan.result.title', 'Your Korea Itinerary')).slice(0, 40);
      cards.push(`<a class="kp-rt-card" href="plan.html"><span class="ic">🗺️</span><span>${tt('retain.continuePlan', 'Continue your plan')}<span class="sub">${title.replace(/</g, '&lt;')}</span></span></a>`);
    }
    if (saved > 0) {
      cards.push(`<button class="kp-rt-card" data-rt-open="trips"><span class="ic">❤️</span><span>${tt('retain.savedCount', '{n} saved items').replace('{n}', saved)}<span class="sub">${tt('retain.openTrip', 'Open My Trip')}</span></span></button>`);
    }
    if (cards.length) {
      html += `<div class="kp-rt-welcome"><div class="kp-rt-hi">👋 ${tt('retain.welcomeBack', 'Welcome back!')}</div><div class="kp-rt-cards">${cards.join('')}</div></div>`;
    }
  }

  // Recently-viewed rail.
  let viewed = [];
  try { viewed = JSON.parse(localStorage.getItem('kp_viewed_v1') || '[]'); } catch {}
  viewed = (viewed || []).filter(v => v && v.name).slice(0, 12);
  if (viewed.length) {
    const chips = viewed.map((v, i) => `<button class="kp-rv-chip" data-rv="${i}"><span class="rv-emoji">${v.emoji || '📍'}</span><span class="rv-name">${String(v.name).replace(/</g, '&lt;')}</span></button>`).join('');
    html += `<div class="kp-rv"><div class="kp-rv-title">${tt('retain.recentTitle', '🕘 Recently viewed')}</div><div class="kp-rv-rail">${chips}</div></div>`;
  }

  host.innerHTML = html;

  // Wire interactions.
  host.querySelectorAll('[data-rt-open]').forEach(b =>
    b.addEventListener('click', () => { try { window.kpTrip?.open?.(b.dataset.rtOpen); } catch {} }));
  host.querySelectorAll('.kp-rv-chip').forEach(b =>
    b.addEventListener('click', () => { const v = viewed[+b.dataset.rv]; if (v && window.kpDetail) { try { kpDetail.open(v); } catch {} } }));
}

/* ===== BOOT ===== */
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initTabs();
  initMapPanel();
  renderGrid('food');
  initChat();
  initChatTease();
  initHeader();
  initScrollReveal();
  initVisits();
  renderRetain();

  // Refresh the recently-viewed rail whenever a place is opened.
  document.addEventListener('kp:viewed', renderRetain);

  // Re-render i18n-dependent dynamic UI on language change. This event also
  // fires once after the initial async message load, repairing the boot-time
  // render that happens before messages/*.json arrives.
  document.addEventListener('kp:langchange', () => {
    renderGrid(activeCat);
    refreshChatMenu();
    renderRetain();
  });
});
