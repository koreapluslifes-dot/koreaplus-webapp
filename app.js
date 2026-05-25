/* ===== CONFIG ===== */
const MAPS_KEY = window.MAPS_KEY || '';
const WORKER_URL = window.WORKER_URL || '';

/* ===== NIGHT-FROM-SPACE SVG MAP ===== */
function initMap() {
  const mapEl = document.getElementById('korea-map');
  if (!mapEl) return;

  const W = 1400, H = 700;
  const NS = 'http://www.w3.org/2000/svg';

  // Geographic projection — tuned so peninsula fills right-center of frame
  function ll(lat, lng) {
    return [+(580 + (lng - 124.0) * 60).toFixed(1), +(108 + (42.0 - lat) * 48).toFixed(1)];
  }

  // Catmull-Rom → Cubic Bezier smooth closed path
  function smoothPath(pts) {
    const n = pts.length;
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i];
      const p2 = pts[(i + 1) % n],    p3 = pts[(i + 2) % n];
      const c1x = +(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1);
      const c1y = +(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1);
      const c2x = +(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1);
      const c2y = +(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1);
      d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
    }
    return d + ' Z';
  }

  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid slice' });
  svg.style.cssText = 'width:100%;height:100%;display:block;cursor:grab;touch-action:none;';
  const defs = el('defs', {}, svg);

  // === DEFS: GRADIENTS & FILTERS ===
  const bgG = el('radialGradient', { id:'bgG', cx:'50%', cy:'55%', r:'75%' }, defs);
  [['0%','#06102a'],['65%','#020910'],['100%','#000204']].forEach(([o,c]) => el('stop',{offset:o,'stop-color':c},bgG));

  const oceanG = el('radialGradient', { id:'oceanG', cx:'40%', cy:'40%', r:'70%' }, defs);
  [['0%','#071828'],['100%','#010810']].forEach(([o,c]) => el('stop',{offset:o,'stop-color':c},oceanG));

  const atmG = el('linearGradient', { id:'atmG', x1:'0', y1:'1', x2:'0', y2:'0' }, defs);
  el('stop',{offset:'0%','stop-color':'#1a96e0','stop-opacity':'0.55'},atmG);
  el('stop',{offset:'50%','stop-color':'#0a60b0','stop-opacity':'0.12'},atmG);
  el('stop',{offset:'100%','stop-color':'#001530','stop-opacity':'0'},atmG);

  const glowF = el('filter', { id:'glow', x:'-60%', y:'-60%', width:'220%', height:'220%' }, defs);
  el('feGaussianBlur', { in:'SourceGraphic', stdDeviation:'4', result:'b' }, glowF);
  const gm = el('feMerge',{},glowF); el('feMergeNode',{in:'b'},gm); el('feMergeNode',{in:'SourceGraphic'},gm);

  // === SPACE BACKGROUND ===
  el('rect', { width:W, height:H, fill:'url(#bgG)' }, svg);

  // === STARS ===
  const rnd = n => { let x = Math.sin(n)*10000; return x-Math.floor(x); };
  for (let i = 0; i < 160; i++)
    el('circle',{cx:rnd(i*3.7+1)*W, cy:rnd(i*5.1+2)*H*0.75, r:rnd(i*2.3+3)*1.5+0.2, fill:'#fff', opacity:rnd(i*4.9+4)*0.6+0.15},svg);
  for (let i = 0; i < 80; i++)
    el('circle',{cx:rnd(i*7.3+10)*W*0.7+W*0.15, cy:rnd(i*9.7+20)*H*0.4+H*0.05, r:rnd(i*1.9+30)*0.9+0.1, fill:'#d0e8ff', opacity:rnd(i*6.1+40)*0.3+0.05},svg);

  // === EARTH SURFACE ===
  el('ellipse',{cx:W*0.47, cy:H+180, rx:1250, ry:590, fill:'url(#oceanG)'},svg);
  el('path',{d:`M 0,${H} L 0,${H*0.42} C ${W*0.25},${H*0.28} ${W*0.75},${H*0.3} ${W},${H*0.44} L ${W},${H} Z`,fill:'url(#atmG)',opacity:'0.22'},svg);
  el('path',{d:`M -20,${H*0.43} C ${W*0.25},${H*0.27} ${W*0.75},${H*0.29} ${W+20},${H*0.45}`,fill:'none',stroke:'#40b8f0','stroke-width':'2',opacity:'0.45',filter:'url(#glow)'},svg);

  // === DETAILED KOREAN PENINSULA (lat/lng → SVG) ===
  // South Korea — ~90 waypoints clockwise from DMZ west junction
  const SK = [
    // DMZ: west junction → east coast (gentle northward bow along ~38°N)
    [37.92,126.62],[37.97,126.86],[38.03,127.14],[38.09,127.44],
    [38.14,127.74],[38.21,128.03],[38.29,128.24],[38.41,128.37],[38.58,128.41],
    // East coast: Goseong → Sokcho → Yangyang → Gangneung → Donghae → Samcheok →
    //             Uljin → Yeongdeok → Pohang → Ulsan → Busan
    [38.40,128.49],[38.22,128.57],[38.08,128.63],[37.93,128.69],
    [37.77,128.92],[37.57,129.09],[37.44,129.17],[37.24,129.30],
    [36.99,129.41],[36.75,129.46],[36.52,129.49],[36.30,129.44],
    [36.03,129.37],[35.90,129.56],[35.73,129.49],[35.56,129.36],
    [35.36,129.23],[35.14,129.18],[35.05,129.02],
    // South coast: Busan → Geoje → Tongyeong → Namhae → Yeosu → Goheung → Haenam → Mokpo
    [34.90,128.79],[34.78,128.65],[34.64,128.50],[34.61,128.33],
    [34.57,128.14],[34.72,128.03],[34.63,127.88],[34.61,127.74],
    [34.75,127.73],[34.68,127.57],[34.58,127.40],[34.52,127.22],
    [34.55,127.08],[34.63,126.96],[34.58,126.82],[34.63,126.66],
    [34.59,126.54],[34.48,126.42],[34.38,126.31],[34.32,126.22],
    [34.41,126.15],[34.58,126.24],[34.70,126.33],[34.79,126.40],
    // West coast: Mokpo → Buan/Saemangeum → Gunsan → Boryeong →
    //             Taean Peninsula → Ansan → Incheon → Ganghwa → DMZ
    [34.89,126.43],[35.02,126.48],[35.19,126.52],[35.36,126.56],
    [35.52,126.53],[35.68,126.57],[35.83,126.60],[35.98,126.73],
    [36.09,126.65],[36.21,126.56],[36.34,126.52],[36.43,126.58],
    [36.53,126.62],[36.63,126.56],[36.73,126.47],[36.79,126.26],
    [36.86,126.11],[36.91,126.32],[36.97,126.49],[37.07,126.57],
    [37.22,126.63],[37.37,126.68],[37.49,126.66],[37.60,126.63],
    [37.68,126.68],[37.74,126.56],[37.79,126.44],[37.84,126.41],
    [37.88,126.53],
  ].map(([a,b])=>ll(a,b));

  // North Korea — ~40 waypoints, clockwise from DMZ west junction
  const NK = [
    // NK west coast going north
    [37.92,126.62],[37.98,126.42],[38.08,126.15],[38.23,125.88],
    [38.42,125.60],[38.60,125.34],[38.77,124.87],[38.97,124.62],
    [39.20,124.40],[39.47,124.18],[39.77,124.32],[40.08,124.40],
    // North border: Yalu River → Tumen River (border with China / Russia)
    [40.32,124.66],[40.57,124.92],[40.78,125.38],[41.02,126.70],
    [41.37,127.47],[41.65,128.20],[41.87,128.58],[42.09,129.20],
    [42.24,129.77],[42.37,130.22],[42.40,130.57],
    // East coast NK going south to DMZ
    [42.15,130.64],[41.92,129.87],[41.60,129.46],[41.22,129.53],
    [40.84,129.38],[40.46,129.28],[40.06,129.15],[39.66,128.92],
    [39.24,128.68],[38.90,128.55],[38.63,128.41],
    // DMZ east → west (matches SK DMZ in reverse)
    [38.58,128.41],[38.41,128.37],[38.29,128.24],[38.21,128.03],
    [38.14,127.74],[38.09,127.44],[38.03,127.14],[37.97,126.86],
  ].map(([a,b])=>ll(a,b));

  // Draw North Korea (dark, barely lit)
  el('path',{d:smoothPath(NK), fill:'#040c04', stroke:'rgba(30,60,30,0.2)', 'stroke-width':'0.8'},svg);

  // Draw South Korea
  el('path',{d:smoothPath(SK), fill:'#060e06'},svg);
  // Coastal sea glow
  el('path',{d:smoothPath(SK), fill:'none', stroke:'#1a5888', 'stroke-width':'1.8', opacity:'0.6'},svg);

  // DMZ dashed line
  const dmzPts = [[37.92,126.62],[38.03,127.14],[38.14,127.74],[38.29,128.24],[38.58,128.41]].map(([a,b])=>ll(a,b));
  el('path',{d:`M ${dmzPts.map(p=>p.join(',')).join(' L ')}`,fill:'none',stroke:'#3a5858','stroke-width':'0.8','stroke-dasharray':'5,3',opacity:'0.55'},svg);

  // Jeju Island
  const [jx,jy] = ll(33.49,126.53);
  el('ellipse',{cx:jx,cy:jy,rx:26,ry:14,fill:'#060c06',stroke:'#1a5888','stroke-width':'1.3','stroke-opacity':'0.55'},svg);

  // Ulleungdo Island (37.49°N 130.87°E)
  const [ulx,uly] = ll(37.49,130.87);
  el('ellipse',{cx:ulx,cy:uly,rx:8,ry:8,fill:'#060e06',stroke:'#1a5888','stroke-width':'1','stroke-opacity':'0.45'},svg);

  // Geoje, Namhae, Wando islands
  [[34.88,128.60],[34.72,128.04],[34.32,126.71]].forEach(([a,b])=>{
    const [ix,iy]=ll(a,b);
    el('ellipse',{cx:ix,cy:iy,rx:7,ry:4,fill:'#050a05',stroke:'#1a4868','stroke-width':'0.7','stroke-opacity':'0.38'},svg);
  });

  // === CITY LIGHT HALOS ===
  // [lat, lng, outerR, innerCoreR, color, opacity]
  const LIGHTS = [
    [37.57,126.97, 88,38,'#ffb050',0.44], // Seoul
    [37.46,126.70, 40,18,'#ffaa45',0.30], // Incheon
    [37.28,127.01, 26,11,'#ffaa40',0.20], // Suwon
    [35.18,129.07, 58,26,'#ffc055',0.36], // Busan
    [35.87,128.60, 38,17,'#ffb040',0.24], // Daegu
    [36.35,127.38, 30,14,'#ffaa40',0.22], // Daejeon
    [35.16,126.85, 28,13,'#ffaa40',0.20], // Gwangju
    [35.54,129.31, 26,12,'#ffb040',0.20], // Ulsan
    [35.84,129.21, 18, 8,'#ffb040',0.17], // Gyeongju
    [35.82,127.15, 20, 9,'#ffaa38',0.18], // Jeonju
    [36.57,128.73, 14, 6,'#ffa830',0.15], // Andong
    [34.76,127.66, 14, 6,'#ffa030',0.16], // Yeosu
    [33.50,126.53, 17, 7,'#ffb040',0.20], // Jeju
    [35.23,128.68, 18, 8,'#ffaa38',0.17], // Changwon
  ];

  LIGHTS.forEach(([lat,lng,r2,r1,c,op],i)=>{
    const [lx,ly]=ll(lat,lng);
    const id=`lg${i}`, id2=`lc${i}`;
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

  // === ZOOM / PAN STATE ===
  let zoom=1, panX=0, panY=0, isDrag=false, dragX=0, dragY=0;
  const detailLayer = el('g',{id:'detailLayer',opacity:'0'},svg);

  function applyView() {
    const vw=W/zoom, vh=H/zoom;
    svg.setAttribute('viewBox',`${W/2-vw/2-panX} ${H/2-vh/2-panY} ${vw} ${vh}`);
    const det = zoom>1.9 ? Math.min(1,(zoom-1.9)*1.8).toFixed(2) : '0';
    detailLayer.setAttribute('opacity', det);
    svg.style.cursor = isDrag ? 'grabbing' : (zoom>1 ? 'grab' : 'grab');
  }

  // Zoom buttons
  const zCtrl = el('g',{class:'zoom-ctrl'},svg);
  [['+',20,0.5],['−',56,-0.5],['⌂',92,null]].forEach(([lbl,dy,dz])=>{
    const bg=el('rect',{x:W-48,y:dy,width:34,height:32,rx:8,fill:'rgba(255,255,255,0.1)',stroke:'rgba(255,255,255,0.18)','stroke-width':'1'},zCtrl);
    const t=el('text',{x:W-31,y:dy+20.5,fill:'rgba(255,255,255,0.8)','font-size':lbl==='⌂'?'16':'18','text-anchor':'middle','font-family':'Inter,sans-serif'},zCtrl);
    t.textContent=lbl;
    [bg,t].forEach(e=>e.addEventListener('click',()=>{
      if(dz===null){zoom=1;panX=0;panY=0;}
      else zoom=Math.max(1,Math.min(5,zoom+dz));
      if(zoom<=1){panX=0;panY=0;}
      applyView();
    }));
    [bg,t].forEach(e=>e.style.cursor='pointer');
  });

  // Mouse wheel zoom
  mapEl.addEventListener('wheel',e=>{
    e.preventDefault();
    const rect=svg.getBoundingClientRect();
    const mx=(e.clientX-rect.left)/rect.width*W, my=(e.clientY-rect.top)/rect.height*H;
    const f=e.deltaY<0?1.14:0.88, nz=Math.max(1,Math.min(5,zoom*f));
    panX+=((mx-W/2)/zoom)*(1-zoom/nz);
    panY+=((my-H/2)/zoom)*(1-zoom/nz);
    zoom=nz; if(zoom<=1){panX=0;panY=0;}
    applyView();
  },{passive:false});

  // Drag pan
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
  window.addEventListener('mouseup',()=>{isDrag=false;svg.style.cursor='grab';});

  // Touch pinch+drag
  let lastD=0;
  mapEl.addEventListener('touchstart',e=>{
    if(e.touches.length===2) lastD=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    else if(e.touches.length===1){isDrag=true;dragX=e.touches[0].clientX;dragY=e.touches[0].clientY;}
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

  // === CITY MARKERS ===
  const CITIES_MAP = [
    {name:'Seoul',  kr:'서울',lat:37.57,lng:126.97,color:'#ff7675',r:5.5},
    {name:'Busan',  kr:'부산',lat:35.18,lng:129.07,color:'#74b9ff',r:4.5},
    {name:'Incheon',kr:'인천',lat:37.46,lng:126.70,color:'#55efc4',r:3.5},
    {name:'Gyeongju',kr:'경주',lat:35.84,lng:129.21,color:'#fdcb6e',r:3},
    {name:'Jeonju', kr:'전주',lat:35.82,lng:127.15,color:'#a29bfe',r:3},
    {name:'Jeju',   kr:'제주',lat:33.50,lng:126.53,color:'#00cec9',r:3.5},
    {name:'Andong', kr:'안동',lat:36.57,lng:128.73,color:'#fd79a8',r:3},
    {name:'Yeosu',  kr:'여수',lat:34.76,lng:127.66,color:'#81ecec',r:3},
  ];

  CITIES_MAP.forEach(city=>{
    const [cx,cy]=ll(city.lat,city.lng);
    const g=el('g',{class:'city-dot',style:'cursor:pointer'},svg);
    el('circle',{cx,cy,r:city.r*2.3,fill:'none',stroke:city.color,'stroke-width':'1.2',class:'city-pulse',opacity:'0.7'},g);
    el('circle',{cx,cy,r:city.r,fill:city.color,filter:'url(#glow)'},g);
    el('circle',{cx,cy,r:city.r*0.38,fill:'#fffaf0'},g);
    const lx=cx>800?cx-92:cx+10;
    const tip=el('g',{class:'city-tip',opacity:'0',style:'pointer-events:none'},g);
    el('rect',{x:lx,y:cy-19,width:84,height:30,rx:7,fill:'rgba(0,4,18,0.88)',stroke:city.color,'stroke-width':'0.8'},tip);
    const tn=el('text',{x:lx+8,y:cy-5,fill:'#fff','font-size':'10','font-weight':'700','font-family':'Inter,sans-serif'},tip); tn.textContent=city.name;
    const tk=el('text',{x:lx+8,y:cy+7,fill:city.color,'font-size':'9','font-family':'Inter,sans-serif'},tip); tk.textContent=city.kr;
    g.addEventListener('mouseenter',()=>tip.setAttribute('opacity','1'));
    g.addEventListener('mouseleave',()=>tip.setAttribute('opacity','0'));
    g.addEventListener('click',()=>{
      document.querySelectorAll('.city-pill').forEach(p=>p.classList.remove('active'));
      document.querySelector(`.city-pill[data-name="${city.name}"]`)?.classList.add('active');
      // Zoom to city
      const [tx,ty]=ll(city.lat,city.lng);
      zoom=2.8; panX=tx-W/2; panY=ty-H/2; applyView();
      setTimeout(()=>document.getElementById('categories-section')?.scrollIntoView({behavior:'smooth',block:'start'}),500);
    });
  });

  // === DETAIL LAYER — appears when zoomed in (zoom > 1.9) ===
  const SPOTS = [
    {name:'Gyeongbokgung',lat:37.577,lng:126.977,e:'🏯'},
    {name:'N Seoul Tower', lat:37.551,lng:126.988,e:'🗼'},
    {name:'Myeongdong',   lat:37.563,lng:126.983,e:'🛍️'},
    {name:'Hongdae',      lat:37.556,lng:126.923,e:'🎵'},
    {name:'Insadong',     lat:37.574,lng:126.985,e:'🎨'},
    {name:'Han River',    lat:37.529,lng:126.993,e:'🌊'},
    {name:'COEX',         lat:37.511,lng:127.059,e:'🏢'},
    {name:'Haeundae',     lat:35.159,lng:129.161,e:'🏖️'},
    {name:'Gamcheon',     lat:35.097,lng:129.010,e:'🎨'},
    {name:'Jagalchi',     lat:35.097,lng:129.030,e:'🦀'},
    {name:'Hallasan',     lat:33.362,lng:126.529,e:'🌋'},
    {name:'Seongsan',     lat:33.458,lng:126.942,e:'🌅'},
    {name:'Bulguksa',     lat:35.790,lng:129.332,e:'⛩️'},
    {name:'Hanok Village',lat:35.815,lng:127.153,e:'🏘️'},
    {name:'Andong Hahoe', lat:36.540,lng:128.518,e:'🎎'},
    {name:'Yeosu Expo',   lat:34.760,lng:127.664,e:'🌉'},
    {name:'DMZ Tour',     lat:37.950,lng:126.800,e:'🚧'},
    {name:'Nami Island',  lat:37.790,lng:127.524,e:'🍂'},
    {name:'Seoraksan',    lat:38.119,lng:128.465,e:'🏔️'},
  ];

  SPOTS.forEach(s=>{
    const [ax,ay]=ll(s.lat,s.lng);
    const ag=el('g',{},detailLayer);
    el('circle',{cx:ax,cy:ay,r:5,fill:'rgba(255,210,120,0.18)',stroke:'rgba(255,210,120,0.55)','stroke-width':'0.9'},ag);
    const t=el('text',{x:ax+7,y:ay+4,fill:'rgba(255,240,200,0.9)','font-size':'7.5','font-family':'Inter,sans-serif','font-weight':'600','paint-order':'stroke','stroke':'rgba(0,0,0,0.6)','stroke-width':'3'},ag);
    t.textContent=`${s.e} ${s.name}`;
  });

  // Zoom hint text (fades out after first zoom)
  const hint = el('text',{x:W-54,y:134,fill:'rgba(255,255,255,0.38)','font-size':'8.5','text-anchor':'middle','font-family':'Inter,sans-serif'},zCtrl);
  hint.textContent='scroll';
  const hint2 = el('text',{x:W-54,y:145,fill:'rgba(255,255,255,0.38)','font-size':'8.5','text-anchor':'middle','font-family':'Inter,sans-serif'},zCtrl);
  hint2.textContent='to zoom';
  mapEl.addEventListener('wheel',()=>{hint.remove();hint2.remove();},{once:true,passive:true});

  mapEl.appendChild(svg);
  mapEl.style.background = '#000204';

  // === CITY PILLS ===
  const pillsEl = document.getElementById('city-pills');
  if (pillsEl) {
    CITIES_MAP.forEach(city=>{
      const btn=document.createElement('button');
      btn.className='city-pill'; btn.dataset.name=city.name;
      btn.innerHTML=`<span class="pill-dot" style="background:${city.color}"></span>${city.name}<span class="pill-kr"> ${city.kr}</span>`;
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.city-pill').forEach(p=>p.classList.remove('active'));
        btn.classList.add('active');
        const [tx,ty]=ll(city.lat,city.lng);
        zoom=2.8; panX=tx-W/2; panY=ty-H/2; applyView();
        document.getElementById('categories-section')?.scrollIntoView({behavior:'smooth',block:'start'});
      });
      pillsEl.appendChild(btn);
    });
  }
}

/* ===== CONTENT GRID ===== */
function renderGrid(cat) {
  const grid = document.getElementById('content-grid');
  if (!grid) return;
  const items = KOREA_DATA[cat] || [];
  grid.innerHTML = items.map((item, i) => {
    const d = JSON.stringify({ name: item.name, kr: item.kr, mapQ: item.mapQ }).replace(/'/g, '&#39;');
    return `
      <div class="card" style="animation-delay:${i * 0.045}s">
        <span class="card-emoji">${item.emoji}</span>
        <div class="card-name">${item.name}</div>
        <div class="card-kr">${item.kr} &nbsp;·&nbsp; ${item.region}</div>
        <div class="card-desc">${item.desc}</div>
        <div class="card-tags">${item.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <button class="card-map-btn" data-item='${d}'>📍 View on Map &amp; Reviews</button>
      </div>`;
  }).join('');

  grid.querySelectorAll('.card-map-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      try { openMapPanel(JSON.parse(btn.dataset.item)); } catch {}
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
function openMapPanel(item) {
  const panel = document.getElementById('map-panel');
  const backdrop = document.getElementById('mp-backdrop');
  document.getElementById('mp-title').textContent = item.name;
  document.getElementById('mp-kr').textContent = item.kr;
  document.getElementById('mp-rating').innerHTML = '';
  document.getElementById('mp-reviews').innerHTML = '<div class="mp-no-reviews">Loading reviews...</div>';
  panel.classList.add('open');
  backdrop.classList.add('open');

  const gmapFrame = document.getElementById('gmap');
  const q = encodeURIComponent(item.mapQ || item.name + ' Korea');
  if (MAPS_KEY && MAPS_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
    gmapFrame.innerHTML = `<iframe src="https://www.google.com/maps/embed/v1/search?key=${MAPS_KEY}&q=${q}&zoom=14&language=en&region=KR" allowfullscreen loading="lazy"></iframe>`;
    fetchPlaceDetails(item.mapQ || item.name + ' Korea');
  } else {
    gmapFrame.innerHTML = `<div class="gmap-loading">📍 Add your Google Maps API key in index.html to enable the map preview</div>`;
    document.getElementById('mp-reviews').innerHTML = '<div class="mp-no-reviews">Add Google Maps API key to see ratings & reviews</div>';
  }

  document.getElementById('mp-directions').href = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  document.getElementById('mp-gmaps').href = `https://www.google.com/maps/search/${q}`;
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
    else document.getElementById('mp-reviews').innerHTML = '<div class="mp-no-reviews">No ratings found</div>';
  } catch {
    document.getElementById('mp-reviews').innerHTML = '<div class="mp-no-reviews">📍 Open Google Maps to see reviews</div>';
  }
}

function renderPlaceDetails(data) {
  const stars = '⭐'.repeat(Math.round(data.rating || 0));
  document.getElementById('mp-rating').innerHTML = `
    <span class="mp-stars">${stars}</span>
    <span class="mp-score">${data.rating?.toFixed(1) || '—'}</span>
    <span class="mp-count">(${(data.userRatingsTotal || 0).toLocaleString()} reviews)</span>`;

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
    reviewsEl.innerHTML = '<div class="mp-no-reviews">No reviews available yet</div>';
  }
}

function initMapPanel() {
  const close = () => {
    document.getElementById('map-panel').classList.remove('open');
    document.getElementById('mp-backdrop').classList.remove('open');
  };
  document.getElementById('mp-close')?.addEventListener('click', close);
  document.getElementById('mp-backdrop')?.addEventListener('click', close);
}

/* ===== AI CHATBOT ===== */
let chatHistory = [], isThinking = false;

function openChat() { document.getElementById('chatbot')?.classList.add('open'); }
function closeChat() { document.getElementById('chatbot')?.classList.remove('open'); }

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

async function sendMessage(text) {
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
      body: JSON.stringify({ message: text, history: chatHistory.slice(-8) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const reply = data.reply || 'Sorry, no response received. Please try again.';
    typingEl?.remove();
    addMsg('assistant', reply
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    );
    chatHistory.push({ role: 'assistant', content: reply });
  } catch (err) {
    typingEl?.remove();
    addMsg('assistant', `⚠️ AI temporarily unavailable. Please try again. (${err.message})`);
  } finally {
    isThinking = false;
  }
}

function sendQuick(text) { openChat(); setTimeout(() => sendMessage(text), 80); }

function initChat() {
  document.getElementById('chat-fab')?.addEventListener('click', openChat);
  document.getElementById('chat-close')?.addEventListener('click', closeChat);
  document.getElementById('ai-open-btn')?.addEventListener('click', openChat);
  document.getElementById('hero-ai-btn')?.addEventListener('click', openChat);
  const input = document.getElementById('chat-input');
  document.getElementById('chat-send')?.addEventListener('click', () => sendMessage(input?.value || ''));
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(input.value); });
}

/* ===== SCROLL REVEAL ===== */
function initScrollReveal() {
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

/* ===== BOOT ===== */
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initTabs();
  initMapPanel();
  renderGrid('food');
  initChat();
  initHeader();
  initScrollReveal();
});
