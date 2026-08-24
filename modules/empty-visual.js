/* KoreaPlus Guide — empty-state + image fallback photos
   Wikimedia Commons URLs verified via Commons API (Aug 2026).
   Do not hide broken images; swap to a known-good photo for the item kind. */
(function (w) {
  'use strict';
  if (w.kpEmpty && w.kpEmpty.__v >= 4) return;

  var U = {
    seoul: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg/1280px-%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg',
    busan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Gwangandaegyo_Bridge_in_Busan%2C_South_Korea_%28iau2207b%29.tiff/lossy-page1-1280px-Gwangandaegyo_Bridge_in_Busan%2C_South_Korea_%28iau2207b%29.tiff.jpg',
    jeju: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Jeju_Island.jpg/1280px-Jeju_Island.jpg',
    jeonju: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Jeonju_Hanok_Maeul_01.jpg/1280px-Jeonju_Hanok_Maeul_01.jpg',
    incheon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Songdo_Central_Park_and_Posco_Tower_Songdo.jpg/1280px-Songdo_Central_Park_and_Posco_Tower_Songdo.jpg',
    andong: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/A_bird%27s_eye_view_of_the_Hahoe_Folk_Village_%284458648859%29.jpg/1280px-A_bird%27s_eye_view_of_the_Hahoe_Folk_Village_%284458648859%29.jpg',
    suwon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Hwaseong_Fortress%2C_Suwon%2C_Gyeonggi-do%2C_Republic_of_Korea_%282%29.jpg/1280px-Hwaseong_Fortress%2C_Suwon%2C_Gyeonggi-do%2C_Republic_of_Korea_%282%29.jpg',
    temple: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Lotus_Flower_Bridge_and_Seven_Treasure_Bridge_at_Bulguksa_in_Gyeongju%2C_Korea.jpg/1280px-Lotus_Flower_Bridge_and_Seven_Treasure_Bridge_at_Bulguksa_in_Gyeongju%2C_Korea.jpg',
    night: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Busan_Firework_Festival_2008-1.jpg/1280px-Busan_Firework_Festival_2008-1.jpg',
    festival: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Mud_Fest_2008_%282679028799%29.jpg/960px-Mud_Fest_2008_%282679028799%29.jpg',
    food: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Han-jeongsik.jpg',
    lantern: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Jinju_namgang_lantern_festival.jpg/960px-Jinju_namgang_lantern_festival.jpg',
    yonggung: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/%ED%95%B4%EB%8F%99%EC%9A%A9%EA%B6%81%EC%82%AC_%EC%82%AC%EC%B0%B0_%EC%A0%84%EA%B2%BD.jpg/1280px-%ED%95%B4%EB%8F%99%EC%9A%A9%EA%B6%81%EC%82%AC_%EC%82%AC%EC%B0%B0_%EC%A0%84%EA%B2%BD.jpg'
  };

  /* Primary lookup — item slug from data.js / build-seo (stable, no fuzzy match). */
  var DISH_BY_SLUG = {
    bibimbap: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Dolsot-bibimbap.jpg/1280px-Dolsot-bibimbap.jpg',
    kimchi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Korean_Kimchi.jpg/1280px-Korean_Kimchi.jpg',
    'korean-bbq': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Korean_barbecue-Galbi-01.jpg/1280px-Korean_barbecue-Galbi-01.jpg',
    tteokbokki: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Korean.snacks-Tteokbokki-08.jpg/1280px-Korean.snacks-Tteokbokki-08.jpg',
    bulgogi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Korean.cuisine-Bulgogi-01.jpg/1280px-Korean.cuisine-Bulgogi-01.jpg',
    jjajangmyeon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Jajangmyeon_by_KFoodaddict.jpg/1280px-Jajangmyeon_by_KFoodaddict.jpg',
    'kimchi-jjigae': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Korean_cuisine-Kimchi_jjigae-01.jpg/1280px-Korean_cuisine-Kimchi_jjigae-01.jpg',
    naengmyeon: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/KOCIS_Mul-naengmyeon%2C_Chilled_Buckwheat_Noodle_Soup_%284594756202%29.jpg',
    pajeon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Pajeon.jpg/1280px-Pajeon.jpg',
    japchae: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Homemade_Japchae%2C_Dhaka_02.jpg/1280px-Homemade_Japchae%2C_Dhaka_02.jpg',
    bingsu: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Korean_shaved_ice-Patbingsu-10B.jpg',
    mandu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Korean_mandu_dumplings.jpg/1280px-Korean_mandu_dumplings.jpg',
    chimaek: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Iksan_City_48_Korean_Style_Fried_chicken.jpg/1280px-Iksan_City_48_Korean_Style_Fried_chicken.jpg',
    dakgalbi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Korean_cuisine-Dakgalbi-01.jpg/1280px-Korean_cuisine-Dakgalbi-01.jpg',
    'haemul-jeongol': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Korean_cuisine-Haemul_jeongol-02.jpg/1280px-Korean_cuisine-Haemul_jeongol-02.jpg',
    makgeolli: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Makgeolli_4.jpg/1280px-Makgeolli_4.jpg',
    samgyeopsal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Korean_barbecue-Galbi-01.jpg/1280px-Korean_barbecue-Galbi-01.jpg'
  };

  /* Legacy substring map — longest keys first so "kimchi jjigae" beats "kimchi". */
  var DISH = {
    'kimchi jjigae': DISH_BY_SLUG['kimchi-jjigae'],
    '김치찌개': DISH_BY_SLUG['kimchi-jjigae'],
    'korean bbq': DISH_BY_SLUG['korean-bbq'],
    'haemul jeongol': DISH_BY_SLUG['haemul-jeongol'],
    bibimbap: DISH_BY_SLUG.bibimbap,
    kimchi: DISH_BY_SLUG.kimchi,
    samgyeopsal: DISH_BY_SLUG.samgyeopsal,
    bulgogi: DISH_BY_SLUG.bulgogi,
    tteokbokki: DISH_BY_SLUG.tteokbokki,
    jjajangmyeon: DISH_BY_SLUG.jjajangmyeon,
    naengmyeon: DISH_BY_SLUG.naengmyeon,
    pajeon: DISH_BY_SLUG.pajeon,
    japchae: DISH_BY_SLUG.japchae,
    bingsu: DISH_BY_SLUG.bingsu,
    mandu: DISH_BY_SLUG.mandu,
    chimaek: DISH_BY_SLUG.chimaek,
    dakgalbi: DISH_BY_SLUG.dakgalbi,
    makgeolli: DISH_BY_SLUG.makgeolli,
    '비빔밥': DISH_BY_SLUG.bibimbap,
    '김치': DISH_BY_SLUG.kimchi,
    '떡볶이': DISH_BY_SLUG.tteokbokki,
    '불고기': DISH_BY_SLUG.bulgogi,
    '짜장면': DISH_BY_SLUG.jjajangmyeon,
    '냉면': DISH_BY_SLUG.naengmyeon,
    '파전': DISH_BY_SLUG.pajeon,
    '잡채': DISH_BY_SLUG.japchae,
    '빙수': DISH_BY_SLUG.bingsu,
    '만두': DISH_BY_SLUG.mandu,
    '닭갈비': DISH_BY_SLUG.dakgalbi,
    '막걸리': DISH_BY_SLUG.makgeolli
  };

  var KIND_ALIAS = {
    search: 'seoul', trip: 'jeju', places: 'jeonju', notes: 'andong',
    checklist: 'suwon', culture: 'andong', reviews: 'seoul', map: 'seoul',
    week: 'festival', default: 'seoul'
  };
  var CITY_KIND = {
    seoul: 'seoul', busan: 'busan', jeju: 'jeju', jeonju: 'jeonju', incheon: 'incheon',
    andong: 'andong', suwon: 'suwon', gyeongju: 'temple', yeosu: 'busan',
    sokcho: 'jeju', gangneung: 'jeju', damyang: 'andong', boseong: 'andong'
  };

  function slugify(name) {
    return String(name || '').toLowerCase()
      .replace(/['']/g, '').replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function url(kind) {
    var k = String(kind || 'seoul').toLowerCase();
    if (U[k]) return U[k];
    if (KIND_ALIAS[k] && U[KIND_ALIAS[k]]) return U[KIND_ALIAS[k]];
    if (CITY_KIND[k] && U[CITY_KIND[k]]) return U[CITY_KIND[k]];
    return U.seoul;
  }

  function dishPhoto(name, region) {
    var hay = String(name || '') + ' ' + String(region || '');
    var low = hay.toLowerCase();
    var keys = Object.keys(DISH).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (low.indexOf(key) !== -1 || hay.indexOf(key) !== -1) return DISH[key];
    }
    return null;
  }

  function forItem(item) {
    if (!item) return url('seoul');
    var id = item.slug || slugify(item.name);
    if (DISH_BY_SLUG[id]) return DISH_BY_SLUG[id];
    if (item.cat === 'food' || item.category === 'food') {
      var dish = dishPhoto(item.name, (item.kr || '') + ' ' + (item.region || ''));
      return dish || U.food;
    }
    return forPlace(item.name, item.region);
  }

  function forPlace(name, region) {
    var dish = dishPhoto(name, region);
    if (dish) return dish;

    var hay = String(name || '') + ' ' + String(region || '');
    var low = hay.toLowerCase();
    if (/bulguk|temple|절|사\b|yonggung|beomeosa|tongdosa|jogyesa/.test(low)) return url('temple');
    if (/night|namsan|fireworks|gwangan|bridge/.test(low)) return url('night');
    if (/festival|축제/.test(low)) return url('festival');
    if (/market|맛집|street food/.test(low)) return url('food');
    var cities = Object.keys(CITY_KIND);
    for (var i = 0; i < cities.length; i++) {
      if (low.indexOf(cities[i]) !== -1) return url(CITY_KIND[cities[i]]);
    }
    return url('seoul');
  }

  function onErr(img) {
    if (!img) return;
    var stage = parseInt(img.getAttribute('data-kp-fb') || '0', 10);
    var kind = img.getAttribute('data-kp-fb-kind') || '';
    if (stage >= 2) {
      img.onerror = null;
      img.removeAttribute('src');
      img.style.background = 'var(--bg3,#1a2433)';
      return;
    }
    img.setAttribute('data-kp-fb', String(stage + 1));
    if (stage === 0) {
      img.src = (kind === 'dish' || kind === 'food') ? U.food : U.seoul;
    } else {
      img.src = U.jeonju;
    }
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function html(kind, text, opts) {
    opts = opts || {};
    var src = url(kind);
    var cls = opts.compact ? 'kp-empty-vis kp-empty-vis--sm' : 'kp-empty-vis';
    var alt = opts.alt || '';
    return '<div class="' + cls + '" data-kind="' + esc(kind || 'seoul') + '" role="status">' +
      '<img class="kp-empty-vis-img" src="' + src + '" alt="' + esc(alt) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="window.kpEmpty&&kpEmpty.onErr(this)">' +
      (text ? '<p class="kp-empty-vis-text">' + text + '</p>' : '') +
      '</div>';
  }

  function imgTag(kind, cls, alt) {
    return '<img class="' + (cls || 'hub-card-img') + '" src="' + url(kind) + '" alt="' + esc(alt || '') +
      '" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="window.kpEmpty&&kpEmpty.onErr(this)">';
  }

  w.kpEmpty = {
    __v: 4, U: U, DISH: DISH, DISH_BY_SLUG: DISH_BY_SLUG,
    url: url, slugify: slugify, dishPhoto: dishPhoto,
    forItem: forItem, forPlace: forPlace, onErr: onErr, html: html, imgTag: imgTag
  };
  w.kpImgErr = onErr;
})(window);
