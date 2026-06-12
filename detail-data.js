/* KoreaPlus Detail Data — Full guide content for all 82 category items
   STEP 1: Food (16) + Travel (12)
   Structure: overview, bestFor, schedule, howto[], price{}, tips[], links[]
*/
window.DETAIL_DATA = window.DETAIL_DATA || {};

Object.assign(window.DETAIL_DATA, {

  /* ═══════════════════════════════════════════════════════
     FOOD — 16 items
  ═══════════════════════════════════════════════════════ */

  'Bibimbap': {
    overview: '비빔밥 is Korea\'s most iconic dish — a bowl of warm white rice topped with seasoned vegetables (나물), a fried or raw egg, and gochujang (고추장) red pepper paste. Mix everything together vigorously before eating. Jeonju in North Jeolla Province is the undisputed home of the best bibimbap, where over 30 toppings are used in a single bowl.',
    bestFor: 'First-time visitors wanting a complete taste of Korean flavours in one bowl. Vegetarian-friendly (request no meat — 고기 빼주세요).',
    schedule: 'Available all day at Korean restaurants. Jeonju Hanok Village restaurants: 09:00–21:00.',
    howto: [
      '돌솥비빔밥 (dolsot bibimbap) is the best version — served in a sizzling stone pot that creates crispy rice at the bottom.',
      'Add gochujang (red pepper paste) to taste — start with a small amount as it\'s quite spicy.',
      'Mix ALL ingredients thoroughly with your spoon before eating for the authentic experience.',
      'Scrape the crispy golden rice (누룽지) from the bottom of the stone pot — it\'s a delicacy.',
      'Pair with the complimentary doenjang (fermented soybean) soup that comes as a set.'
    ],
    price: { range: '₩8,000 – ₩18,000', note: 'Dolsot (stone pot) version is ₩2,000–3,000 more. Jeonju premium bibimbap ₩15,000–₩25,000.' },
    tips: [
      'The dolsot (stone pot) version is far superior — the crispy bottom rice is the best part.',
      'In Jeonju, visit Hanok Village restaurants for authentic 30-topping bibimbap.',
      'Bibimbap is not spicy by default — gochujang is added separately so you control the heat.',
      'Request 채식비빔밥 (vegetarian bibimbap) without meat at most restaurants.',
      'Gwangjang Market in Seoul serves excellent affordable street-stall bibimbap for under ₩8,000.',
      'The stone pot stays hot for 15+ minutes — don\'t rush, enjoy the progressively crispier rice.'
    ],
    links: [
      { label: 'Jeonju Bibimbap Festival (Oct)', url: 'https://www.jeonjubibimbap.com' },
      { label: 'Gwangjang Market Map', url: 'https://map.naver.com' }
    ]
  },

  'Kimchi': {
    overview: '김치 is Korea\'s national dish and UNESCO Intangible Cultural Heritage — fermented vegetables (most commonly naepa cabbage) with gochugaru, garlic, ginger, and fermented seafood. Over 200 varieties exist. Koreans consume an average of 18kg per person per year. It\'s served as a free banchan (side dish) at every single Korean meal.',
    bestFor: 'Everyone — it\'s unavoidable and essential to Korean dining. Vegetarians note: most kimchi contains fermented shrimp paste (새우젓).',
    schedule: 'Year-round. Kimjang (김장, winter kimchi-making) season: November–December.',
    howto: [
      'Ask for 묵은지 (aged kimchi) for the most complex, deeply sour flavour.',
      'Fresh kimchi (겉절이) is lighter and less sour — ideal for beginners.',
      'Visit Gwangju\'s Kimchi Cultural Center for hands-on kimchi-making classes.',
      'Buy premium vacuum-sealed kimchi at Emart or Homeplus for a great edible gift.',
      'Pair with 삼겹살 (grilled pork belly) — the legendary combination.'
    ],
    price: { range: 'Free as banchan / ₩5,000–₩15,000 for premium jarred kimchi', note: 'Kimchi is always complimentary as a side dish. Unlimited refills (더 주세요) are free and expected.' },
    tips: [
      'Never throw away your kimchi banchan — asking for a refill is completely normal.',
      'Baechu kimchi (배추김치) is standard; kkakdugi (깍두기, radish) is milder for beginners.',
      'Kimchi jjim (찜) — braised aged kimchi with pork — is one of the most flavourful preparations.',
      'White kimchi (백김치) has no gochugaru — perfect for those who can\'t handle spice.',
      'Airport duty-free sells vacuum-packed kimchi approved for most countries as a souvenir.',
      'The Kimchi Museum in Insadong has 80+ varieties on display — free entry.'
    ],
    links: [
      { label: 'National Kimchi Museum (Insadong)', url: 'https://www.kimchimuseum.co.kr' },
      { label: 'Gwangju Kimchi Festival (Oct)', url: 'https://www.kimchifestival.kr' }
    ]
  },

  'Korean BBQ': {
    overview: '고기구이 (Korean BBQ) is a communal dining ritual where meat — typically 삼겹살 (pork belly), 목살 (pork neck), or 소갈비 (beef short ribs) — is grilled directly at the table. The experience is as much about the social occasion as the food: wrapping meat in lettuce with garlic, ssamjang paste, and kimchi, then eating it in one big bite.',
    bestFor: 'Groups of 2+. Evening dining. Pairs perfectly with soju or beer.',
    schedule: 'Most restaurants 11:00–23:00; entertainment districts until 02:00. Lunch sets (런치 세트) are cheaper.',
    howto: [
      'Order 삼겹살 (pork belly) and 목살 (neck) — the most popular combo.',
      'The server usually grills for you initially; after the first batch, grill yourself.',
      'Assemble ssam (쌈): lettuce leaf + rice + meat + garlic + ssamjang paste + kimchi. Fold and eat whole.',
      'Order 된장찌개 or 냉면 at the end — the traditional way to finish.',
      'Request 불판 교체 (grill change) after a few rounds for a cleaner, better-tasting grill.'
    ],
    price: { range: '₩13,000 – ₩25,000 per portion (200–250g)', note: 'Unlimited banchan always included. Budget ₩25,000–₩45,000 per person with drinks.' },
    tips: [
      'Charcoal BBQ (숯불구이) is worth the premium — the flavour is noticeably better than gas.',
      'Mapo-gu "BBQ Street" in Seoul is considered the best area for 삼겹살.',
      'Look for overhead ventilation hoods above each table — essential for smoke-free dining.',
      'Unlimited banchan refills are free — never hesitate to ask.',
      '고기집 in residential neighbourhoods are more authentic and cheaper than tourist-area restaurants.'
    ],
    links: [
      { label: 'Mapo BBQ Street on Naver Map', url: 'https://map.naver.com' }
    ]
  },

  'Tteokbokki': {
    overview: '떡볶이 is the king of Korean street food — cylindrical rice cakes simmered in a fiery-sweet gochujang sauce with fish cakes and hard-boiled eggs. It\'s been a beloved snack since the 1950s and has evolved into an entire cuisine ecosystem. Modern versions include cheese, rose sauce, carbonara, and seafood variations.',
    bestFor: 'Street food snacking, late-night cravings, cold weather eating. Gwangjang Market and Sindang-dong Tteokbokki Town are pilgrimage sites.',
    schedule: 'Street stalls: 10:00 to midnight. Sindang-dong Tteokbokki Town until 03:00.',
    howto: [
      'Start at a 포장마차 (pojangmacha) street stall — the original experience.',
      'Add 오뎅 (fish cake skewers) and 순대 (blood sausage) for the classic three-piece combo.',
      'Request 덜 맵게 해주세요 (less spicy please) if sensitive to heat.',
      'Add 라면 사리 (ramen noodles added in) towards the end for a filling variation.',
      'Visit Sindang-dong (신당동) Tteokbokki Town for the original gung-jung royal court style.'
    ],
    price: { range: '₩3,000 – ₩7,000 (street stall) / ₩12,000–₩25,000 (restaurant)', note: 'Combination sets with sundae (순대) and twigim (fried items) are great value.' },
    tips: [
      'Gwangjang Market has the most authentic pojangmacha experience — go in the evening.',
      'Mild (순한맛) versions always exist — ask if you\'re spice-sensitive.',
      'Cheese tteokbokki adds a creamy layer that cuts the heat — great for beginners.',
      '궁중떡볶이 (royal court style) uses soy sauce instead of gochujang — milder and savoury.',
      'CU and GS25 convenience stores sell decent instant tteokbokki for under ₩2,000.'
    ],
    links: [
      { label: 'Sindang-dong Tteokbokki Town', url: 'https://map.naver.com' },
      { label: 'Gwangjang Market (광장시장)', url: 'https://map.naver.com' }
    ]
  },

  'Bulgogi': {
    overview: '불고기 means "fire meat" — thinly sliced beef marinated in soy sauce, Asian pear, garlic, sesame oil, and green onion, then grilled. It\'s one of the most internationally recognised Korean dishes. Unlike raw BBQ meats, bulgogi is pre-marinated and approachable for newcomers. Asian pear acts as a natural meat tenderiser for an exceptionally soft texture.',
    bestFor: 'Families, first-time Korean food eaters, those who prefer sweeter flavours. Also excellent cold as a lunch box item.',
    schedule: 'Available lunch and dinner at almost all Korean restaurants. Premium versions at 한우 (Korean beef) restaurants.',
    howto: [
      'Order at any Korean restaurant — it\'s a universal dish.',
      'Try 불고기 전골 (bulgogi hot pot) for a sharing version with tofu and vegetables.',
      'Wrap in lettuce with rice and doenjang paste for the classic ssam experience.',
      'Ask for 버섯불고기 (mushroom bulgogi) — the vegetarian version is equally delicious.',
      'At BBQ restaurants, bulgogi is grilled on a domed pan — the caramelised edges are the best part.'
    ],
    price: { range: '₩12,000 – ₩20,000 (standard) / ₩35,000–₩80,000+ (Hanwoo premium)', note: 'Hanwoo (Korean beef) is among the world\'s finest — try it at least once despite the price.' },
    tips: [
      'Pear juice is the secret of good bulgogi marinade — natural enzymes tenderise the beef.',
      'Hanwoo (한우) Korean beef is exceptional quality — worth the splurge.',
      'Bulgogi kimbap (불고기 김밥) from convenience stores is a great cheap meal under ₩2,500.',
      'Gwangjang Market\'s raw beef yukhoe (육회) is bulgogi\'s close relative — extremely fresh.',
      'Freeze-dried bulgogi at Korean duty-free shops is an excellent souvenir for cooking at home.'
    ],
    links: [
      { label: 'Hanwoo Beef Grade Guide', url: 'https://www.mafra.go.kr' }
    ]
  },

  'Jjajangmyeon': {
    overview: '짜장면 — noodles smothered in thick black bean sauce with diced pork and vegetables — is Korea\'s most-ordered delivery food, consumed over 8 million times daily. A fusion of Chinese black bean paste and Korean taste, it was brought to Korea by Chinese immigrants in Incheon in the early 1900s. April 14th is officially "Black Day" — single Koreans eat jjajangmyeon to commiserate.',
    bestFor: 'Casual lunches, delivery nights, comfort food. Incheon Chinatown is the historic birthplace.',
    schedule: 'Delivery 24 hours via Baemin app. Restaurants 11:00–22:00.',
    howto: [
      'Order from any Chinese-Korean restaurant (중국집) — it\'s a staple.',
      'Try the combination set with 짬뽕 (spicy seafood soup) — Korea\'s classic pairing.',
      'Mix the black sauce thoroughly with the noodles before eating.',
      'Visit Incheon Chinatown for the most authentic version and its full history.',
      'Use Baemin (배민) or Coupang Eats app for delivery in 20–30 minutes.'
    ],
    price: { range: '₩7,000 – ₩12,000', note: 'Delivery minimum order ₩12,000–₩15,000. Jjapaghetti instant noodle version ₩1,200 at convenience stores.' },
    tips: [
      'The instant Jjapaghetti (짜파게티) became globally famous after the film Parasite.',
      'Order 간짜장 (dry version with less sauce) for a more concentrated flavour.',
      'Always served with 단무지 (yellow pickled radish) and raw onion — free condiments.',
      'Incheon\'s original Gonghwachun restaurant has been open since 1905.',
      'Ask for extra sauce (소스 더 주세요) on delivery — standard portions can be light.'
    ],
    links: [
      { label: 'Incheon Chinatown Map', url: 'https://map.naver.com' },
      { label: 'Baemin Delivery App', url: 'https://www.baemin.com' }
    ]
  },

  'Kimchi Jjigae': {
    overview: '김치찌개 is the definitive Korean comfort food — a hearty spicy stew of aged kimchi, pork belly or tuna, tofu, and green onions simmered in anchovy broth. Specifically requires well-aged (묵은지) kimchi for depth of flavour. Served bubbling in an earthenware pot alongside rice. Often the cheapest full meal you\'ll find in Korea.',
    bestFor: 'Cold weather, hangover recovery, deep umami comfort food cravings. Budget travellers — outstanding value.',
    schedule: 'Available all day. Best at lunch at 김치찌개 specialty restaurants.',
    howto: [
      'Order 묵은지 김치찌개 (aged kimchi stew) — the difference vs regular is night and day.',
      'Wait 2–3 minutes after arrival — the earthenware pot retains heat and will burn initially.',
      'Mix rice into the pot broth as you eat — Koreans call this 밥 말아먹기.',
      'Try 참치 김치찌개 (tuna kimchi stew) — the classic canned tuna version.',
      'Order 공깃밥 (extra rice, ₩1,000) — the ratio of stew to rice is crucial.'
    ],
    price: { range: '₩7,000 – ₩13,000', note: 'Includes unlimited rice and banchan. One of the best value meals in Korea.' },
    tips: [
      'The best kimchi jjigae uses kimchi fermented for at least 6 months — ask if it\'s 묵은지.',
      'Pork version (돼지고기) has richer flavour; tuna version (참치) is lighter and equally popular.',
      'Adding a raw egg into the bubbling stew makes it richer — ask for an egg (계란 넣어주세요).',
      'Small 백반 restaurants run by 이모님 (aunties) usually make the best version.',
      'The stew improves as you eat — the flavour intensifies as it reduces in the hot pot.'
    ],
    links: [
      { label: 'Naver Map — 김치찌개 맛집', url: 'https://map.naver.com' }
    ]
  },

  'Naengmyeon': {
    overview: '냉면 means "cold noodles" — chewy buckwheat noodles in an icy beef or radish kimchi broth, topped with sliced beef, cucumber, and Korean pear. Originally from North Korea. Pyongyang style (평양냉면) has a clean, subtle broth; Hamhung style (함흥냉면) is served with spicy gochujang sauce. Nothing beats it on a hot Korean summer day.',
    bestFor: 'Summer heat relief, after a heavy BBQ meal. Pyongyang-style for subtle flavour lovers; Hamhung-style for spice fans.',
    schedule: 'Year-round but peak season June–August. Best at lunch or after BBQ dinner.',
    howto: [
      'Choose between 물냉면 (in cold broth) or 비빔냉면 (with spicy sauce).',
      'Cut the noodles with scissors before eating — they\'re served very long intentionally.',
      'Add vinegar (식초) and mustard (겨자) to taste — provided on the table.',
      'Drink the broth last — it\'s often the most refreshing part.',
      'Order 수육 (boiled pork belly) as a side — the classic Pyongyang naengmyeon pairing.'
    ],
    price: { range: '₩10,000 – ₩18,000', note: 'Premium Pyongyang-style restaurants charge ₩15,000–₩22,000. Quality reflects in the broth depth.' },
    tips: [
      'Broth quality varies dramatically — Pyongyang style should be icy, clear, and subtly beefy.',
      'Ojangdong Hamhung Naengmyeon Street in Sindang is the best cluster of shops.',
      'Most restaurants serve 반냉면 (half portion) for those who just finished BBQ.',
      'Woo Lae Oak (우래옥) in Euljiro is a legendary 60-year-old institution.',
      'Refill cold broth free (육수 더 주세요) — always ask on a hot day.'
    ],
    links: [
      { label: 'Woo Lae Oak (우래옥) — Since 1946', url: 'https://map.naver.com' }
    ]
  },

  'Pajeon': {
    overview: '파전 is a thick crispy Korean savoury pancake made with green onions, wheat flour, egg, and often seafood — squid, shrimp, oysters. The outside is golden and crunchy; the inside soft and full of flavour. Traditionally eaten on rainy days (the sizzling sound resembles rain on a tin roof) and the perfect companion to 막걸리 (milky rice wine).',
    bestFor: 'Rainy days, casual drinking snacks, sharing starters. Best at Insadong and Jeonju.',
    schedule: 'All day at Korean restaurants and markets. Peak demand on rainy days.',
    howto: [
      'For the best version, visit a dedicated pancake restaurant (전집).',
      'Dip in soy-vinegar sauce (간장 + 식초 + chilli) — provided on the table, never skip it.',
      'Try 동래파전 (Dongnae-style from Busan) for the premium seafood experience.',
      'Order alongside makgeolli (막걸리) — Korea\'s quintessential pairing.',
      'Ask for extra crispy (바삭하게) when ordering.'
    ],
    price: { range: '₩8,000 – ₩18,000', note: 'Seafood version (해물파전) costs more. Size ranges small (소) to large (대).' },
    tips: [
      'Gwangjang Market\'s bindaetteok (mung bean pancake) stalls are equally excellent.',
      'The secret to crispy pajeon is very high heat and a well-oiled pan.',
      'Rainy days genuinely drive a rush at pajeon restaurants — "비 오는 날 파전" is a real phenomenon.',
      'Kimchi jeon (김치전) — spicy kimchi pancake — is a great alternative variation.',
      'Haemul pajeon with whole oysters is a Busan specialty worth seeking out.'
    ],
    links: [
      { label: 'Gwangjang Market', url: 'https://map.naver.com' }
    ]
  },

  'Japchae': {
    overview: '잡채 is a festive Korean glass noodle dish — dangmyeon (sweet potato starch noodles) stir-fried with colourful julienned vegetables, beef, and seasoned with soy sauce, sesame oil, and sugar. A staple at all Korean celebrations, birthdays, and ancestral rites. The glass noodles have a uniquely chewy, slightly slippery texture that makes it irresistible.',
    bestFor: 'Special occasions, vegetarian adaptation (omit beef), healthy-conscious diners. A crowd-pleaser for all ages.',
    schedule: 'Available at traditional Korean restaurants and as banchan in set-meal (한정식) restaurants.',
    howto: [
      'Order as a main dish (잡채 단품) or as part of a traditional Korean set meal.',
      'Try 잡채밥 — japchae served over rice at casual Korean restaurants.',
      'Add extra sesame seeds when eating — enhances the aroma.',
      'At traditional markets, look for freshly made japchae stalls — the difference is remarkable.',
      'Cold japchae from the refrigerator the next day is equally delicious.'
    ],
    price: { range: '₩10,000 – ₩18,000 (main) / Free as banchan in set meals', note: 'Premium 한정식 (Korean table d\'hôte) includes japchae as a standard side dish.' },
    tips: [
      'Vegetarian japchae (채식 잡채) replaces beef with more mushrooms — equally satisfying.',
      'Gwangjang Market and Namdaemun Market sell freshly made japchae by the portion — excellent value.',
      'The secret to good japchae is separately cooking each vegetable — lazy versions taste flat.',
      'Dried dangmyeon (당면) is available at Korean supermarkets worldwide for cooking at home.',
      'Try 당면사리 (glass noodles) in hotpot dishes — the noodles absorb incredible flavour.'
    ],
    links: [
      { label: 'Namdaemun Market', url: 'https://map.naver.com' }
    ]
  },

  'Bingsu': {
    overview: '빙수 is Korea\'s iconic shaved ice dessert — finely shaved milk ice (snow-like, not chunky) topped with sweetened red beans, rice cake pieces, condensed milk, and various toppings from mango to matcha. Modern 빙수 from premium cafés has evolved into architectural works of art. Nothing beats a 팥빙수 (red bean bingsu) on a hot Seoul summer afternoon.',
    bestFor: 'Summer heat relief (June–August). Instagram photographers, sweet tooth cravings.',
    schedule: 'Most cafés year-round but peak season June–August. Bingsu specialist cafés in Insadong, Myeongdong, and Hongdae.',
    howto: [
      'Order 팥빙수 (red bean bingsu) for the classic — all other versions descend from this original.',
      'Mix toppings into the ice as you eat rather than eating layer by layer.',
      'Premium milk-ice bingsu (우유빙수) is very different from regular ice — seek out specialist cafés.',
      'Injeolmi bingsu (인절미빙수) — toasted soybean powder rice cake — is the most uniquely Korean.',
      'Share with a friend — even the "small" size at premium cafés is enormous.'
    ],
    price: { range: '₩8,000 – ₩28,000', note: 'Luxury patisserie bingsu can reach ₩28,000+. Street stall versions from ₩5,000. Convenience store cups ₩2,000–₩4,000.' },
    tips: [
      'Sulbing (설빙) is the most widespread bingsu chain — consistent quality nationwide.',
      'Cafe Bora in Insadong makes famous matcha bingsu in a beautiful traditional setting.',
      'Look for cafés advertising 우유얼음 (milk ice) rather than just crushed ice — the texture is incomparable.',
      'Mango bingsu using Jeju mangoes is exceptional in peak summer (July–August).',
      'Traditional places use less sugar in the 팥 — this is better, more complex flavour.'
    ],
    links: [
      { label: 'Sulbing (설빙) Locations', url: 'https://www.sulbing.com' },
      { label: 'Cafe Bora — Insadong', url: 'https://map.naver.com' }
    ]
  },

  'Mandu': {
    overview: '만두 are Korean dumplings — wheat dough wrappers stuffed with a mixture of pork, kimchi, tofu, glass noodles, and vegetables. They can be steamed (찐만두), fried (군만두), boiled in soup (만둣국), or pan-fried. Korea\'s dumpling culture evolved its own distinct flavour profile, especially kimchi mandu which is not found outside Korea.',
    bestFor: 'Quick street snacks, cold winter days (만둣국 soup), casual group dining. Gwangjang Market and Insadong street stalls are ideal.',
    schedule: '24 hours at convenience stores. Restaurant hours 10:00–22:00. Gwangjang Market mandu stalls: 09:00–22:00.',
    howto: [
      'Order 찜만두 (steamed) and 군만두 (fried) together to compare textures.',
      'Dip in soy-vinegar-ginger sauce — provided on the side, never eat without it.',
      'Try 왕만두 (king mandu) — extra large dumplings at Gwangjang Market for ₩3,000 each.',
      'Order 만둣국 (dumpling soup) at a 분식집 for a complete warm meal under ₩7,000.',
      'At Myeongdong street stalls, eat with a skewer and dip in sweet chilli sauce.'
    ],
    price: { range: '₩3,000 – ₩12,000', note: 'Street stall 5-piece fried mandu ₩3,000. Gwangjang Market individual mandu from ₩1,000.' },
    tips: [
      'Gwangjang Market\'s handmade 할머니 (grandmother) mandu stalls are legendary.',
      'Frozen mandu from Harim or CJ brand from supermarkets is excellent for cooking at home.',
      'Kimchi mandu (김치만두) has the most distinctly Korean flavour.',
      'Manduguk (만둣국) on Lunar New Year is a cultural tradition — symbolic of the new year.',
      'Steamed mandu goes stale within 30 minutes — always eat fresh and hot.'
    ],
    links: [
      { label: 'Gwangjang Market (광장시장)', url: 'https://map.naver.com' }
    ]
  },

  'Chimaek': {
    overview: '치맥 — 치킨 (fried chicken) + 맥주 (beer) — is one of Korea\'s greatest cultural exports, now a worldwide phenomenon after featuring in the drama "My Love from the Star." Korean fried chicken achieves an impossibly thin, ultra-crispy double-fried coating that stays crunchy for hours. The variety is staggering: original, seasoned, garlic, honey butter, soy garlic, cheese, and dozens more.',
    bestFor: 'Evening eating, watching sports, after-drinking sessions. Half of all Korean fried chicken is ordered via delivery app.',
    schedule: 'Most restaurants 15:00–midnight or later. Delivery from ~16:00 via Baemin or Coupang Eats.',
    howto: [
      'Order 반반 (half and half) — half original (후라이드) and half seasoned (양념) in one box.',
      'Download Baemin app for delivery — most menus have English options.',
      'Order 치킨 + 맥주 + 깍두기 (chicken + beer + radish cubes) — the inseparable trio.',
      'Ask for 무 (white pickled radish cubes) if not provided — it cuts through the fried richness.',
      'Visit Daehakno or Hongdae chicken alleys for the full street eating atmosphere.'
    ],
    price: { range: '₩18,000 – ₩26,000 (whole chicken)', note: 'Half chicken (반 마리) ₩12,000–₩15,000. Premium flavours add ₩2,000–₩4,000.' },
    tips: [
      'Double-frying is the secret — fried once, rested, then fried again for ultra-crispiness.',
      'Kyochon soy garlic chicken (교촌 간장치킨) is a Korean cultural icon — essential to try.',
      'Delivery arrives crispy for 15–20 minutes after arrival in insulated bags.',
      'Dakgangjeong (닭강정) — sweet-spicy bite-sized fried chicken — is a street market specialty.',
      'Convenience store chicken (편의점 치킨) from GS25 is surprisingly good and very affordable.'
    ],
    links: [
      { label: 'Baemin Delivery App (배달의민족)', url: 'https://www.baemin.com' },
      { label: 'Kyochon Chicken (교촌치킨)', url: 'https://www.kyochon.com' }
    ]
  },

  'Dakgalbi': {
    overview: '닭갈비 is spicy stir-fried chicken from Chuncheon — chicken, tteok (rice cakes), cabbage, sweet potato, and green onion wok-fried in gochujang sauce on a large skillet at the table. Chuncheon\'s signature dish since the 1960s. A visit to Chuncheon without eating dakgalbi is considered culturally incomplete.',
    bestFor: 'Spice lovers, groups, day trips from Seoul to Chuncheon. Nami Island + dakgalbi is the classic combo.',
    schedule: 'Chuncheon Dakgalbi Street restaurants: 11:00–22:00. Seoul dakgalbi restaurants from 11:00.',
    howto: [
      'Travel to Chuncheon (1.5 hours from Seoul on ITX-Cheongchun train) for the authentic experience.',
      'Order 치즈닭갈비 (cheese dakgalbi) — mozzarella over the spicy chicken is transformative.',
      'Towards the end, add rice and make 볶음밥 (fried rice) in the leftover sauce.',
      'Pair with 막국수 (cold buckwheat noodles) — Chuncheon\'s second famous dish.',
      'Sit outside on Dakgalbi Street (닭갈비 골목) for the full atmospheric experience.'
    ],
    price: { range: '₩13,000 – ₩18,000 per person', note: 'Minimum order usually 2 portions. Cheese add-on ₩3,000–₩5,000. Fried rice (볶음밥) ₩1,000–₩2,000.' },
    tips: [
      'Chuncheon\'s Dakgalbi Street is 300m long with over 80 back-to-back restaurants.',
      'Always make 볶음밥 at the end — the caramelised sauce bits mixed with rice is the best part.',
      'The ITX-Cheongchun train from Seoul Cheongnyangni reaches Chuncheon in 85 minutes.',
      'Combine with Nami Island (남이섬) for a perfect Chuncheon day trip.',
      'Spring onion variety (파닭갈비) adds extra depth — available at most restaurants.'
    ],
    links: [
      { label: 'Chuncheon Dakgalbi Street Map', url: 'https://map.naver.com' },
      { label: 'ITX-Cheongchun Train Booking', url: 'https://www.korail.com' }
    ]
  },

  'Haemul Jeongol': {
    overview: '해물전골 is a spicy seafood hot pot — a wide shallow pot bubbling with intense gochugaru broth loaded with whole crabs, shrimp, clams, squid, mussels, and abalone, plus mushrooms, tofu, and glass noodles. One of Korea\'s most celebratory group dishes. The broth becomes increasingly flavourful as the seafood releases its juices.',
    bestFor: 'Groups of 3+. Coastal areas (Busan, Incheon, Sokcho) for the freshest seafood. Cold weather.',
    schedule: 'Seafood restaurants: 11:00–22:00. Noryangjin Market in Seoul open early morning for the freshest seafood.',
    howto: [
      'Visit Noryangjin Fish Market (노량진 수산시장) — buy live seafood on ground floor, have it cooked upstairs.',
      'Or visit Jagalchi Market (자갈치시장) in Busan for the freshest ingredients.',
      'Let the restaurant cook the first round; add vegetables and tofu yourself afterwards.',
      'Spoon the bright red broth over rice — the broth is as good as the seafood.',
      'Add 라면 사리 (ramen noodles) at the end for a finishing course.'
    ],
    price: { range: '₩35,000 – ₩80,000 (per pot, serves 2–3)', note: 'Noryangjin buy-and-cook option is more affordable. Lobster/abalone additions increase price significantly.' },
    tips: [
      'Noryangjin Market rooftop restaurants let you bring your own seafood — you pay only a cooking fee (조리비).',
      'The crabs release the most flavour — break them open and suck the shells clean.',
      'Avoid ordering during weekday lunch — seafood is best when turnover is high.',
      'Ask for 추가 국물 (extra broth) when it reduces — the restaurant will top up for free.',
      'Sokcho\'s Jungang Market raw seafood offers exceptional quality at half Seoul prices.'
    ],
    links: [
      { label: 'Noryangjin Fish Market (노량진)', url: 'https://map.naver.com' },
      { label: 'Jagalchi Market, Busan', url: 'https://map.naver.com' }
    ]
  },

  'Makgeolli': {
    overview: '막걸리 is Korea\'s oldest alcoholic drink — an unfiltered, slightly carbonated milky white rice wine at 6–8% alcohol. Made by fermenting rice with nuruk (fermentation starter), it\'s slightly sweet, tangy, and subtly fizzy. It\'s been drunk for over 2,000 years and has undergone a modern renaissance with craft makgeolli from artisan breweries.',
    bestFor: 'Casual drinking, pairing with pajeon (Korean pancakes). Excellent with street food. Insadong and Jongno makgeolli bars.',
    schedule: 'Makgeolli bars typically 17:00–midnight. Convenience stores 24 hours.',
    howto: [
      'Shake or stir before pouring — the rice settles at the bottom.',
      'Serve in traditional shallow bowls (막걸리 사발) for the full experience.',
      'Standard pairing: pajeon (파전) — order both together.',
      'Visit Insadong\'s traditional makgeolli bars for an atmospheric setting with music.',
      'Try craft makgeolli (수제 막걸리) — flavour variations include strawberry, honey, green tea.'
    ],
    price: { range: '₩3,000 – ₩5,000 (750ml at convenience store) / ₩8,000–₩15,000 at bars', note: 'Premium artisan makgeolli at specialty bars ₩25,000/bottle. Craft varieties are well worth the premium.' },
    tips: [
      'Always shake or stir before serving — the sediment is where all the flavour lives.',
      'Carbonation makes it feel lighter than it is — it packs more punch than it seems.',
      'Dongdongju (동동주) is the floating-rice version — thicker and stronger than regular.',
      'Waryong Makgeolli alley in Jongno is the most atmospheric place to drink it.',
      'Makgeolli paired with bindaetteok (빈대떡) at Gwangjang Market is a perfect budget combination.'
    ],
    links: [
      { label: 'Insadong Makgeolli Bars', url: 'https://map.naver.com' },
      { label: 'Waryong Makgeolli Street', url: 'https://map.naver.com' }
    ]
  },

  /* ═══════════════════════════════════════════════════════
     TRAVEL — 12 items
  ═══════════════════════════════════════════════════════ */

  'Seoul': {
    overview: 'Seoul (서울) is South Korea\'s capital and one of Asia\'s most dynamic megacities — 10 million in the city, 25 million in the metro area. It seamlessly blends 600-year-old Joseon palaces with glass skyscrapers, traditional markets with 24-hour concept stores, and Buddhist temples with K-pop studios. Seoul is simultaneously one of the world\'s safest, cleanest, most wired, and most food-obsessed cities.',
    bestFor: 'First-time Korea visitors, culture seekers, food lovers, K-pop fans, shoppers. Best in spring (cherry blossoms) or autumn (foliage).',
    schedule: 'City never closes. Major attractions: 09:00–18:00. Palace night tours: selected evenings. Nightlife: 22:00–06:00.',
    howto: [
      'Arrive at Incheon Airport and take the AREX Express Train (43 min, ₩9,500) to Seoul Station.',
      'Get a T-money card (티머니) at any GS25 or CU convenience store — works on all public transport.',
      'Day 1: Gyeongbokgung Palace + Bukchon + Insadong (historic north Seoul).',
      'Day 2: Myeongdong shopping + Namsan Tower + Han River evening walk.',
      'Day 3: Hongdae art district + Mangwon Market (youth culture west Seoul).',
      'Day 4: Gangnam + COEX + Bongeunsa Temple (modern south Seoul).'
    ],
    price: { range: 'Budget: ₩60,000/day · Mid: ₩120,000/day · Luxury: ₩300,000+/day', note: 'Seoul is exceptional value vs comparable global capitals. Street food, transport, and accommodation are all affordable.' },
    tips: [
      'Download Naver Maps — it has vastly superior public transit directions in Korea vs Google Maps.',
      'Kakao T (카카오 택시) is the safest and most reliable taxi app — all drivers are registered.',
      'The 한복 (hanbok) rental near palaces costs ₩15,000–₩30,000 and includes free palace entry.',
      'Convenience stores (CU, GS25, 7-Eleven) sell excellent cheap food 24 hours — a Seoul institution.',
      'Seoul has 400+ 찜질방 (jjimjilbang saunas) — some double as budget overnight accommodation.',
      'Inwangsan Mountain sunrise hike (40 min from Gyeongbokgung) offers the best city panorama.'
    ],
    links: [
      { label: 'Seoul Tourism Organization', url: 'https://english.visitseoul.net' },
      { label: 'Seoul Metro App', url: 'https://www.seoulmetro.co.kr' },
      { label: 'AREX Express Train', url: 'https://www.arex.or.kr' }
    ]
  },

  'Busan': {
    overview: '부산 is South Korea\'s second city — a port city of 3.5 million where mountains plunge into the sea, traditional fishing villages cling to hillsides, and beaches draw millions every summer. Busan has a rougher, saltier energy than Seoul: louder accents, spicier food, fiercer local pride, and an unmistakable maritime soul. Home of the Busan International Film Festival (BIFF) and Korea\'s best raw fish markets.',
    bestFor: 'Beach lovers, seafood enthusiasts, hikers, K-drama fans. Best late spring and early autumn to avoid monsoon heat.',
    schedule: 'Haeundae Beach peaks July–August. Gamcheon Village best 09:00–12:00. Jagalchi Market freshest weekday mornings.',
    howto: [
      'Travel from Seoul via KTX bullet train (2hr 20min, from ₩59,800) — most comfortable option.',
      'Busan metro connects directly from Busan Station to Haeundae (40min), Seomyeon (15min), Nampo (10min).',
      'Day 1: Gamcheon Culture Village morning + Jagalchi Fish Market lunch + BIFF Square evening.',
      'Day 2: Haeundae Beach + Haedong Yonggungsa Temple (sea cliff temple) at sunrise.',
      'Day 3: Gwangalli Beach + Gwangandaegyo Bridge night views + Millak raw fish centre.'
    ],
    price: { range: 'Budget: ₩55,000/day · Mid: ₩100,000/day · Luxury: ₩250,000+/day', note: 'Seafood in Busan is 20–30% cheaper than Seoul. Summer resort hotels in Haeundae are expensive.' },
    tips: [
      'Milmyeon (밀면, Busan wheat noodles) and 돼지국밥 (pork broth soup) are unique to Busan.',
      'Gamcheon Culture Village: visit Tuesday–Friday before 11:00 — weekends are extremely crowded.',
      'Jagalchi Market ground floor has live seafood stalls; upper floors cook it for you.',
      'Gwangandaegyo Bridge lights up at 21:00 daily — Gwangalli Beach is the perfect viewing spot.',
      'Ferry from Busan to Tsushima Island Japan takes 1.5 hours — popular day trip.'
    ],
    links: [
      { label: 'Visit Busan', url: 'https://www.visitbusan.net' },
      { label: 'KTX Booking (Korail)', url: 'https://www.letskorail.com' },
      { label: 'BIFF Festival', url: 'https://www.biff.kr' }
    ]
  },

  'Jeju Island': {
    overview: '제주도 is South Korea\'s largest island — a volcanic island with extraordinary natural landscapes. It\'s a triple UNESCO designation: World Natural Heritage (Hallasan, lava tubes, Seongsan Ilchulbong), Biosphere Reserve, and Global Geopark. Black lava coasts, tangerine orchards, and the legendary 해녀 (haenyeo) female divers make Jeju unlike anywhere else in Korea.',
    bestFor: 'Nature lovers, couples, honeymooners, hikers, divers. Cherry blossoms bloom earliest here (late March). Excellent year-round.',
    schedule: 'Hallasan summit: depart by 09:00. Seongsan Ilchulbong sunrise: arrive 05:30–06:00. Haenyeo diving shows: 11:00 and 14:00.',
    howto: [
      'Fly from Seoul Gimpo to Jeju (1 hour, ₩50,000–₩100,000) — world\'s busiest air route.',
      'Rent a car — Jeju public transport is insufficient. International licence required.',
      'Day 1: Seongsan Ilchulbong sunrise + haenyeo show + Udo Island ferry.',
      'Day 2: Hallasan National Park summit hike (Seongpanak trail, 9.6km, 5–6 hours).',
      'Day 3: Manjanggul Lava Tube + Hyeopjae Beach + Olle Trail coastal walk.'
    ],
    price: { range: 'Budget: ₩80,000/day · Mid: ₩150,000/day · Luxury: ₩350,000+/day', note: 'Car rental ₩40,000–₩80,000/day. Most natural sites free or under ₩5,000 entry.' },
    tips: [
      'Jeju Olle Trail (올레길) has 26 coastal routes — walk one section for a memorable day.',
      'Hallasan summit trail (성판악) requires early arrival — extremely popular on weekends.',
      'Black pork (흑돼지) BBQ is Jeju\'s signature food from its native black pig breed.',
      'Hallabong tangerines and green tea from Seogwipo are the best food souvenirs.',
      'Jeju dialect is largely unintelligible to mainland Koreans — a fascinating cultural anomaly.'
    ],
    links: [
      { label: 'Visit Jeju', url: 'https://www.visitjeju.net' },
      { label: 'Jeju Olle Trail (올레길)', url: 'https://www.jejuolle.org' },
      { label: 'Hallasan National Park', url: 'https://hallasan.jeju.kr' }
    ]
  },

  'Gyeongju': {
    overview: '경주 is Korea\'s open-air museum — ancient capital of the Silla Kingdom (57 BC – 935 AD) for nearly 1,000 years. Burial mounds dot the city like green hills, UNESCO temples sit in mountain forests, and the city holds more National Treasures than anywhere else in Korea. It\'s called "the museum without walls."',
    bestFor: 'History enthusiasts, cycling tourists, photography lovers. Spring cherry blossoms at Bomun Lake and autumn foliage are spectacular.',
    schedule: 'Bulguksa Temple: 07:00–17:30. Seokguram Grotto: 07:00–18:00. Tumuli Park: 09:00–22:00 (lit at night). Anapji Pond: 09:00–22:00.',
    howto: [
      'Travel from Seoul via KTX to Singyeongju Station (2hr) or Gyeongju Station (2hr 30min).',
      'Rent a bicycle — Gyeongju is Korea\'s best cycling city with paths connecting all major sites.',
      'Day 1: Bulguksa Temple (morning) + Seokguram Grotto + Gyeongju National Museum.',
      'Day 2: Tumuli Park (enter Cheonmachong burial mound) + Cheomseongdae + Anapji Pond at sunset.',
      'Day 3: Yangdong Folk Village (UNESCO) + Bomun Lake cycling.'
    ],
    price: { range: '₩5,000–₩10,000 combined ticket (Bulguksa + Seokguram)', note: 'Most outdoor sites (tumuli, cheomseongdae) are free. Guided cycling tours from ₩25,000.' },
    tips: [
      'Visit Anapji Pond at night — the illuminated pavilion reflections are among Korea\'s most beautiful sights.',
      'Cheonmachong (천마총) is the only Silla royal tomb you can enter — extraordinary interior.',
      'Gyeongju is famous for 황남빵 (hwangnam-ppang) — traditional red bean pastries since 1939.',
      'Bomun Resort Lake is 8km from the city and worth visiting for the spring blossom path.',
      'Download the Gyeongju Tourist Bike app for GPS-guided cycling routes.'
    ],
    links: [
      { label: 'Bulguksa Temple', url: 'https://www.bulguksa.or.kr' },
      { label: 'Gyeongju Tourism', url: 'https://www.gyeongju.go.kr/tour' }
    ]
  },

  'Jeonju Hanok Village': {
    overview: '전주 한옥마을 is Korea\'s most intact traditional village — 735 traditional 한옥 tile-roofed houses in the Pungnam-dong district. Unlike Seoul\'s Bukchon, it\'s a living community with restaurants, guesthouses, and craft shops in traditional buildings. It\'s also Korea\'s food capital — UNESCO Creative City of Gastronomy.',
    bestFor: 'Culture and food lovers, couples, hanbok tourists. Perfect for overnight hanok homestays. Best spring and autumn.',
    schedule: 'Gyeonggijeon Shrine: 09:00–19:00 (Jun–Aug), 09:00–18:00 (other months). Hanbok rental: 09:00–18:00.',
    howto: [
      'Travel from Seoul via KTX to Jeonju Station (1hr 50min, ₩38,600).',
      'Rent a hanbok (한복) at the village entrance for ₩15,000–₩25,000.',
      'Visit Gyeonggijeon Shrine (경기전) — home to the portrait of Joseon\'s founding king.',
      'Eat a full bibimbap meal at a traditional restaurant inside the village.',
      'Book a hanok guesthouse (한옥 민박) to stay overnight — sleep on ondol floor heating.'
    ],
    price: { range: 'Entry: Free. Hanbok rental: ₩15,000–₩25,000. Hanok overnight: ₩60,000–₩150,000.', note: 'Village bibimbap ₩12,000–₩20,000. Much more affordable than Seoul equivalents.' },
    tips: [
      'Jeonju\'s bibimbap uses more toppings and stronger gochujang — genuinely different from standard versions.',
      'Makgeolli in Jeonju is exceptional — local breweries serve fresh unfiltered versions for ₩5,000/litre.',
      'Visit Tuesday–Thursday — weekends are extremely crowded especially in spring and autumn.',
      'Omokdae Pavilion (오목대) on the hill above offers the best panoramic view of the hanok rooftops.',
      'Jeonju\'s Nambu Market Friday-Saturday 야시장 (night market) has outstanding street food.'
    ],
    links: [
      { label: 'Jeonju Tourism', url: 'https://tour.jeonju.go.kr' },
      { label: 'KTX Jeonju Booking', url: 'https://www.letskorail.com' }
    ]
  },

  'Seoraksan': {
    overview: '설악산 National Park is Korea\'s most dramatic mountain landscape — jagged granite peaks, cascading waterfalls, ancient temples, and wildly colourful seasonal displays. At 1,708m, Daecheongbong Peak is the third highest in Korea. In early October, the entire mountain ignites in red, orange, and gold — arguably the most spectacular natural sight in the country.',
    bestFor: 'Hikers, nature photographers, autumn foliage chasers. Best seasons: late September to mid-October (autumn) and May–June (spring azaleas).',
    schedule: 'Park open year-round. Cable car: 09:00–17:00 (Oct–Mar), 09:00–18:00 (Apr–Sep). Summit trails close in heavy snowfall.',
    howto: [
      'Travel from Seoul to Sokcho by express bus (3 hours, ₩15,600). Seoraksan is 15km from Sokcho.',
      'Take the Seoraksan cable car (케이블카) for panoramic views without hiking — ₩12,000 round trip.',
      'Hiking routes: Biryong Falls (2 hours, easy) → Gyejoam (5 hours, moderate) → Daecheongbong summit (10+ hours, expert).',
      'Visit Sinheungsa Temple at entrance — free and beautiful with a giant bronze Buddha.',
      'Combine with a night in Sokcho for fresh seafood and Sokcho grilled fish.'
    ],
    price: { range: 'Park entry: ₩3,500 (adult) · Cable car: ₩12,000 (round trip)', note: 'Sokcho accommodation ₩50,000–₩120,000/night. Budget camping available within the park.' },
    tips: [
      'October 1–15 is peak autumn foliage — accommodation books up months in advance.',
      'Cable car queues can be 2 hours on autumn weekends — arrive at 09:00 opening.',
      'Ulsanbawi Rock (울산바위) trail is 4km, 2.5 hours return — the best value hike.',
      'Sokcho\'s Abai Village serves unique Hamgyong Province (North Korean refugee) food.',
      'Pack rain gear regardless — Gangwon Province is known for sudden weather changes.'
    ],
    links: [
      { label: 'Seoraksan National Park', url: 'https://seorak.knps.or.kr' },
      { label: 'Sokcho Express Bus Terminal', url: 'https://map.naver.com' }
    ]
  },

  'Incheon': {
    overview: '인천 is where most international visitors first arrive — home to consistently top-ranked Incheon International Airport. Beyond the airport: Korea\'s only official Chinatown (dating from 1883), Songdo International Business District (a futuristic eco-smart city on reclaimed land), historic Ganghwa Island with UNESCO dolmen fields, and beautiful west-coast beaches.',
    bestFor: 'First-night arrivals, day trips from Seoul, Chinese food lovers, history buffs (Ganghwa Island).',
    schedule: 'Chinatown restaurants: 10:00–21:00. Songdo Central Park: 24 hours. Ganghwa Island temples: 08:00–18:00.',
    howto: [
      'Take AREX Express Train from airport to Seoul (43 min, ₩9,500) or All Stop (56 min, ₩4,150).',
      'For Incheon city, take subway from airport to Incheon Station (Line 1, ~60 min from airport).',
      'Incheon Chinatown: jjajangmyeon, 공갈빵 baked hollow bread, and seafood pancake.',
      'Songdo Central Park boat tour: 10:00–20:00, ₩3,000 per person.',
      'Ganghwa Island: 1.5 hours from Incheon via bus — UNESCO dolmen fields and Goryeo temples.'
    ],
    price: { range: 'Budget: ₩50,000/day · Mid: ₩90,000/day', note: 'Airport transit hotel from ₩80,000 for 4 hours. Chinatown meals ₩10,000–₩20,000.' },
    tips: [
      'Incheon Airport has a free transit hotel (Zone C, airside) for passengers with long layovers.',
      'Airport B1 transit zone has an indoor ice rink, spa, cinema, and casino — all without going through customs.',
      'Incheon Chinatown\'s Gonghwachun restaurant has been open since 1905 — the original jjajangmyeon.',
      'Ganghwa Island\'s 40 UNESCO Dolmen fields are extraordinary and rarely crowded.',
      'Eunyuldo and Muuido islands off Incheon\'s coast offer clean beaches by ferry (40–60 min).'
    ],
    links: [
      { label: 'Incheon Airport', url: 'https://www.airport.kr' },
      { label: 'Visit Incheon', url: 'https://www.visitincheon.org' },
      { label: 'AREX Train (공항철도)', url: 'https://www.arex.or.kr' }
    ]
  },

  'Nami Island': {
    overview: '남이섬 is a half-moon shaped island in the North Han River, 63km northeast of Seoul — famous for its meticulously maintained tree-lined avenues that turn spectacular in every season. Made globally famous by the 2002 K-drama "Winter Sonata," it welcomes over 3 million visitors per year from 180+ countries.',
    bestFor: 'Couples, K-drama fans, photographers, families. Beautiful in all seasons: cherry blossoms (April), summer canopy, golden autumn (October–November), snow (January–February).',
    schedule: 'Island: 07:30–21:30 daily. Ferry: 07:30–21:00 every 30 minutes.',
    howto: [
      'Take ITX-Cheongchun train from Seoul Cheongnyangni to Gapyeong Station (1hr 10min, ₩5,100).',
      'From Gapyeong Station, taxi or shuttle bus (8 min) to the Nami Island ferry terminal.',
      'Buy ferry ticket (₩12,000 round trip, includes island entry) at the terminal.',
      'Explore on foot (circumference ~5km) or rent a bicycle (₩5,000/hour).',
      'Combine with Petite France (쁘띠프랑스) and Garden of Morning Calm for a full day trip.'
    ],
    price: { range: 'Island entry + ferry: ₩12,000 per person', note: 'Plus transport from Seoul. Bike rental ₩5,000/hour. Food on island is pricier than mainland.' },
    tips: [
      'Weekends in autumn are extremely crowded — visit Tuesday–Thursday in October.',
      'The metasequoia tree avenue (메타세쿼이아 길) is the most photographed spot — arrive early.',
      'Winter snow scenes are magical — late January is quieter and the island transforms completely.',
      'Nami Island issues "entry visas" — a fun quirk for your passport stamp collection.',
      'The zipline from mainland to island (₩35,000) is an exhilarating alternative arrival.'
    ],
    links: [
      { label: 'Nami Island (나미나라)', url: 'https://www.namisum.com' },
      { label: 'Garden of Morning Calm (아침고요)', url: 'https://www.morningcalm.co.kr' }
    ]
  },

  'DMZ Tour': {
    overview: '비무장지대 (DMZ) is a 4km-wide, 248km-long buffer zone separating North and South Korea since the 1953 armistice — the world\'s most heavily fortified border. Day tours from Seoul provide access to Dorasan Station (the southernmost train station built for future inter-Korean trains), the Joint Security Area (JSA) at Panmunjom, and the 3rd Infiltration Tunnel.',
    bestFor: 'History enthusiasts, Cold War buffs. Ages 13+. Absolutely unique experience anywhere in the world.',
    schedule: 'Tours depart Seoul 07:30–08:30, return 18:00–19:00. JSA requires advance booking. Children under 10 not admitted to JSA.',
    howto: [
      'Book a DMZ tour through a licensed operator — independent access is not permitted.',
      'Major operators: USO Tours, Koryo Tours, Viator, GetYourGuide.',
      'Bring your original passport — required at all security checkpoints.',
      'JSA (Joint Security Area) at Panmunjom requires separate booking and a UN briefing declaration.',
      'Imjingak Peace Park is accessible without a tour and includes the Bridge of Freedom and rusted war trains.'
    ],
    price: { range: '₩40,000 – ₩130,000 per person depending on tour type', note: 'JSA tours most expensive (₩100,000–₩130,000) but the most historically significant.' },
    tips: [
      'Bring your original passport — photocopies not accepted. No entry without it.',
      'Follow your guide\'s photography instructions exactly at JSA — rules are strict.',
      'The 3rd Infiltration Tunnel is 73m underground and requires stooping — wear comfortable clothing.',
      'Book JSA tours weeks in advance — they sell out, especially on weekends.',
      'Dorasan Station is an extraordinarily poignant site — a fully functioning station built for trains that never come.'
    ],
    links: [
      { label: 'USO Korea DMZ Tours', url: 'https://www.uso.org/programs/uso-korea-dmz-tours' },
      { label: 'Koryo Tours DMZ', url: 'https://koryogroup.com' }
    ]
  },

  'Hongdae': {
    overview: '홍대 (Hongik University District) is Seoul\'s youth and creative epicentre — a dense street network of indie music venues, art galleries, vintage shops, murals, and 24-hour cafés. Named after the art university that seeded the area\'s creative culture in the 1990s, it\'s now Korea\'s most intense nightlife and street busking zone, drawing tens of thousands every weekend.',
    bestFor: 'Young travellers, K-pop fans, indie music lovers, night owls. Best on Saturday evenings.',
    schedule: 'Area active 10:00–06:00. Busking peak: Saturday 18:00–22:00. Night clubs: 22:00–06:00.',
    howto: [
      'Take Line 2 subway to Hongik Univ. Station (홍대입구역, Exit 9).',
      'The busking square is 5 minutes from Exit 9 — Saturday night performances start ~18:00.',
      'Explore Pirate Streets (해적도) behind the main road for independent boutiques.',
      'Eat at 포장마차 (food tents) for tteokbokki, sundae, and grilled skewers.',
      'Visit the flea market at Hongik Children\'s Park on weekends (12:00–18:00).'
    ],
    price: { range: 'Club entry: ₩10,000–₩30,000 · Street food: ₩3,000–₩7,000', note: 'Free to explore. Most coffee shops ₩4,000–₩7,000. Some clubs include one drink in entry price.' },
    tips: [
      'Saturday night busking is extraordinary — professional-level performers compete for the best spots.',
      'K-pop dance covers happen spontaneously near Exit 1 — check Instagram for schedules.',
      'Sangsu-dong (상수동) and Mangwon (망원동) nearby are quieter local alternatives.',
      'Hongdae has Korea\'s highest concentration of live music venues — check Bandwagon Korea for shows.',
      '곱창 (intestine BBQ) and 닭볶음탕 spots open until 4am — the late-night binge culture is real.'
    ],
    links: [
      { label: 'Visit Seoul — Hongdae Guide', url: 'https://english.visitseoul.net' },
      { label: 'Bandwagon Korea (Live Music)', url: 'https://www.bandwagon.asia/kr' }
    ]
  },

  'Andong Hahoe Village': {
    overview: '안동 하회마을 is a UNESCO World Heritage living village where members of the Ryu clan have resided for 600 years without interruption in the bend (하회) of the Nakdong River. With 127 original buildings intact and real families still living there, it\'s the most authentic traditional village in Korea. Also home of Korea\'s oldest mask-dance drama (탈춤, UNESCO Intangible Heritage).',
    bestFor: 'History and culture enthusiasts, traditional architecture admirers. Best in autumn foliage (October) and winter snow.',
    schedule: 'Village: 09:00–18:00 (Mar–Oct), 09:00–17:00 (Nov–Feb). Mask dance: weekends 14:00 and 15:00.',
    howto: [
      'Travel from Seoul to Andong via KTX (2hr, ₩29,200) or bus from Dong Seoul Terminal (3hr 30min).',
      'From Andong city, take bus 46 to Hahoe Village (30 min, ₩1,500).',
      'Allow 2–3 hours for a full exploration after buying entry (₩5,000).',
      'Attend the Hahoe 별신굿 탈놀이 (Mask Dance Drama) at 14:00 on weekends.',
      'Climb Buyongdae Cliff across the river by rental boat for the aerial view of the village.'
    ],
    price: { range: 'Entry: ₩5,000 (adult) · Mask dance: free with entry', note: 'Boat to Buyongdae: ₩4,000. Nearby 안동찜닭 (braised chicken) from ₩12,000 per person.' },
    tips: [
      'Buyongdae Cliff opposite the village offers the best panoramic view — rent a boat (₩4,000).',
      'Andong Mask Festival (late September/early October) is one of Korea\'s most spectacular cultural events.',
      'Stay in a traditional guesthouse (고택 민박) inside the village — sleeping in a 600-year-old house is extraordinary.',
      '안동 찜닭 was invented in Andong — best at local restaurants near the village entrance.',
      'Dosan Seowon Confucian Academy (30 min from Andong) founded by scholar Yi Hwang is essential for history lovers.'
    ],
    links: [
      { label: 'Hahoe Village UNESCO Page', url: 'https://whc.unesco.org/en/list/1324' },
      { label: 'Andong Mask Festival', url: 'https://www.maskdance.com' }
    ]
  },

  'Yeosu': {
    overview: '여수 is a coastal city on Korea\'s southern tip, thrust into global consciousness by the 2012 World Expo and the K-pop hit "여수 밤바다" (Yeosu Nightsea) by Busker Busker which turned its waterfront into a romantic pilgrimage. It sits at the entrance of Hallyeo Maritime National Park — an archipelago of 320 islands with emerald waters.',
    bestFor: 'Couples (romance destination since Busker Busker\'s song), seafood lovers, island-hopping. Best May–June and September–October.',
    schedule: 'Expo Ocean Park: 10:00–21:00. Odongdo Island: 09:00–18:00. Cable car: 09:30–22:00 (summer). Night Market: 18:00–23:00 (Fri–Sun).',
    howto: [
      'Travel from Seoul via KTX to Yeosu Expo Station (3hr 20min, ₩47,900).',
      'From the station, walk to the 2012 Expo waterfront — adjacent to the station.',
      'Take the Yeosu Cable Car (케이블카) for panoramic views over the harbour.',
      'Walk across to Odongdo Island (오동도) — famous for camellia flowers and lighthouse.',
      'For seafood, visit the Soho waterfront — fresh 조개구이 (grilled clams) stalls line the coast.'
    ],
    price: { range: 'Cable car: ₩15,000 (round trip) · Odongdo entry: Free', note: 'Waterfront seafood ~₩25,000–₩50,000 per person. Night market snacks ₩3,000–₩8,000.' },
    tips: [
      'The cable car at sunset is one of Korea\'s most romantic experiences.',
      '"여수 밤바다" by Busker Busker plays from speakers near the waterfront at night — embrace it.',
      'Dolsan Bridge pedestrian walkway at 21:00 offers spectacular night views.',
      'Manseongni Black Beach (만성리) has Korea\'s only black volcanic sand beach — photogenic.',
      'Island-hopping ferries to Geomundo depart from Yeosu Ferry Terminal.'
    ],
    links: [
      { label: 'Yeosu City Tourism', url: 'https://www.yeosu.go.kr/tour' },
      { label: 'KTX Yeosu Booking', url: 'https://www.letskorail.com' }
    ]
  },


  /* ═══════════════════════════════════════════════════════
     TRANSPORT — 10 items
  ═══════════════════════════════════════════════════════ */

  'KTX Bullet Train': {
    overview: 'KTX (Korea Train eXpress) is Korea\'s high-speed rail, linking Seoul to Busan in just 2 hours 20 minutes at up to 300 km/h. Seats are spacious and spotless, and punctuality is among the best in the world. The network connects every major Korean city, making city-center-to-city-center travel faster than flying.',
    bestFor: 'Anyone travelling between major Korean cities. Faster than flying when accounting for airport check-in. Ideal for Busan, Daejeon, Daegu, Gyeongju, Jeonju day trips from Seoul.',
    schedule: 'Seoul Station to Busan: first departure ~05:30, last ~23:00. Trains depart every 20–30 minutes at peak times. Punctuality rate: 98%+.',
    howto: [
      'Book tickets at Korail website (letskorail.com), the KorailTalk app, or at any station ticket window.',
      'Foreign visitors can use the KTX with a Visit Korea Rail Pass (KORAIL PASS) for unlimited travel.',
      'Arrive at the platform at least 5 minutes before departure — KTX doors close 1 minute prior.',
      'Window seats on the right side (Seoul→Busan) offer views of rural Korean countryside.',
      'First-class (특실) is worth the ~30% premium on longer routes — significantly more space and comfort.'
    ],
    price: { range: '₩28,600 – ₩59,800 (Seoul–Busan, 일반실 standard)', note: 'Special class (특실) approximately 30% more. Early-bird discounts of 15–30% available 1 month ahead. KORAIL PASS from ~₩79,000 (3-day).' },
    tips: [
      'Book 1 month in advance for the cheapest early-bird tickets (특가, up to 30% off).',
      'The KorailTalk app is essential — available in English and allows easy booking and real-time updates.',
      'Convenience store kimbap and drinks on the train platform are far cheaper than on-board sales.',
      'KTX-Ieum (이음) is the newer generation train serving smaller cities — similar speed, modern interiors.',
      'SR (SRT) trains from Suseo station in Gangnam are slightly cheaper for southern routes.',
      'Priority seats (우선석) near the front are wider — great for tall passengers.',
      'Luggage storage at Seoul Station (B1 level) available for ₩3,000–₩7,000 per bag per day.'
    ],
    links: [
      { label: 'Korail Official Booking (letskorail.com)', url: 'https://www.letskorail.com' },
      { label: 'SRT Train Booking (srt.co.kr)', url: 'https://www.srt.co.kr' },
      { label: 'KorailTalk App', url: 'https://map.naver.com' }
    ]
  },

  'Seoul Metro': {
    overview: 'The Seoul Metro is one of the largest subway systems in the world, with 23 lines and 700+ stations. Expect 99.9% on-time operation, full air-conditioning, free WiFi and English announcements throughout. It reaches virtually every sight in Seoul, with trains every 2–3 minutes at rush hour.',
    bestFor: 'All visitors to Seoul — it is the primary and most reliable way to navigate the city. English-friendly throughout.',
    schedule: 'Weekdays: ~05:30–01:00 (Line 1: 05:17). Weekend/holiday: slightly later starts. Last train times vary by line and direction.',
    howto: [
      'Buy a T-money card (티머니) at any GS25, CU, or 7-Eleven for ₩3,000 deposit — charge with any amount.',
      'Tap card on entry and exit turnstiles — fares are distance-based, starting at ₩1,400.',
      'Download Naver Maps or KakaoMap for real-time subway navigation with transfer instructions.',
      'Follow colour-coded lines: Line 1 (Dark Blue), 2 (Green), 3 (Orange), 4 (Sky Blue), 5–9 and more.',
      'Stand to the right on escalators, walk on the left — this is enforced etiquette.'
    ],
    price: { range: 'Base fare: ₩1,400 (T-money) / ₩1,500 (single-use token)', note: 'T-money saves ₩100 per trip vs single-use. Monthly passes for commuters save up to 20%. Seniors (65+) ride free.' },
    tips: [
      'T-money card works on Seoul Metro, all city buses, intercity buses, and most taxis nationwide.',
      'Avoid Line 2 (the busiest) during 08:00–09:30 and 18:00–19:30 — dangerously crowded.',
      'Line 9 (급행, express) skips stations between Gayang and Sinnonhyeon — use for fast Gimpo Airport connections.',
      'AREX (공항철도) to Incheon Airport departs from Seoul Station every 30–40 minutes.',
      'Pink "Women-only" carriages (여성전용칸) are at the front of each train — respected during rush hours.',
      'Most stations have free lockers in B1/B2 — useful for day trips from Seoul.',
      'WiFi is available throughout the entire network (T-WiFi zone) — completely free.'
    ],
    links: [
      { label: 'Seoul Metro Official (seoulmetro.co.kr)', url: 'https://www.seoulmetro.co.kr' },
      { label: 'Naver Maps Navigation', url: 'https://map.naver.com' },
      { label: 'Seoul Metro English Map PDF', url: 'https://www.seoulmetro.co.kr/en' }
    ]
  },

  'T-money Card': {
    overview: 'T-money (티머니) is Korea\'s rechargeable transit card — one card covers the Seoul subway, city and express buses, taxis and even convenience-store payments. It\'s the first thing to buy on arrival: rides cost ₩100 less than single tickets and free transfers (up to 5) are included.',
    bestFor: 'All visitors to Korea — absolutely essential from day one. Saves time, money, and eliminates the need to carry exact change.',
    schedule: 'Available for purchase and top-up 24 hours at all GS25, CU, 7-Eleven, and Ministop convenience stores.',
    howto: [
      'Buy at any GS25 or CU convenience store for ₩3,000 deposit (returnable at some locations).',
      'Load with any amount (minimum ₩1,000) — reload at convenience store cash registers or station kiosks.',
      'Tap on entry and exit for subways; tap once for buses.',
      'Transfer between subway and bus within 30 minutes for free (or discounted) connections.',
      'Refund unused balance at T-money service counters at major subway stations (small fee applies).'
    ],
    price: { range: 'Card: ₩3,000 (deposit) · Reload: Any amount from ₩1,000', note: 'Balance refund: ₩3,000 or less refunded at convenience stores; more at bank T-money counters. 10% discount on fares vs single-use tickets.' },
    tips: [
      'Kakao Pay, Samsung Pay, and Apple Pay can link T-money function — but physical card is more reliable.',
      'T-money works on intercity express buses (고속버스) at most terminals — very convenient.',
      'Check remaining balance at bus card readers or station turnstiles before boarding.',
      'Special edition T-money cards (characters, designs) are sold at major stations — popular souvenirs.',
      'You can use the same T-money card for KTX if you load enough — but keep a separate amount for transport.',
      'NFC-enabled smartphones can use Mobile T-money — download T-money app and register your card.',
      'If card balance runs low mid-journey, you can still exit but must pay the deficit next time you tap in.'
    ],
    links: [
      { label: 'T-money Official (tmoney.co.kr)', url: 'https://www.tmoney.co.kr' },
      { label: 'T-money Balance Check / Refund Info', url: 'https://www.tmoney.co.kr' }
    ]
  },

  'Incheon Airport': {
    overview: 'Incheon International Airport has been ranked among the world\'s best airports for over a decade. Open 24/7, it packs an ice rink, spas, a casino, traditional culture performances, capsule hotels and nap rooms into one complex. On long layovers you can even join a free transit tour or explore Incheon city.',
    bestFor: 'All international arrivals and departures. Free transit tours for layovers of 5–24 hours. Overnight transit hotel for long layovers.',
    schedule: 'Airport operates 24 hours. AREX Express Train: 05:20–23:40. All-Stop Train: 05:23–24:00. Airport Limousine buses: 05:30–24:00.',
    howto: [
      'Exit arrivals hall and immediately purchase a T-money card at GS25 (next to exit).',
      'For Seoul: take AREX Express Train (₩9,500, 43 min to Seoul Station) or All-Stop (₩4,150, 56 min).',
      'City Airport Terminal (서울역 도심공항터미널) at Seoul Station allows check-in and baggage drop the night before.',
      'Long layover (5–24 hours)? Register for free ICN Transit Tour — bus tours to Incheon city included.',
      'Free luggage storage at Arrivals Level 1 (₩3,000–₩6,000 per bag for up to 24 hours).'
    ],
    price: { range: 'AREX Express to Seoul: ₩9,500 · All-Stop: ₩4,150 · Taxi to Seoul: ₩70,000–₩90,000', note: 'Limousine buses to major Seoul areas: ₩10,000–₩17,000. Uber/Kakao T available from designated pickup zones.' },
    tips: [
      'Incheon Airport has been ranked #1 globally by ACI and Skytrax for cleanliness, efficiency, and facilities.',
      'Terminal 1 and Terminal 2 are connected by free shuttle bus (every 5 minutes) — check your terminal carefully.',
      'The Asiana and Korean Air lounges in T2 are exceptional — worth Priority Pass or premium card access.',
      'Free showers available in Transit Sleeping Rooms on the 4th floor of both terminals (charge for room only).',
      'Duty-free shops: T2 has a larger and better-stocked duty-free than T1, especially for K-beauty.',
      'Korean food in the Arrivals Level food court (pre-customs) is genuinely good and airport-priced only.',
      'SIM cards and portable WiFi egg rental available from all major carriers in Arrivals Level 1 (SK, KT, LG).'
    ],
    links: [
      { label: 'Incheon Airport Official', url: 'https://www.airport.kr' },
      { label: 'AREX Airport Express Train', url: 'https://www.arex.or.kr' },
      { label: 'ICN Free Transit Tour', url: 'https://www.airport.kr/co/en/svc/transitTourInfo.do' }
    ]
  },

  'Express Bus': {
    overview: 'Express buses are the most economical way to travel long distances, linking Seoul with every corner of the country. They cover the smaller cities KTX skips, and premium (udeung) seats are often more comfortable than standard KTX. Seoul\'s main hubs are the Gangnam Express Bus Terminal and Dong Seoul Terminal.',
    bestFor: 'Budget travellers, routes not covered by KTX, night buses (야간버스) to distant cities. Connects 100+ cities nationwide.',
    schedule: 'Terminals open ~05:30–23:30. Night buses (야간버스) depart 23:00–01:00 on popular routes. Buses depart every 15–30 min on major routes.',
    howto: [
      'Seoul\'s main terminal is 고속버스터미널 (Express Bus Terminal, Line 3/7/9) in Gangnam.',
      'Dong-Seoul Terminal (동서울터미널, Gangbyeon Station Line 2) covers east and northern routes.',
      'Buy tickets at the terminal counter, online at kobus.co.kr, or via T-money app.',
      'Seat reservation is recommended on weekends and holidays — buses sell out to Busan and Jeju ferry ports.',
      'Store luggage under the bus (free) and enjoy the surprisingly comfortable seats on 우등 (premium) class.'
    ],
    price: { range: '₩10,000 – ₩35,000 depending on distance and class', note: 'Seoul–Busan 일반 (standard): ₩27,400 · 우등 (premium): ₩35,800. Significantly cheaper than KTX.' },
    tips: [
      '우등버스 (premium bus) has 3 seats per row instead of 4 — wider, more recline, worth the price difference.',
      'Night buses (야간버스) to major cities let you save a night of accommodation — very popular in summer.',
      'Intercity buses stop at highway rest areas (휴게소) every 1.5–2 hours — excellent Korean snack food available.',
      'Real-time bus tracking via the Kobus app — find your bus and platform number before you arrive.',
      'Book ahead on major holidays (Chuseok, Lunar New Year) — seats sell out weeks in advance.',
      'The bus network reaches small mountain and coastal towns that KTX cannot — essential for off-the-beaten-path travel.',
      'Dongyang Express and Kumho Buslines are the most reliable operators for national coverage.'
    ],
    links: [
      { label: 'Kobus Express Bus Booking (kobus.co.kr)', url: 'https://www.kobus.co.kr/web/eng' },
      { label: 'Dong-Seoul Terminal Map', url: 'https://map.naver.com' },
      { label: 'Gangnam Express Bus Terminal', url: 'https://map.naver.com' }
    ]
  },

  'Kakao T Taxi': {
    overview: 'Kakao T is Korea\'s go-to taxi app, used by most drivers nationwide. With an English interface, upfront fare estimates, GPS tracking and automatic card payment, it\'s the safest and easiest way for foreign travelers to ride. Options range from standard taxis to premium Black and large van taxis.',
    bestFor: 'Late nights when subway has closed, heavy luggage, groups of 3–4, areas with poor transit coverage, convenience-first travellers.',
    schedule: 'Available 24 hours. Surge pricing applies 23:00–04:00 and during rain, rush hours, and major events.',
    howto: [
      'Download Kakao T app (카카오 T) from App Store or Google Play — English interface available.',
      'Register with your phone number (international numbers accepted) and add a payment card.',
      'Select your pickup location (GPS auto-detects) and destination — fare estimated before you confirm.',
      'The driver sees your route and confirms — average wait time 2–5 minutes in urban areas.',
      'Pay via the app (credit card) or cash to the driver after arrival — both methods work.'
    ],
    price: { range: 'Base fare: ₩4,800 (first 1.6km) + ₩100 per 131m', note: 'Night surcharge (+20%) applies 23:00–04:00. KakaoBlack premium taxi starts at ₩8,000. A Seoul airport taxi costs ~₩75,000–₩90,000.' },
    tips: [
      'The \'taxi\' button has multiple options: 일반 (regular), 블랙 (premium), 모범 (deluxe), 대형 (large van).',
      'Enable the "send to driver" message feature in English — the driver sees your destination in Korean automatically.',
      'Screenshot your Kakao T receipt — it shows GPS route and is useful for expense reports.',
      'During heavy rain, wait times increase dramatically — order in advance if possible.',
      'Naver Map has a taxi-hailing button built in — alternative if Kakao T is busy.',
      'Regular taxis are uniformly metered — all drivers are registered and scams are essentially non-existent.',
      'International Taxi (바) designation means the driver speaks English — look for the green English sticker.'
    ],
    links: [
      { label: 'Kakao T App (카카오 T)', url: 'https://www.kakaomobility.com' }
    ]
  },

  'Ferry to Jeju': {
    overview: 'Large car ferries sail to Jeju from mainland ports including Mokpo, Wando, Busan and Incheon. They\'re far cheaper than flying, let you bring a vehicle, and overnight sailings save travel time. The most popular routes are Mokpo–Jeju (4.5 hours) and Busan–Jeju (12 hours, overnight).',
    bestFor: 'Budget travellers, those bringing a vehicle, those who enjoy sea voyages, travellers connecting from southern cities like Busan or Mokpo.',
    schedule: 'Mokpo–Jeju: 4.5 hours (multiple daily departures). Busan–Jeju: 11–13 hours (overnight). Incheon–Jeju: 13–14 hours (overnight, seasonal).',
    howto: [
      'Book tickets at jeudoam.co.kr or directly with ferry companies: Seahero, Korea Marine Express.',
      'Arrive at the terminal 40–60 minutes before departure for boarding procedures.',
      'Choose from: basic seat (일반석), premium seat (우등석), cabin with beds (침대 객실).',
      'Overnight Busan–Jeju: depart ~19:00, arrive ~07:00 — saves one night of accommodation.',
      'Take the Mokpo KTX from Seoul (2hr 30min) then immediately board the Jeju ferry for the cheapest Seoul–Jeju option.'
    ],
    price: { range: 'Mokpo–Jeju: ₩28,000–₩70,000 (seat to cabin) · Busan–Jeju: ₩35,000–₩90,000', note: 'Car transport to Jeju via ferry: ₩120,000–₩180,000 additional. Significantly cheaper than flying.' },
    tips: [
      'Check the weather forecast — ferries cancel in rough weather (Jeju Strait is notorious for waves).',
      'Overnight cabins are worth the extra cost — you sleep during the crossing and wake up in Jeju.',
      'The Mokpo route is the fastest and most popular — combine with KTX from Seoul for a budget trip.',
      'Bring seasickness tablets if prone — the Jeju Strait is one of Korea\'s roughest waterways.',
      'On-board restaurants serve basic Korean food — reasonable price and quality.',
      'Ferry cancellations happen fairly often in winter — have a backup flight option booked.',
      'Weekend ferries fill up fast in summer — book at least 2 weeks in advance for July–August.'
    ],
    links: [
      { label: 'Korea Marine Express (고려해운)', url: 'https://www.koreaferry.co.kr' },
      { label: 'Jeju Passenger Ship Booking', url: 'https://www.jeudoam.co.kr' }
    ]
  },

  'Ddareungi Bike': {
    overview: 'Ddareungi is Seoul\'s public bike-share, with 2,000+ stations and 35,000+ bikes. It\'s the best way to enjoy the city\'s superb cycling infrastructure — the Han River paths, Cheonggyecheon stream and Bukak Skyway. At just ₩1,000 per hour, it\'s an absurdly cheap way to explore Seoul.',
    bestFor: 'Fit travellers, Han River exploration, those wanting a unique Seoul experience beyond the subway. Great in spring and autumn.',
    schedule: 'Available 24 hours, 365 days. Best conditions: spring (April–May) and autumn (September–November), 09:00–20:00.',
    howto: [
      'Download the 따릉이 app (Seoul Bike) — available in English from App Store/Google Play.',
      'Register with a phone number and payment card — credit cards work without a Korean number.',
      'Choose a pass: 1-hour (₩1,000), 2-hour (₩2,000), or 7-day unlimited (₩10,000).',
      'Locate nearby stations on the app map and unlock with the app QR code.',
      'Return to any station in Seoul — the system is one-way flexible.'
    ],
    price: { range: '₩1,000 per hour · ₩10,000 for 7 days unlimited', note: 'Overage fee: ₩200 per additional 5 minutes. Extremely good value — most rides stay within 1 hour.' },
    tips: [
      'Han River cycling path is 56km long and completely flat — cycle from Jamsil to Yeouido for the best urban scenery.',
      'The app shows bike availability at each station in real-time — plan your route before leaving.',
      'Electric-assist 따릉이 bikes (전기자전거) are available at some stations for ₩2,000 extra — great for hills.',
      'Helmet use is not mandatory but recommended — available for rental at some stations.',
      'Avoid cycling on major roads — use dedicated bike lanes (자전거 전용도로) marked with blue signs.',
      'Combine with Han River park picnicking (치맥/편의점 food) for the quintessential Seoul experience.',
      'Weekends in summer (Jul–Aug) see heavy demand — reserve bikes in advance via the app.'
    ],
    links: [
      { label: 'Seoul Public Bike (따릉이) App', url: 'https://www.bikeseoul.com' },
      { label: 'Seoul Han River Park Cycling Map', url: 'https://hangang.seoul.go.kr' }
    ]
  },

  'Electric Scooter': {
    overview: 'Shared e-scooters from apps like Kakao T Bike, Lime and Bean are everywhere in Seoul, Busan and other major cities. Scan a QR code to unlock, park at your destination and pay in-app — perfect for the last stretch between a subway station and where you\'re actually going.',
    bestFor: 'Short distances (0.5–3km), last-mile connections from subway stations, exploring flat urban areas like Hongdae, Sinchon, Gangnam.',
    schedule: 'Available 24 hours. Most scooters return to charging hubs overnight — availability best from 07:00 onwards.',
    howto: [
      'Download Kakao T Bike or Lime app — both have English interfaces and work with international cards.',
      'Scan the QR code on the scooter to unlock — GPS auto-records your location.',
      'Ride in designated bike lanes (자전거 전용도로) — riding on sidewalks is illegal and fined.',
      'Helmet is legally required but often not available — many riders forgo it (do so at your own risk).',
      'End your ride by parking in a designated parking area shown in the app — parking incorrectly incurs a fee.'
    ],
    price: { range: '₩500 unlock fee + ₩150–₩180 per minute', note: 'A 10-minute ride costs approximately ₩2,000–₩2,500. Monthly passes available for frequent commuters.' },
    tips: [
      'Mandatory helmet law applies — local police increasingly enforce this, especially near tourist areas.',
      'Kakao T Bike (카카오 T 바이크) has the widest network in Seoul and integrates with the taxi app.',
      'Scooters are easiest in flat neighbourhoods: Hongdae, Itaewon, Sinchon, and Han River areas.',
      'Avoid hills — scooter torque is limited and Seoul\'s hilly areas can be slow and dangerous.',
      'Parking fines (₩3,000–₩20,000) apply if you park in non-designated areas — check the app map carefully.',
      'Rain makes scooters dangerous — avoid during and immediately after rainfall.',
      'International driving licence is not required for scooters under 125cc — standard category.'
    ],
    links: [
      { label: 'Kakao T Bike', url: 'https://www.kakaomobility.com' },
      { label: 'Lime Korea', url: 'https://www.li.me' }
    ]
  },

  'ITX Saemaul Train': {
    overview: 'ITX-Saemaul is Korea\'s semi-high-speed train, serving the smaller cities and rural areas the KTX bypasses. It\'s 20–40% cheaper than KTX and ideal for reaching traditional markets and countryside towns. The Mugunghwa is the slower, even cheaper all-stops alternative.',
    bestFor: 'Budget-conscious travellers, those visiting small cities and towns not on the KTX network, scenic slow travel enthusiasts.',
    schedule: 'Multiple daily departures from Seoul Station and Cheongnyangni. Less frequent than KTX — check schedule in advance at korail.com.',
    howto: [
      'Book at Korail website (letskorail.com) or at station ticket windows.',
      'Seats are reserved — book in advance, especially on weekends.',
      'ITX-Cheongchun: Seoul Cheongnyangni → Chuncheon (1hr 10min, ₩5,100) — excellent for Nami Island.',
      'ITX-Saemaul: Seoul → Busan all-stop (5hr 30min, ₩42,600) — much cheaper than KTX for flexible travellers.',
      'Mugunghwa (무궁화) is the cheapest option — stops at every station, ideal for rural exploration.'
    ],
    price: { range: 'Seoul–Busan ITX-Saemaul: ₩42,600 · Mugunghwa: ₩28,600', note: 'Significant savings vs KTX. KORAIL PASS covers ITX-Saemaul and Mugunghwa on all routes.' },
    tips: [
      'The ITX-Cheongchun line (춘천선) is the most scenic train ride near Seoul — mountain valleys and rivers.',
      'Mugunghwa trains stop at rural markets and small stations — great for unplanned adventures.',
      'Combine with bicycle rental at destination — most Korail station exits have bike rental nearby.',
      'Food carts (식당칸) on longer ITX routes serve simple Korean food — budget-friendly.',
      'Weekday trains are significantly less crowded than weekend/holiday services.',
      'The KORAIL PASS tourist rail pass includes ITX-Saemaul at no reservation surcharge — great value.',
      'Haengsin (행신) terminus near Suwon has large parking facilities — useful for driving + train combos.'
    ],
    links: [
      { label: 'Korail Booking (letskorail.com)', url: 'https://www.letskorail.com' },
      { label: 'KORAIL PASS for Tourists', url: 'https://www.korail.com/site/eng/tourism/korailpass.do' }
    ]
  },

  /* ═══════════════════════════════════════════════════════
     SHOPPING — 8 items
  ═══════════════════════════════════════════════════════ */

  'Myeongdong': {
    overview: 'Myeongdong is Seoul\'s biggest tourist shopping street — K-beauty, fashion and street food packed into one square kilometer. More than 50 beauty-brand stores, department stores and duty-free shops line the streets, drawing 30+ million visitors a year. In the evening, food stalls take over for one of Korea\'s best street-food experiences.',
    bestFor: 'K-beauty shopping, street food evenings, cosmetic brand hopping, duty-free shoppers. Ideal for first-time Seoul visitors.',
    schedule: 'Shops open 10:00–22:00. Street food stalls appear from 17:00 until midnight. Duty-free stores: 09:30–20:00.',
    howto: [
      'Take subway to Myeongdong Station (명동역, Line 4, Exit 6) or Euljiro 1-ga (을지로1가, Line 2).',
      'Start at Olive Young flagship for K-beauty — the staff speak English and offer samples generously.',
      'Work your way up the main street, comparing prices at Innisfree, Etude House, Missha, and The Face Shop.',
      'Evening: explore the street food alleys for egg bread (계란빵), tornado potatoes, and grilled skewers.',
      'For duty-free, Lotte Duty Free and Shinsegae Duty Free are both in Myeongdong — bring your passport.'
    ],
    price: { range: 'Sheet masks: ₩1,000–₩3,000 · Skincare sets: ₩15,000–₩80,000 · Street food: ₩2,000–₩6,000 per item', note: 'Tax refund available on purchases over ₩30,000 at participating shops — collect receipts and claim at airport.' },
    tips: [
      'Negotiate prices at smaller cosmetic stalls — not applicable in official brand stores.',
      'Tax refund (환급): shops with "Tax Free" sign offer VAT refund at the airport on purchases over ₩30,000.',
      'Chinese payment apps (WeChat Pay, Alipay) accepted almost everywhere — convenient for Chinese visitors.',
      'Street food is the best in the evening — tornado potato, Taiwanese egg castella, and Korean corn dogs.',
      'LOTTE Department Store\'s B1 food hall has exceptional Korean food at lunch hour.',
      'Weekends are extremely crowded — Tuesday–Thursday evenings give the best experience.',
      'The Cathedral of Myeongdong (명동성당) is a beautiful Gothic Catholic church at the top of the hill — worth a visit.'
    ],
    links: [
      { label: 'Myeongdong Shopping Map', url: 'https://map.naver.com' },
      { label: 'Olive Young Official', url: 'https://www.oliveyoung.co.kr' },
      { label: 'Tax Refund for Tourists', url: 'https://www.visitkorea.or.kr' }
    ]
  },

  'Dongdaemun Market': {
    overview: 'Dongdaemun is the world\'s largest 24-hour fashion wholesale-and-retail complex, with 30,000+ shops selling everything from designer labels to bulk wholesale. The futuristic Dongdaemun Design Plaza (DDP) sits beside traditional market blocks, and the area is at its liveliest overnight (22:00–06:00).',
    bestFor: 'Fashion buyers, wholesale shoppers, night owls, those looking for unique Korean fashion. Best visited after 22:00 when wholesale kicks in.',
    schedule: 'Retail: 10:00–05:00. Wholesale buildings: 20:00–07:00. DDP: 10:00–21:00. Closed Tuesdays (most wholesale buildings).',
    howto: [
      'Take subway to Dongdaemun History & Culture Park Station (동대문역사문화공원역, Line 2/4/5).',
      'For retail: visit Doota Mall, Hello APM, or Migliore (all open daytime and late evening).',
      'For wholesale: Dongdaemun Jonghap Sangga buildings open at 20:00 — minimum purchases apply.',
      'DDP (Dongdaemun Design Plaza) by Zaha Hadid is free to explore and hosts fashion and art exhibitions.',
      'Complete your visit with breakfast at the 24-hour pojangmacha stalls around the market perimeter.'
    ],
    price: { range: 'Retail: ₩20,000–₩80,000 per clothing item · Wholesale: Minimum order 3–5 pieces per style', note: 'Bargaining is acceptable with wholesale vendors. DDP exhibitions ₩3,000–₩12,000 entry.' },
    tips: [
      'The energy of Dongdaemun at 02:00 is unlike anything else in Korea — fashion buyers from across Asia.',
      'The outdoor street food corridor (cheonggyecheon stream area) is excellent at any hour.',
      'Many wholesale vendors don\'t have English — translate your request on your phone.',
      'Payment is primarily cash at most vendor stalls — bring Korean Won.',
      'Cheonggyecheon Stream (청계천) alongside the market is a beautiful illuminated waterway for evening walks.',
      'Wear comfortable shoes — the market area spans several blocks and hours of walking are typical.',
      'The DDP Light Show happens nightly from 20:00 — the Zaha Hadid building becomes a spectacular light canvas.'
    ],
    links: [
      { label: 'DDP Official (ddp.or.kr)', url: 'https://www.ddp.or.kr' },
      { label: 'Doota Mall', url: 'https://www.dootamall.co.kr' }
    ]
  },

  'Namdaemun Market': {
    overview: 'Namdaemun is Korea\'s oldest market, with 600 years of history and 10,000+ shops selling kitchenware, clothing, accessories, produce and street food. The iconic Namdaemun Gate (Sungnyemun) stands right beside it. Come at dawn to watch merchants stock their stalls from 4am.',
    bestFor: 'Traditional market experience, wholesale kitchenware, affordable clothing, unique Korean food products, authentic local atmosphere.',
    schedule: 'Most shops: 06:00–18:00 (closed Sundays). Some food stalls open from 04:00. Galchi (hair accessories) market: 06:00–18:00.',
    howto: [
      'Take subway to Hoehyeon Station (회현역, Line 4, Exit 5) — Namdaemun Market is 2 minutes away.',
      'The market is a labyrinth — allow 2 hours for a full exploration.',
      'Kitchenware area (2F of indoor section) is unbeatable for Korean cooking tools and utensils.',
      'Children\'s clothing area has the best prices for kids\' Korean traditional wear (한복).',
      'Visit the Kalguksu and haemul pajeon restaurant alley inside the market for an authentic lunch.'
    ],
    price: { range: 'Kitchenware: ₩5,000–₩50,000 · Clothing: ₩10,000–₩40,000 · Street food: ₩3,000–₩8,000', note: 'Haggling is expected and welcomed — start at 70% of the asking price.' },
    tips: [
      'Sungnyemun Gate (숭례문, Namdaemun) next to the market is Seoul\'s most important National Treasure — photo stop.',
      'The 칼국수 골목 (kalguksu alley) inside serves handmade noodle soup for ₩8,000 — extraordinary value.',
      'Galchi (갈치, hair accessories) section is one of the largest such markets in Asia.',
      'Early morning (05:00–07:00) is when wholesale activity peaks and prices are lowest.',
      'Cash-only at most stalls — ATMs available near all major entrances.',
      'The dried seafood section (건어물 상회) sells excellent quality Korean dried goods for home cooking.',
      'Street-food highlight: 호떡 (sweet fried dough pancakes) from the famous corner stall near Gate 2.'
    ],
    links: [
      { label: 'Namdaemun Market Official', url: 'https://www.namdaemunmarket.co.kr' }
    ]
  },

  'Lotte / Shinsegae Duty-Free': {
    overview: 'Korea\'s duty-free stores are among the largest in the world. The Lotte, Shinsegae and Shilla flagships in Myeongdong and at Incheon Airport carry everything from Louis Vuitton to Chanel and Hermès at up to 30% off — and their K-beauty and Korean food sections are outstanding.',
    bestFor: 'International travellers purchasing luxury goods, K-beauty in bulk, Korean specialty products. Must have a flight ticket within 3 months.',
    schedule: 'Downtown duty-free: 09:30–20:00. Airport duty-free: 24 hours. Pre-order online for collection at airport is available.',
    howto: [
      'Present your passport and flight ticket/itinerary when purchasing at any duty-free store.',
      'Downtown purchases are collected at the airport departure gate area — not taken from the store.',
      'Shop at Lotte Duty Free Myeongdong flagship (10 floors) for the largest selection.',
      'Pre-order online at lottedfs.com for up to 10% additional discount vs in-store.',
      'Budget time: airport duty-free lines can be 30–60 minutes during peak travel periods.'
    ],
    price: { range: 'Tax-free savings: 10–30% off retail prices depending on category', note: 'Korean citizens have a ₩800 duty-free allowance. Foreign tourists are exempt from Korean VAT automatically.' },
    tips: [
      'K-beauty at duty-free is excellent value — Sulwhasoo, Whoo (후), and Su:m37 are particularly good buys.',
      'Cosmetics and skincare can be purchased and taken from the store immediately (no airport collection needed).',
      'Alcohol and tobacco are only available for purchase at airport duty-free (not downtown).',
      'Lotte World Tower\'s 5F-11F premium outlets are worth visiting even without duty-free intentions.',
      'The airport duty-free perfume section has the best global range — test on skin before flights.',
      'Children\'s toys and Korean specialty food items (홍삼, red ginseng) are popular duty-free purchases.',
      'Combine downtown duty-free with Myeongdong street shopping — both are in the same area.'
    ],
    links: [
      { label: 'Lotte Duty Free (lottedfs.com)', url: 'https://www.lottedfs.com' },
      { label: 'Shinsegae Duty Free (shinsegaedutyFree.com)', url: 'https://www.shinsegaedutyFree.com' },
      { label: 'Silla Duty Free', url: 'https://www.silladfs.co.kr' }
    ]
  },

  'Coupang': {
    overview: 'Coupang is Korea\'s Amazon — the country\'s largest e-commerce platform, famous for Rocket Delivery same-day (even dawn) shipping. Order by 11pm in greater Seoul and it arrives before 7am. It\'s handy even for travelers, who can ship essentials straight to their accommodation.',
    bestFor: 'Anyone staying in Korea for 3+ days who wants to order locally. Essential for buying Korean groceries, cosmetics, electronics, or everyday items.',
    schedule: 'App/website 24 hours. Rocket Delivery orders placed before 24:00 arrive by 07:00 next day in most areas.',
    howto: [
      'Download the 쿠팡 (Coupang) app — international credit cards accepted.',
      'Sign up with a Korean phone number or international number (via SMS verification).',
      'Search in Korean for better results — use Google Translate to find the Korean product name.',
      'Use "로켓배송" (Rocket Delivery) filter for same/next-day items.',
      'Input your accommodation address for delivery — hotels and guesthouses accept Coupang parcels.'
    ],
    price: { range: 'Product prices vary. Free shipping on orders over ₩19,800 for standard; Rocket Delivery items ship free.', note: 'Coupang Wow membership (₩4,990/month) offers free Rocket Delivery on all orders — worth it for 1-month stays.' },
    tips: [
      'Coupang is the fastest way to get a SIM card delivered to your hotel — order as soon as you land.',
      'K-beauty products on Coupang are 30–50% cheaper than tourist-area stores for the same products.',
      'Return policy is extremely lenient — most items returnable within 30 days, free pickup included.',
      'Coupang Fresh (쿠팡 프레시) delivers groceries including Korean superfoods — excellent for AirBnB stays.',
      'Check the "쿠팡 로켓직구" section for direct import items from global brands.',
      'Avoid counterfeit risk — only buy from "Coupang Fulfilled" listings (rocket delivery logo).',
      'Coupang Plays (streaming) and Coupang Eats (food delivery) are bundled in the same app.'
    ],
    links: [
      { label: 'Coupang Official (coupang.com)', url: 'https://www.coupang.com' }
    ]
  },

  'Costco Korea': {
    overview: 'Korea\'s Costco branches are famously among the busiest in the world. Korean-exclusive items (seasoned chicken, mentaiko pasta, the bakery) are legendary, and it\'s a fun window into Korea\'s hypermarket culture. The Yangjae and Hanam stores are the closest to central Seoul.',
    bestFor: 'Bulk food buyers, curious about Korean consumer culture, those staying in self-catering accommodation for 1+ weeks.',
    schedule: 'Most locations: 10:00–20:00. Closed major Korean holidays (Chuseok, Lunar New Year).',
    howto: [
      'Membership card required — international Costco membership works at Korean locations.',
      'Yangjae (양재) location in southern Seoul is most accessible by subway (Line 3, Yangjae Station).',
      'Try the Korean Costco food court first — 불고기 베이크 (bulgogi bake) and 핫도그 (Korean corn dog) are legendary.',
      'The food sample stations (시식 코너) are generously stocked — you can essentially snack your way through the store.',
      'Alcohol section has excellent imported wine and Korean makgeolli at warehouse prices.'
    ],
    price: { range: 'Annual membership: ₩38,500. Products priced similarly to US/EU Costco with Korean-specific items.', note: 'The kirkland signature products are available at Korean Costco. Korean exclusive items are competitively priced.' },
    tips: [
      'Korean Costco-exclusive items: 양념게장 (soy marinated crab), 닭갈비 (Chuncheon chicken), 소시지야채볶음 (sausage vegetable stir fry).',
      'The rotisserie chicken (로티세리 치킨) sells out by 18:00 — arrive early if that\'s your goal.',
      'Weekend afternoons are impossibly crowded — visit Tuesday–Thursday for a pleasant experience.',
      'Costco\'s K-beauty section has large-format Korean skincare at warehouse prices.',
      'The food court 핫도그 (corn dog) is genuinely famous among Koreans — different from US version.',
      'Self-checkout lines are usually shorter than staffed checkout — app payment accepted.',
      'Korean Costco has its own exclusive Korean bbq sauce and kimchi worth bringing home as souvenirs.'
    ],
    links: [
      { label: 'Costco Korea Official', url: 'https://www.costco.co.kr' }
    ]
  },

  'Insadong Antiques': {
    overview: 'Insadong is Seoul\'s traditional culture district, stretching from the Joseon era to today. Some 400 galleries, antique dealers, craft shops, hanji (Korean paper) specialists and traditional teahouses pack one kilometer. Unlike Myeongdong or Garosu-gil, Insadong is where you experience Korea\'s own aesthetics in earnest.',
    bestFor: 'Culture and art lovers, authentic souvenir hunters, traditional Korean craft shoppers, anyone seeking alternatives to mass-market tourist shops.',
    schedule: 'Galleries and shops: 10:00–20:00. Some antique dealers close Mondays. Street buskers and performers on weekends from 13:00.',
    howto: [
      'Take subway to Anguk Station (안국역, Line 3, Exit 6) and walk 5 minutes to the start of Insadong-gil.',
      'Start at the bottom (near Tapgol Park) and work your way uphill through the main street and alleyways.',
      'Explore Ssamziegil (쌈지길) — a spiral courtyard mall with independent Korean craft and design shops.',
      'Visit at least one traditional tearoom (전통찻집) — 연 (lotus tea) or 오미자 (five-flavour tea) is recommended.',
      'Stop at a hanji (한지) shop and browse the extraordinary range of hand-made Korean paper products.'
    ],
    price: { range: 'Postcards/small crafts: ₩3,000–₩15,000 · Ceramics: ₩20,000–₩300,000+ · Antiques: ₩50,000–₩500,000+', note: 'Serious antique buyers should visit on weekday mornings for better prices and more time with dealers.' },
    tips: [
      'Insa-dong\'s side alleys (골목) hide the most authentic shops — avoid only the main pedestrian street.',
      'Ssamziegil (쌈지길) is a converted courtyard with independent designers — excellent for unique gifts.',
      'Traditional hanji (한지) paper products make extraordinary souvenirs — beautiful and lightweight.',
      'The traditional tearoom at the top of the street (부산집 차) is excellent for a mid-shopping rest.',
      'Antique dealers are knowledgeable — ask for provenance information before purchasing expensive items.',
      'Sundays see street performers and outdoor art markets from 13:00 — very lively atmosphere.',
      'Just off Insadong: Bukchon Hanok Village and Gyeongbokgung Palace — combine all three in one morning.'
    ],
    links: [
      { label: 'Insadong Shopping Guide', url: 'https://map.naver.com' },
      { label: 'Ssamziegil (쌈지길)', url: 'https://www.ssamziegil.co.kr' }
    ]
  },

  'Night Markets': {
    overview: 'Korea\'s night markets run roughly 6pm to midnight, mixing street food, crafts and live performances. Seoul\'s Banpo Han River market, the Yeouido spring market and Jeonju\'s Nambu night market are the standouts; many regional cities run seasonal weekend markets from May to October.',
    bestFor: 'Foodies, casual evening entertainment, families, couples looking for affordable date-night experiences.',
    schedule: 'Most night markets: 18:00–23:00 (Fri–Sun, May–October). Han River markets: year-round on weekends. Specific event calendars vary — check local tourism apps.',
    howto: [
      'Han River Yeouido Spring Market (여의도 봄꽃시장): best in April during cherry blossom season.',
      'Banpo Han River Night Market (반포 야시장): every weekend May–October at Banpo Hangang Park.',
      'Jeonju Nambu Market Night Market (전주 남부시장 야시장): Friday and Saturday 19:00–23:00 year-round.',
      'Myeongdong street food stalls (from 17:00) are essentially a nightly market every day.',
      'Dongdaemun area outdoor food tents (포장마차) operate until early morning year-round.'
    ],
    price: { range: 'Street food: ₩3,000–₩8,000 per item · Craft items: ₩5,000–₩30,000', note: 'Entry is always free to night markets. Budget ₩20,000–₩40,000 for a satisfying evening of food and shopping.' },
    tips: [
      'Arrive by 19:00 to get the best selection before popular stalls sell out.',
      'Han River night markets pair perfectly with cycling (따릉이 rental nearby) and picnicking.',
      'Jeonju\'s Nambu Market night market is the most authentically Korean — less tourist-oriented than Seoul.',
      'Food: look for 순대볶음 (stir-fried blood sausage), 파전 (pancake), 닭강정 (sweet fried chicken bits).',
      'Korean night markets always have at least one stall selling 마라탕 (Mala hot pot) now — extremely popular.',
      'Large night markets have designated picnic mat areas — bring or rent a mat and eat with a view.',
      'Follow visitseoul.net or the Seoul calendar app for up-to-date night market schedules each week.'
    ],
    links: [
      { label: 'Seoul Night Market Calendar (visitseoul.net)', url: 'https://english.visitseoul.net' },
      { label: 'Banpo Han River Night Market', url: 'https://hangang.seoul.go.kr' }
    ]
  },


  /* ═══════════════════════════════════════════════════════
     K-BEAUTY — 8 items
  ═══════════════════════════════════════════════════════ */

  'K-Beauty Skincare': {
    overview: 'K-Beauty is Korea\'s revolution in global skincare. Innovative ingredients — snail mucin, fermented extracts, centella asiatica, hyaluronic acid, niacinamide — and the famous 10-step routine have become worldwide standards. Korean glass skin is the product of disciplined daily care, from double cleansing to sunscreen.',
    bestFor: 'Skincare enthusiasts of all levels — complete beginners to advanced routines. Korean skincare offers unmatched value at every price point.',
    schedule: 'Best shopping: Myeongdong (10:00–22:00), Olive Young nationwide (09:00–22:00), online via Coupang (24hr).',
    howto: [
      'Step 1 — Oil Cleanser (오일 클렌저): removes makeup and sunscreen. Banila Co Clean It Zero is legendary.',
      'Step 2 — Foam Cleanser (폼 클렌저): water-based wash for water-based impurities. CeraVe is popular but Korean options like COSRX are cheaper.',
      'Step 3 — Toner (토너): hydrates and preps skin. Klairs Supple Preparation Toner is globally loved.',
      'Step 4 — Essence / Serum: concentrated treatment. COSRX Snail 96 Mucin Power Essence is the hero product.',
      'Step 5 — Moisturiser + SPF 50 sunscreen (선크림) — the most important step Koreans never skip.'
    ],
    price: { range: 'Entry-level routine: ₩30,000–₩50,000 · Premium routine: ₩150,000–₩500,000+', note: 'Korean skincare offers luxury-quality at drugstore prices. A complete beginner routine from Olive Young costs around ₩40,000.' },
    tips: [
      'SPF 50 sunscreen daily is considered the single most important anti-aging habit in Korean skincare culture.',
      'Snail mucin (달팽이 점액) actually works — the glycoproteins and hyaluronic acid content is clinically proven.',
      'Korean skin types are often categorised as 트러블성 (acne-prone), 건성 (dry), or 지성 (oily) — most products specify.',
      'Fermented ingredients (발효 성분) in brands like Sulwhasoo or History of Whoo have centuries of traditional medicine backing.',
      'Patch test all new products on your inner wrist for 24 hours before applying to face.',
      '"Skincare fridge" (화장품 냉장고) is a real trend — cooling toners and sheet masks feels luxurious.',
      'Korean sunscreens are cosmetically elegant vs Western ones — no white cast, lightweight, wearable daily.'
    ],
    links: [
      { label: 'Olive Young (올리브영)', url: 'https://www.oliveyoung.co.kr' },
      { label: 'Soko Glam K-Beauty Guide', url: 'https://www.sokoglam.com' },
      { label: 'Reddit r/AsianBeauty Routine Guide', url: 'https://www.reddit.com/r/AsianBeauty' }
    ]
  },

  'Innisfree': {
    overview: 'Innisfree is Korea\'s biggest natural-beauty brand, founded by Amorepacific in 2000. Its ingredients come from Jeju Island — green tea, hallabong orange, volcanic minerals, camellia oil — and its eco packaging and refill programs make it an ESG leader. The 500+ product line runs from ₩10,000 toners to luxury serums.',
    bestFor: 'Eco-conscious shoppers, natural ingredient enthusiasts, those looking for affordable but effective skincare, first-time K-beauty buyers.',
    schedule: 'Stores nationwide: 10:00–21:00. Flagship store in Myeongdong: 09:30–22:00. Jeju Island flagship store (Jeju City): 09:00–21:00.',
    howto: [
      'Start with the bestselling Green Tea Seed Serum (그린티 씨드 세럼) — globally acclaimed hydrating serum.',
      'The No-Sebum Mineral Powder (노세범 미네랄 파우더) is a cult item — perfect for oily skin control on the go.',
      'Visit the Jeju Island flagship store for exclusive Jeju-only product lines and immersive brand experiences.',
      'Join the Innisfree membership (membership card) at any store for immediate discounts and points.',
      'Look for seasonal limited editions — collaboration products sell out quickly and are highly collectible.'
    ],
    price: { range: '₩5,500 – ₩65,000 depending on product', note: 'Sales are frequent — check the Innisfree app for weekly promotions. 1+1 deals are common on bestsellers.' },
    tips: [
      'Green Tea Seed Serum reformulation (2022) is even better than the original — confirmed improvement by skincare reviewers.',
      'Innisfree\'s empty bottle recycling program (공병수거) gives store credit for returning finished products.',
      'The Canola Honey Sleeping Mask (꿀 수면팩) is among the best overnight masks at any price point.',
      'Innisfree sheet masks are among Korea\'s cheapest at ₩1,000–₩1,500 each — buy a box of 20.',
      'Jeju Volcanic Clay Mask (화산송이 마스크) is the brand\'s signature product — visibly reduces pores.',
      'Korean beauty blogger reviews on Naver Blogs are more reliable than global reviews for Korean brands.',
      'Duty-free purchase of Innisfree products saves 15–20% vs Myeongdong retail prices.'
    ],
    links: [
      { label: 'Innisfree Official (innisfree.com)', url: 'https://www.innisfree.com' },
      { label: 'Innisfree Jeju Flagship Store Map', url: 'https://map.naver.com' }
    ]
  },

  'COSRX': {
    overview: 'COSRX, founded in 2013, is the Korean skincare brand that went globally viral on TikTok and YouTube. True to its name (Cosmetics + RX), it focuses on scientifically proven actives with minimal preservatives and fragrance. Its Snail Mucin Essence and AHA/BHA liquid are among the best-selling K-beauty products on Earth.',
    bestFor: 'Acne-prone skin, sensitive skin, those seeking science-backed minimalist skincare, global K-beauty beginners attracted by social media.',
    schedule: 'Available at Olive Young nationwide, Coupang online, Myeongdong shops (10:00–22:00), and international shipping.',
    howto: [
      'Advanced Snail 96 Mucin Power Essence: apply after toner, pat gently — don\'t rub. Use morning and night.',
      'BHA Blackhead Power Liquid: use 2–3 times/week MAX. Apply after cleansing on dry skin, leave 10 min, rinse.',
      'Low pH Good Morning Gel Cleanser: excellent for acne-prone skin — maintains skin\'s natural pH.',
      'Acne Pimple Master Patch (여드름 패치): apply on a clean dry spot overnight — magic pimple-drying patches.',
      'Full Fit Propolis Light Ampoule: propolis extract for brightening and barrier repair — for sensitive skin.'
    ],
    price: { range: '₩12,000 – ₩32,000 per product', note: 'Multi-buy sets at Olive Young are better value. The Snail Essence 100ml sells for ₩18,000 vs $45 in Western markets.' },
    tips: [
      'Snail 96 Mucin Power Essence: the "96 Mucin" refers to 96% snail secretion filtrate concentration — legitimately high.',
      'COSRX products are fragrance-free and alcohol-free — ideal for sensitive skin and rosacea.',
      'The Acne Pimple Master Patch is the world\'s best-selling acne patch — 100-pack available on Coupang.',
      'Always use SPF 50 after AHA/BHA exfoliants — they increase sun sensitivity significantly.',
      'The "COSRX x Charlotte Tilbury" collaboration launched Western distribution — but Korean prices remain 50% lower.',
      'COSRX\'s Reddit fanbase on r/AsianBeauty is enormous — check reviews there before buying.',
      'Buy directly at Myeongdong Olive Young for authenticity guarantee vs third-party global re-sellers.'
    ],
    links: [
      { label: 'COSRX Official (cosrx.com)', url: 'https://www.cosrx.com' },
      { label: 'Olive Young — COSRX Section', url: 'https://www.oliveyoung.co.kr' }
    ]
  },

  'Sulwhasoo': {
    overview: 'Sulwhasoo is Amorepacific\'s flagship luxury hanbang (traditional herbal) skincare brand. It blends 600 years of Korean medicine — red ginseng, peony, omija berry, lotus — with modern biotech. A national luxury passed from mothers to daughters since 1966, it\'s now booming in China, Hong Kong and North America.',
    bestFor: 'Premium gift buyers, those interested in traditional Korean herbal medicine in skincare, mature skin, luxury skincare connoisseurs.',
    schedule: 'Flagship store in Bukchon (Anguk): 10:00–19:00. Myeongdong store: 10:00–21:00. Department store counters: 10:30–20:00.',
    howto: [
      'Request a complimentary consultation and sample at any Sulwhasoo counter — they are generous with samples.',
      'Start with the Concentrated Ginseng Renewing Cream (윤조에센스 + 자음생크림 combination).',
      '윤조에센스 (Yoon Jo Essence) is the brand\'s hero product — first step after toning, called "liquid gold."',
      'Ask for the "skin ritual" mini-treatment at the Bukchon flagship — a 20-minute complimentary consultation.',
      'Sets (세트) at Sulwhasoo are significantly better value than individual items — especially holiday gift sets.'
    ],
    price: { range: '₩50,000 – ₩500,000+ per product', note: 'Considered affordable luxury in Korea. Duty-free saves 15–25%. Holiday sets offer 40–60% better value than buying individually.' },
    tips: [
      '윤조에센스 (First Care Activating Serum) is Sulwhasoo\'s bestseller — the scent of Korean traditional herbs is distinctive and beloved.',
      'Ginseng extract (홍삼 성분) in Sulwhasoo products is backed by decades of clinical research at Amorepacific.',
      'The Sulwhasoo Flagship Store in Bukchon offers traditional Korean beauty rituals (한방 미용 체험) — bookable in advance.',
      'Sulwhasoo limited edition packaging (usually lunar new year and holiday designs) is collector-worthy.',
      'Compare prices: Sulwhasoo on Coupang Rocket Delivery is often 20–30% cheaper than department stores.',
      'The 설화수 홈페이지 member perks include free samples with every order and birthday gifts.',
      'History of Whoo (더 히스토리 오브 후) by LG H&H is Sulwhasoo\'s main premium competitor — equally prestigious.'
    ],
    links: [
      { label: 'Sulwhasoo Official (sulwhasoo.com)', url: 'https://www.sulwhasoo.com' },
      { label: 'Sulwhasoo Bukchon Flagship Store', url: 'https://map.naver.com' }
    ]
  },

  'Sheet Masks': {
    overview: 'The sheet mask is Korea\'s gift to global skincare — an essence-soaked face sheet that floods skin with hydration in 10–20 minutes. In Korea they start at ₩1,000 each, and using one before a flight, after a breakout or the night before a big event is simply routine.',
    bestFor: 'Everyone — a ₩1,000 luxury that genuinely works. First-time K-beauty buyers, travel skincare, quick fixes before important events.',
    schedule: 'Available 24 hours at all convenience stores (GS25, CU, 7-Eleven). Olive Young and Myeongdong shops: 10:00–22:00.',
    howto: [
      'Cleanse face thoroughly first — sheet mask works best on clean, damp skin.',
      'Open packet and carefully unfold — there is a protective film to remove from one side.',
      'Align with eyes, nose, and mouth cutouts, press gently onto face, and smooth out any air bubbles.',
      'Leave for 15–20 minutes (not longer — the mask will start re-absorbing from skin).',
      'Remove and pat remaining essence into skin gently — do not rinse off.'
    ],
    price: { range: '₩1,000 – ₩8,000 per mask', note: 'Convenience store masks (CU, GS25) are ₩1,000–₩2,000. Box sets of 10–20 masks at Olive Young offer best value at ₩800–₩1,500/mask.' },
    tips: [
      'Apply a sheet mask on the plane — international flights are notoriously dehydrating for skin.',
      'Refrigerating sheet masks for 30 minutes before use reduces puffiness and feels incredibly refreshing.',
      'JM Solution, Mediheal, and Papa Recipe Bombee Honey are consistently ranked the best drugstore options.',
      'The Mediheal NMF Aquaring Ampoule mask (메디힐 아쿠아링 앰플 마스크) is Korea\'s bestselling mask of the decade.',
      'Layer a sleeping mask (슬리핑 마스크) after your sheet mask for maximum overnight hydration.',
      'Sheet mask excess essence can be applied to hands, neck, and décolleté — never waste it.',
      'Buy in bulk packs (10–30 sheets) at Daiso (다이소, Korea\'s ₩1,000 store) for ultimate budget K-beauty.'
    ],
    links: [
      { label: 'Mediheal Official (mediheal.com)', url: 'https://www.mediheal.com' },
      { label: 'Olive Young Sheet Masks Section', url: 'https://www.oliveyoung.co.kr' }
    ]
  },

  'Olive Young': {
    overview: 'Olive Young is Korea\'s dominant health & beauty chain — its Sephora and CVS rolled into one. Over 1,300 stores nationwide stock some 25,000 products spanning K-beauty, supplements, medicine and personal care. New K-beauty trends surface here first, making it the first stop for beauty fans visiting Korea.',
    bestFor: 'All K-beauty shoppers — beginners and experts alike. Best one-stop shop for authentic Korean skincare, cosmetics, and health products.',
    schedule: 'Most stores: 09:00–22:00 (some 24-hour locations). Myeongdong flagship: 09:00–23:00. Online: oliveyoung.co.kr (ships internationally).',
    howto: [
      'Download the Olive Young app for English-language browsing, weekly deals, and member coupons.',
      'The "Annual Sale" (올영세일, held multiple times per year) offers 1+1 and 2+1 deals — plan your trip around it.',
      'Staff will help find products if you show a photo or product name on your phone — very accommodating.',
      'Look for the "올영 추천" (Olive Young Pick) label — store-curated bestsellers are reliably good.',
      'Tax refund available for purchases over ₩30,000 — ask for a tax refund receipt at checkout.'
    ],
    price: { range: 'Sheet masks: ₩1,000–₩3,000 · Serums: ₩12,000–₩80,000 · Sets and kits: ₩15,000–₩150,000', note: 'Olive Young membership (무료 가입) gives instant 5% discount and birthday coupons. Free samples always available at checkout.' },
    tips: [
      'The Olive Young app in English shows the exact same products and prices as in-store — great for pre-trip planning.',
      'Trending products are displayed at the front — these genuinely reflect current Korean skincare trends.',
      'Beauty consultants at Olive Young (뷰티 크리에이터) wear matching uniforms and are knowledgeable — ask for recommendations.',
      'The health section (건강기능식품) has excellent Korean red ginseng, probiotics, and collagen supplements.',
      'Olive Young Global (global.oliveyoung.com) ships internationally — prices are slightly higher but authentic.',
      'The Myeongdong flagship has the largest selection and English-speaking staff concentrated there.',
      'Check the "오늘드림" (Today Dream) section for same-day delivery within Seoul if you\'re shopping online.'
    ],
    links: [
      { label: 'Olive Young Global Shop', url: 'https://global.oliveyoung.com' },
      { label: 'Olive Young App Download', url: 'https://www.oliveyoung.co.kr' }
    ]
  },

  'Medical Tourism': {
    overview: 'Korea is Asia\'s leading medical-tourism destination, world-class in plastic surgery and dermatology. Seoul\'s Gangnam district packs 500+ clinics into its beauty belt, offering eye and nose procedures, contouring, laser treatments, Botox and fillers at a third to a fifth of US prices.',
    bestFor: 'Those considering cosmetic procedures (eye surgery, rhinoplasty, skin treatments), dermatology treatments, dental work, and general health check-ups at world-class facilities.',
    schedule: 'Clinics: 09:00–18:00 weekdays, some open Saturdays. Consultation required before any procedure — book 2–4 weeks in advance for surgery.',
    howto: [
      'Research clinics thoroughly — check Korean medical board certification, before/after photos, and international patient reviews.',
      'Book a consultation first (무료 상담, usually free) — never book a procedure without an in-person consultation.',
      'Use a medical tourism agency (e.g., Korea Health Tourism Corporation) for translator assistance and clinic matching.',
      'Recovery time: non-invasive skin treatments (laser, botox) require 1–7 days; surgical procedures 2–4 weeks.',
      'Medical visa (의료관광 비자) available for longer treatment plans — the Korea Tourism Organization assists.'
    ],
    price: { range: 'Botox: ₩80,000–₩300,000 · Double eyelid surgery: ₩700,000–₩2,000,000 · Rhinoplasty: ₩2,000,000–₩7,000,000', note: 'Same procedures cost 2–5x more in the US and UK. Korean surgeons have exceptionally high case volumes.' },
    tips: [
      'Gangnam\'s "Plastic Surgery Street" (성형외과 거리, near Sinsa Station) has highest concentration of clinics.',
      'Korean plastic surgeons have among the highest case volumes globally — experience translates to expertise.',
      'Skin treatments (레이저, 피부관리) are often walk-in and affordable — great for a "skin holiday".',
      'Medical Korea (medicaltourism.go.kr) is the Korean government\'s official medical tourism portal — start here.',
      'Always get a detailed consultation and ask about recovery protocols before committing to any procedure.',
      'International patient coordinators speak English at most Gangnam clinics — language is rarely a barrier.',
      'Check the Korean Medical Dispute Mediation and Arbitration Agency for any board-certified clinic verification.'
    ],
    links: [
      { label: 'Medical Korea (medicaltourism.go.kr)', url: 'https://www.medicalkorea.or.kr/en' },
      { label: 'Korea Health Tourism Corporation', url: 'https://www.khidi.or.kr' }
    ]
  },

  'Lip Tints & BB Cream': {
    overview: 'Korea invented the lip tint and perfected BB cream, reshaping the global makeup industry. Lip tints deliver long-lasting, smudge-proof gradient color — the just-bitten look that conquered the world. BB cream began in German dermatology, but Korea evolved it into the all-in-one foundation-sunscreen-skincare hybrid we know today.',
    bestFor: 'Makeup lovers, those new to Korean cosmetics, anyone looking for the signature "K-beauty dewy skin" look.',
    schedule: 'All K-beauty stores and Olive Young: 10:00–22:00. Department store cosmetics counters: 10:30–20:00.',
    howto: [
      'Lip Tints: apply from center of lips outward for the gradient "bitten lip" look (물든 듯한 입술).',
      'Gradient lip technique: apply tint only to inner 2/3 of lips, blur outward with finger — iconic Korean look.',
      'BB Cream application: dot on forehead, cheeks, nose, chin, then blend with damp beauty blender.',
      'Cushion BB Compact (쿠션 팩트) is the easiest — press cushion to face for natural, dewy coverage.',
      'Set with loose setting powder (루스 파우더) for longevity — or embrace the dewy no-powder look.'
    ],
    price: { range: 'Lip tint: ₩8,000–₩20,000 · BB Cream: ₩12,000–₩45,000 · Cushion compact: ₩18,000–₩60,000', note: 'Romand, Peripera, and 3CE are bestselling lip tint brands at ₩8,000–₩15,000. Laneige and Sulwhasoo offer premium BB/cushions.' },
    tips: [
      'Romand Juicy Lasting Tint (롬앤 쥬시 래스팅 틴트) is THE Korean lip tint bestseller — try at any Olive Young.',
      'HAUS Labs (Lady Gaga\'s brand) hired Korean lip tint technology — evidence of Korea\'s global cosmetics influence.',
      '3CE is the most Instagrammable Korean makeup brand — beautiful packaging and excellent colour range.',
      'Peripera Ink Mood Glowy Tint (페리페라 잉크 무드 글로이 틴트) is a cult item for glass-lip effect.',
      'Laneige Lip Sleeping Mask (립 슬리핑 마스크) is the #1 K-beauty gift item globally — available in 20+ flavours.',
      'Cushion compact (쿠션 팩트) was invented by Amorepacific in 2008 — now copied by every global makeup brand.',
      'Korean makeup is increasingly gender-neutral — many men\'s skincare and tinted products are now mainstream.'
    ],
    links: [
      { label: 'Romand (롬앤) Official', url: 'https://www.romand.us' },
      { label: '3CE Stylenanda', url: 'https://www.stylenanda.com' },
      { label: 'Laneige Official', url: 'https://www.laneige.com' }
    ]
  },

  /* ═══════════════════════════════════════════════════════
     K-POP — 8 items
  ═══════════════════════════════════════════════════════ */

  'K-Pop Idol Culture': {
    overview: 'K-pop is less a music genre than the world\'s most sophisticated entertainment system. Idols train 5–10 years from their early teens in vocals, dance, languages and styling before debuting. BTS, BLACKPINK, TWICE, NewJeans and aespa command fandoms across 190+ countries and shape fashion, beauty and drama industries alike.',
    bestFor: 'K-pop fans of all ages, music industry enthusiasts, those wanting to understand the Hallyu (Korean Wave) phenomenon from the inside.',
    schedule: 'Fan events and signings: check official fandom channels. HYBE Insight Museum: 10:00–19:00 (last entry 18:00). SM Town COEX: 11:00–21:00.',
    howto: [
      'Visit HYBE Insight Museum (하이브 인사이트, Yongsan) for the most comprehensive BTS/HYBE artist experience.',
      'SM Town COEX Artium has EXO, NCT, aespa, Red Velvet pop-up merchandise and interactive displays.',
      'Check VLive (now Weverse) and fan café for official fan event announcements — international fans are welcome.',
      'Hongdae\'s K-pop dance cover crews perform publicly every Saturday — free to watch near Exit 1.',
      'Join a K-pop fan tour (Trazy, KKday) for guided visits to agency buildings, music video filming locations, and record shops.'
    ],
    price: { range: 'HYBE Insight: ₩22,000 · SM Town COEX: ₩11,000 · Concert tickets: ₩66,000–₩165,000', note: 'Fan sign events (팬사인회) are free to enter via album lottery — purchase albums for a chance to meet artists.' },
    tips: [
      'Music Bank (KBS), Inkigayo (SBS), and M Countdown (Mnet) record LIVE every week — fans can attend for free with advance registration.',
      'Melon Music Awards (MMA) and Mnet Asian Music Awards (MAMA) sell tickets months in advance.',
      'Weverse (위버스) is the official platform connecting fans with artists — notifications about events come here first.',
      'K-pop fan culture etiquette: no touching artists, no photography at fan signs without permission, follow official fan café rules.',
      'The annual year-end concerts (연말 콘서트) at Seoul Olympic Park (잠실 올림픽공원) are the most spectacular.',
      'Hanteo Chart (한터 차트) and Gaon Chart track physical album sales — buying an album contributes to a fan\'s support.',
      'K-pop\'s global reach: in 2023, K-pop albums sold $350M globally; BTS alone contributed $4.9B annually to Korean GDP.'
    ],
    links: [
      { label: 'HYBE Insight Museum (Weverse)', url: 'https://weverse.io' },
      { label: 'K-Pop Live Show Attendance Guide', url: 'https://english.visitseoul.net' },
      { label: 'Weverse Shop (official merch)', url: 'https://shop.weverse.io' }
    ]
  },

  'HYBE / Big 4 Agencies': {
    overview: 'HYBE (formerly Big Hit), SM, JYP and YG are the Big 4 agencies that dominate K-pop. They\'re home to BTS and LE SSERAFIM (HYBE), aespa and EXO (SM), TWICE and Stray Kids (JYP), and BLACKPINK (YG). Their Seoul headquarters have become pilgrimage sites for fans worldwide.',
    bestFor: 'K-pop fans who want to see where their favourite artists train and work. Architecture and culture enthusiasts interested in Korea\'s entertainment industry.',
    schedule: 'Exterior viewing: any time. HYBE Insight Museum: Tue–Sun 10:00–19:00. SM Town COEX Artium: 11:00–21:00. JYP Entertainment: exterior only.',
    howto: [
      'HYBE Headquarters (용산 HYBE): visit HYBE Insight Museum for BTS/artist interactive experiences.',
      'SM Town COEX Artium (코엑스 SM타운): K-pop merchandise, holographic concerts, and artist exhibits.',
      'JYP Entertainment (강남 청담동 JYP): exterior viewing only — a fan pilgrimage site.',
      'YG Entertainment (합정 홍대 YG): distinctive building exterior — photo spot for BLACKPINK fans.',
      'Buy official light sticks (응원봉) at HYBE Insight or SM Town COEX — essential fan items.'
    ],
    price: { range: 'HYBE Insight Museum: ₩22,000 · SM Town COEX: ₩11,000', note: 'Agency headquarters exteriors are free to photograph. Agency stores sell official merchandise.' },
    tips: [
      'HYBE Insight Museum requires advance online booking — often sold out 2 weeks ahead, especially on weekends.',
      'SM Town COEX has a permanent café and photo zones for each artist group — K-pop photo heaven.',
      'Korean streaming platform Melon is the definitive chart — a song charting on Melon equals mainstream Korean success.',
      'Agency fan cafés (팬카페) on Daum are the most active official fan communities — register for early event access.',
      'Former Starship Entertainment building in Mapo is a fan spot for Monsta X, SISTAR alumni.',
      'FNC Entertainment (FT Island, CNBLUE, AOA alma mater) is in Hongdae area — part of indie K-pop tours.',
      'BELIFT Lab (ENHYPEN, &TEAM) is a HYBE sub-label and their Weverse shows are accessible internationally.'
    ],
    links: [
      { label: 'HYBE Insight Museum Booking', url: 'https://www.hybeinsight.com' },
      { label: 'SM Town COEX Artium', url: 'https://www.smtowncoex.com' }
    ]
  },

  'K-Pop Merch Stores': {
    overview: 'K-pop merch stores sell official albums, photobooks, photocards, light sticks and season\'s greetings. Hongdae\'s K-pop street is unique in the world — official stores side by side with fan-run photocard trading shops. Major bookstores (Kyobo, YES24) across Seoul are also key channels for albums and goods.',
    bestFor: 'K-pop fans wanting official merchandise, album hunters, photocard collectors, gift shoppers for K-pop fan friends.',
    schedule: 'Hongdae K-pop stores: 11:00–22:00 (some until midnight). Yes24 Live Hall merch: event days only. Weverse Shop: online 24 hours.',
    howto: [
      'Hongdae (홍대): K-pop street between Exit 9 and the busking area has the highest concentration of merch shops.',
      'Synnara Record (신나라 레코드) in Sinchon and Hongdae is the most comprehensive album retailer.',
      'Yes24 Live Hall (광진구 아차산로): the flagship YES24 store adjacent to the concert venue sells exclusive event merch.',
      'Weverse Shop (위버스 샵): HYBE artists\' official online store — ships internationally with good tracking.',
      'Joyland (조이랜드) in Myeongdong sells albums and photocard accessories — one-stop shop for beginners.'
    ],
    price: { range: 'Albums: ₩14,000–₩55,000 · Light sticks: ₩44,000–₩88,000 · Photocards: ₩2,000–₩50,000+ (rare/holographic)', note: 'Fan-run second-hand photocard shops (덕질샵) exist throughout Hongdae — rarer cards can be extremely valuable.' },
    tips: [
      'Buy albums at Kyobo Bookstore (교보문고) — their loyalty points (포인트) system adds real value for frequent buyers.',
      'Rare photocards (SR, holographic) are a legitimate collector\'s market — some sell for ₩500,000+.',
      'Official pop-up stores (팝업스토어) happen regularly in Hongdae and Myeongdong — follow Weverse/Twitter for announcements.',
      'Album unboxing (언박싱) culture means every purchase includes a random photocard — the lottery element drives buying.',
      'Album storage skins (앨범 슬리브) and photocard protection sleeves are purchased separately — stationery shops near Hongdae sell them.',
      'K-pop albums purchased in Korea include Hanteo Chart registration cards — these count toward official chart standings.',
      'Fanmade goods (팬메이드) from unofficial fan shops are cheaper but not official — quality varies significantly.'
    ],
    links: [
      { label: 'Weverse Shop (위버스샵)', url: 'https://shop.weverse.io' },
      { label: 'Synnara Record (신나라)', url: 'https://www.synnara.co.kr' },
      { label: 'Kyobo Bookstore (교보문고)', url: 'https://www.kyobobook.co.kr' }
    ]
  },

  'K-Drama Tours': {
    overview: 'K-drama tours take fans raised on Netflix to the real filming locations. Sites from Squid Game, Itaewon Class, Goblin, Crash Landing on You and Extraordinary Attorney Woo have become pilgrimage destinations, and specialist filming-location tour operators now run regular trips.',
    bestFor: 'K-drama fans, Netflix binge-watchers, culture enthusiasts who want to step inside the scenes they\'ve watched. All ages.',
    schedule: 'Most filming locations: outdoor sites accessible 24 hours. Tour companies operate 09:00–18:00 departures from Seoul.',
    howto: [
      'Use the K-Drama Filming Locations map on this site — 26 locations across 15 dramas with GPS coordinates.',
      'Book a guided K-drama tour via Viator, Trazy.com, or Airbnb Experiences for narrative context.',
      'Hongdae (홍대) is a recurring filming location — identifiable by its colourful walls and indie shops.',
      'Gyeongbokgung Palace: appears in Joseon-era dramas (Kingdom, Mr. Sunshine) — rent hanbok for immersive photos.',
      'Nami Island (남이섬): made globally famous by Winter Sonata — still feels cinematic in all seasons.'
    ],
    price: { range: 'Self-guided: transport costs only · Guided tour: ₩30,000–₩80,000 per person', note: 'Most outdoor filming locations are free to enter. Some require bus/metro transport (₩3,000–₩15,000 per site).' },
    tips: [
      'Bring screenshots from the drama on your phone — recreating famous scenes is the ultimate fan experience.',
      'Pohang Guryongpo Port (구룡포항) became a pilgrimage site for Hometown Cha-Cha-Cha fans — the whole village is preserved.',
      'The Ssangmun-dong neighbourhood (쌍문동) for Reply 1988 fans is worth visiting for the authentic 1980s Seoul vibe.',
      'Many filming locations have official fan photo spots (포토존) with drama-themed props.',
      'Itaewon Class DanBam bar location is still operating on Itaewon-ro — you can eat there.',
      'Crash Landing on You sparked a huge surge in Swiss tourism to Korea — the Swiss scenes were actually filmed in Nami Island.',
      'The Glory (더 글로리) fans visit Yonsei University campus — it\'s open to the public and architecturally stunning.'
    ],
    links: [
      { label: 'K-Drama Locations Map (this site)', url: 'kdrama-locations.html' },
      { label: 'Trazy K-Drama Tours', url: 'https://www.trazy.com' },
      { label: 'Visit Korea K-Drama Map', url: 'https://www.visitkorea.or.kr' }
    ]
  },

  'Gangnam Style & Dance': {
    overview: 'Gangnam, south of the Han River, is Seoul\'s wealthiest residential and commercial district — the Gangnam 3 districts concentrate Korea\'s top 1%. PSY\'s 2012 Gangnam Style, YouTube\'s first billion-view video, made it world-famous. Cheongdam\'s luxury street, Apgujeong Rodeo, COEX Mall and the plastic-surgery belt are all here.',
    bestFor: 'K-pop fans, luxury shoppers, medical tourism seekers, architecture and urban planning enthusiasts.',
    schedule: 'COEX Mall: 10:00–22:00. 청담동 boutiques: 11:00–20:00. Gangnam underground SETEC: varies by event.',
    howto: [
      'Take Line 2 subway to Gangnam Station (강남역, Exit 4) for the main commercial district.',
      'Explore COEX Mall (코엑스 몰) — the famous "Starfield Library" (별마당 도서관) open-air bookshelf installation is unmissable.',
      'Bongeunsa Temple (봉은사) directly behind COEX is a 1,200-year-old Buddhist temple — extraordinary urban-rural contrast.',
      '청담동 (Cheongdam-dong): Korea\'s most luxurious shopping street with Chanel, Hermès, Cartier and Korean designer boutiques.',
      'Garosu-gil (가로수길, Apgujeong): tree-lined street with concept stores, cafés, and independent designers — best for younger fashion.'
    ],
    price: { range: 'Free to explore. COEX exhibition halls: ₩10,000–₩20,000. Luxury brand prices standard global rates.', note: 'Gangnam restaurants and cafés are 20–40% more expensive than other Seoul districts.' },
    tips: [
      'The PSY Gangnam Style horse-dance statue near COEX is the most popular fan photo spot in Gangnam.',
      'Bongeunsa Temple (봉은사) inside Gangnam offers a free Temple Life program on weekends — extraordinary experience.',
      'Starfield Library (별마당 도서관) inside COEX is Instagram-famous and stunning — free to enter.',
      'Gangnam underground (지하상가) stretches for 3km under the main streets — labyrinthine fashion stalls at local prices.',
      'Apgujeong Rodeo Street (압구정 로데오): plastic surgery clinics on every block — this is where celebrity transformations happen.',
      'Samsung D\'light (삼성 디라이트) showroom in Seocho has free hands-on Samsung product experiences.',
      'The Gangnam area has the highest concentration of English-speaking professionals in Korea — easier to navigate without Korean.'
    ],
    links: [
      { label: 'COEX Mall (coex.co.kr)', url: 'https://www.coex.co.kr' },
      { label: 'Bongeunsa Temple (봉은사)', url: 'https://www.bongeunsa.org' }
    ]
  },

  'Norebang (Karaoke)': {
    overview: 'Norebang is Korea\'s private-room karaoke — unlike singing in front of strangers, you get a closed room just for your group. It\'s the nation\'s default social activity and the obligatory round two after dinner gatherings. Most stay open until 5am and serve drinks and snacks.',
    bestFor: 'Everyone — one of the most quintessentially Korean social experiences. Perfect for friend groups, couples, and even solo visitors at coin norebang.',
    schedule: 'Most locations: 13:00–05:00. Hongdae and Sinchon areas: 24 hours. Coin norebang (코인 노래방): open until 04:00 in most districts.',
    howto: [
      'Visit Hongdae or Sinchon for the highest concentration of norebang venues — look for the bright neon signs.',
      'Pay by the hour: ₩10,000–₩30,000 per room per hour (varies by room size, time, and location).',
      'Order tambourines and maracas (제공) — provided free and essential for full effect.',
      'Select English songs from the touchscreen book or search by artist — extensive international catalogs available.',
      'Coin norebang (코인 노래방): solo booths for ₩500–₩1,000 per song — great for solo travellers or a quick session.'
    ],
    price: { range: '₩10,000–₩30,000 per hour per room · Coin norebang: ₩500–₩1,000 per song', note: 'Larger rooms (8–15 people) are better value per person. Drinks and snacks ordered separately from in-room phone.' },
    tips: [
      'Request the "tambourine set" (탬버린 세트) when you enter — essential equipment for the full experience.',
      'Most norebang have free snacks (과자) provided with the room — soft drinks usually included.',
      'Coin norebang (코인 노래방) is perfect for solo practice or quick sessions — extremely popular among students.',
      'Score system: each song is rated — getting 100점 (perfect score) is a serious achievement.',
      'Korean party songs (신나는 노래) — 애국가 parody versions and trot (트로트) songs — are audience favourites.',
      'The "free time" (자유시간) deal after midnight is significantly cheaper per hour than the standard rate.',
      'SU Norebang chains have the most songs (200,000+) and cleanest rooms — recommended for first-timers.'
    ],
    links: [
      { label: 'Naver Map — Hongdae Norebang', url: 'https://map.naver.com' }
    ]
  },

  'Lotte World K-Pop': {
    overview: 'Lotte World in Jamsil is the world\'s largest indoor theme park, drawing 8+ million visitors a year. It combines the indoor Adventure zone with the outdoor Magic Island, plus K-pop shows, character parades and seasonal events year-round. The 555m Lotte World Tower — the world\'s fifth-tallest building — stands right next door.',
    bestFor: 'Families, K-pop fans, theme park enthusiasts, couples for the famous nighttime fireworks over Magic Island.',
    schedule: 'Adventure (Indoor): 09:30–21:00 (Fri–Sun until 22:00). Magic Island (Outdoor): 09:30–21:00. Lotte World Tower Sky Observatory: 09:30–23:00.',
    howto: [
      'Take Line 2 or 8 subway to Jamsil Station (잠실역, Exit 4) — Lotte World is directly connected.',
      'Buy tickets online in advance (lottworld.com) for discounts of 10–15% vs gate price.',
      'Ride the Atlantis (Indoor roller coaster) and Gyro Swing first — lines triple after 11:00.',
      'The night fireworks over Magic Island Lake (21:30 on weekends) are one of Seoul\'s most romantic sights.',
      'Lotte World Tower Sky Observatory (118F) is separate — check sunset times for the best views.'
    ],
    price: { range: 'Day pass (어른): ₩59,000 · After 4pm pass: ₩49,000 · Sky Observatory: ₩27,000', note: 'Lotte World Tower Mall shopping is free. Magic Island fountain show: free from the outside.' },
    tips: [
      'The "Magic Pass" app lets you book ride time slots from your phone — skip the physical queue.',
      'The parade (퍼레이드) runs daily at 15:00 and 20:00 — K-pop choreography and characters.',
      'Lotte World Tower\'s 81F SKAY 31 restaurant has the best aerial Seoul view at dinner.',
      'Lotte World Aquarium in B1 is impressive — sharks, beluga whales, and 650 species in one facility.',
      'Couples lock tradition: padlocks on Magic Island bridge (가든 브릿지) — bring your own padlock.',
      'The Halloween and Christmas seasonal events (October, December) transform the entire park — spectacular.',
      'Saturday evenings are the most crowded — Tuesday/Wednesday are the best days for short queues.'
    ],
    links: [
      { label: 'Lotte World Official (lotteworld.com)', url: 'https://www.lotteworld.com' },
      { label: 'Lotte World Tower Sky Observatory', url: 'https://www.lwt.co.kr' }
    ]
  },

  'Korean Webtoon & Anime': {
    overview: 'Webtoons are Korea\'s smartphone-native, vertical-scroll digital comics — and Naver Webtoon is the world\'s largest platform with 82 million monthly users. Tower of God, True Beauty, Solo Leveling, Hellbound and All of Us Are Dead all became global series, making K-webtoon the next Korean wave after K-drama.',
    bestFor: 'Comic and manga fans, those curious about the next K-content wave, young travellers, digital entertainment seekers.',
    schedule: 'Naver Webtoon (app): 24 hours. LINE Manga stores in Myeongdong: 10:00–22:00. Webtoon-themed cafés: 10:00–21:00.',
    howto: [
      'Download Naver Webtoon app (English interface) — hundreds of free episodes available immediately.',
      'Start with globally popular series: Solo Leveling (나 혼자만 레벨업), Tower of God (신의 탑), True Beauty (여신강림).',
      'Visit the Webtoon World in Sangam (상암동 KT&G 상상마당) for physical webtoon merchandise and exhibitions.',
      'Myeongdong and Hongdae have webtoon character merchandise shops — popular character goods sell out fast.',
      'Check Netflix Korea for webtoon-to-drama adaptations: Sweet Home, All of Us Are Dead, Hellbound.'
    ],
    price: { range: 'Webtoon reading: Free (ads) or ₩150–₩200 per fast-pass episode. Physical manhwa books: ₩6,000–₩12,000 per volume.', note: 'Naver Webtoon Coin (코인) system: 100 coins = ₩110. Monthly subscription passes available for heavy readers.' },
    tips: [
      'Solo Leveling (나 혼자만 레벨업) by Chugong became the most-read manhwa globally and was adapted into anime in 2024.',
      'Kakao Page and Naver Webtoon are the two dominant platforms — each has exclusive content.',
      'Korean manhwa physical books (만화책) at Kyobo Bookstore make excellent souvenirs with stunning cover art.',
      'Many webtoon characters have official collaborations with Korean snack brands — collectible packaging everywhere.',
      'Webtoon IP is now worth billions: studios bid to adapt popular series into dramas, films, and games.',
      'Naver Corp owns LINE Manga (Japan) — Korean webtoon dominance extends across all of East and Southeast Asia.',
      'True Beauty (여신강림) author Yaongyi holds regular fan signing events (사인회) — check Naver Webtoon for announcements.'
    ],
    links: [
      { label: 'Naver Webtoon (webtoon.com)', url: 'https://www.webtoon.com' },
      { label: 'Kakao Webtoon', url: 'https://webtoon.kakao.com' }
    ]
  }

}); // end DETAIL_DATA STEP 3 added — K-Beauty(8) + K-Pop(8)


/* ═══════════════════════════════════════════════════════
   STEP 4 — Companies (12) + History (8) + Cities (3)
   Traveler-focused: what you can actually visit & experience
═══════════════════════════════════════════════════════ */
Object.assign(window.DETAIL_DATA, {

  /* ───────── COMPANIES (12) ───────── */

  'Samsung': {
    overview: 'Samsung (삼성) is Korea\'s largest conglomerate (재벌) and the world\'s #1 smartphone and memory-chip maker. Founded in 1938 in Daegu, it now spans electronics, shipbuilding, insurance, and biotech. For visitors, Samsung is everywhere — from the flagship Galaxy stores to the Samsung d\'light experience showroom in Gangnam, Seoul.',
    bestFor: 'Tech enthusiasts, gadget shoppers, business travellers, and anyone curious about Korea\'s economic miracle.',
    schedule: 'Samsung d\'light (Seocho, Gangnam): 10:00–18:00, closed Mondays. Free entry.',
    howto: [
      'Visit Samsung d\'light flagship showroom in Samsung Town, Gangnam — free hands-on Galaxy, fold & wearable demos.',
      'Buy the latest Galaxy devices at Samsung Digital Plaza stores (cheaper than overseas, tax-refund eligible).',
      'Claim VAT refund (10%) on electronics over ₩30,000 at the airport — keep receipts.',
      'Check Galaxy Studio pop-ups in Hongdae & Seongsu for free experiential zones.',
      'Samsung Innovation Museum (S/I/M) in Suwon shows electronics history — free, reservation recommended.'
    ],
    price: { range: 'Free showrooms / Galaxy phones ₩300,000–₩2,500,000', note: 'Electronics are ~10% cheaper than abroad after VAT refund. Verify global warranty coverage before buying.' },
    tips: [
      'Korean-market phones may have a forced camera shutter sound that can\'t be disabled — ask staff before buying.',
      'Samsung Town in Gangnam is the corporate HQ — the d\'light showroom is the only public-facing part.',
      'Galaxy devices bought in Korea work worldwide but check band compatibility for your country.',
      'Olympic-themed and limited-edition Galaxy gear is often Korea-exclusive — great collector souvenirs.',
      'Samsung Card and Samsung Pay are accepted almost everywhere in Korea.',
      'For repairs, Samsung service centres are fast but signage is mostly Korean — use a translation app.'
    ],
    links: [
      { label: 'Samsung d\'light Showroom', url: 'https://www.samsung.com/sec/' },
      { label: 'Samsung Innovation Museum', url: 'https://www.samsung.com' }
    ]
  },

  'Hyundai': {
    overview: 'Hyundai Motor (현대자동차) is the world\'s 3rd-largest automaker group (with Kia), rapidly expanding into EVs (IONIQ), hydrogen, and robotics (it owns Boston Dynamics). Travellers will ride in Hyundai/Kia taxis constantly, and can explore the brand at the futuristic Hyundai Motorstudio showrooms in Seoul and Goyang.',
    bestFor: 'Car lovers, EV/tech fans, families (interactive exhibits), and design enthusiasts.',
    schedule: 'Hyundai Motorstudio Seoul (Gangnam): 09:00–18:00, closed Mondays. Free.',
    howto: [
      'Visit Hyundai Motorstudio Seoul in Gangnam — futuristic showroom with cafe, free entry.',
      'Motorstudio Goyang (near Seoul) is the largest — test drives, factory-style exhibits, kids zones.',
      'Most Korean taxis are Hyundai Sonata/Grandeur or Kia — book via Kakao T app.',
      'Spot IONIQ 5 & 6 EVs everywhere — Korea has dense, fast charging infrastructure.',
      'Hyundai Department Store (different division) is a separate luxury shopping experience worth visiting.'
    ],
    price: { range: 'Free showrooms / Coffee at Motorstudio cafe ₩5,000–₩8,000', note: 'Showrooms are free. Hyundai Department Stores are upscale retail, not car-related.' },
    tips: [
      'Don\'t confuse Hyundai Motor with Hyundai Department Store or Hyundai Heavy Industries — separate companies post-split.',
      'Motorstudio Goyang has a real assembly-line walkthrough — book ahead online.',
      'The Seoul Motorstudio rooftop and cafe are a quiet Gangnam rest stop.',
      'Hyundai/Kia EVs dominate Korean roads — a glimpse of the country\'s green-transport push.',
      'Boston Dynamics\' Spot robot is sometimes demoed at Motorstudio events.',
      'Korean-built Genesis (Hyundai\'s luxury brand) showrooms are in Gangnam — worth a look.'
    ],
    links: [
      { label: 'Hyundai Motorstudio', url: 'https://motorstudio.hyundai.com' },
      { label: 'Kakao T Taxi App', url: 'https://www.kakaocorp.com/page/service/service/KakaoT' }
    ]
  },

  'LG Electronics': {
    overview: 'LG Electronics (LG전자) is a global leader in OLED TVs, home appliances, and air solutions, part of the LG Group (재벌) founded in 1947. Visitors encounter LG through premium electronics stores and the LG Science Park in Magok, western Seoul — one of Korea\'s largest private R&D complexes.',
    bestFor: 'Home-appliance shoppers, design and tech fans, and OLED/display enthusiasts.',
    schedule: 'LG Best Shop stores: typically 10:00–20:00. LG Science Park: not generally open to public.',
    howto: [
      'Browse the latest OLED TVs and appliances at LG Best Shop flagship stores in Gangnam and Yongsan.',
      'Yongsan Electronics Market is the best place to compare LG vs Samsung products side by side.',
      'Claim VAT refund on appliances/electronics over ₩30,000 at the airport.',
      'LG\'s Signature/Objet Collection design appliances are Korea showroom highlights.',
      'Check for LG pop-up brand experiences in Seongsu-dong and Hongdae.'
    ],
    price: { range: 'Free showrooms / OLED TVs ₩1,500,000+', note: 'Confirm voltage (Korea is 220V) and global warranty before buying large appliances.' },
    tips: [
      'Korea runs on 220V/60Hz with European-style round-pin plugs — check compatibility on any purchase.',
      'Yongsan and Gangbyeon Techno Mart are huge electronics complexes for haggling.',
      'LG and Samsung are fierce rivals — staff at independent shops will compare both honestly.',
      'LG styler steam closets and OLED TVs are flagship Korea-pride products.',
      'Tax-free shopping requires your passport at the point of sale.',
      'Large appliances usually can\'t be carried as luggage — arrange international shipping if buying.'
    ],
    links: [
      { label: 'LG Electronics Korea', url: 'https://www.lge.co.kr' },
      { label: 'Yongsan Electronics Market', url: 'https://english.visitkorea.or.kr' }
    ]
  },

  'Kakao': {
    overview: 'Kakao (카카오) is Korea\'s "super app" empire built around KakaoTalk, the messenger used by 95% of Koreans. It spans taxis (Kakao T), maps, payments (Kakao Pay), banking, webtoons, and the lovable Kakao Friends characters (Ryan, Apeach, Muzi). For travellers, Kakao apps are practically essential.',
    bestFor: 'Every traveller — Kakao T (taxis), KakaoMap (navigation), and Kakao Friends fans.',
    schedule: 'Kakao Friends flagship stores (Gangnam, Hongdae, Myeongdong): 10:30–22:00.',
    howto: [
      'Install KakaoTalk to message Koreans, and Kakao T to hail taxis with an English interface.',
      'Use KakaoMap (not Google Maps) for accurate walking/transit directions in Korea.',
      'Visit the Kakao Friends flagship store in Gangnam — giant Ryan statue, exclusive merch, photo zones.',
      'Kakao Pay QR payments work at most stores once linked to a Korean account/card.',
      'Hunt limited Kakao Friends character goods — they make charming, affordable souvenirs.'
    ],
    price: { range: 'Apps free / Kakao Friends merch ₩5,000–₩60,000', note: 'Kakao T taxi fares are metered and cheaper than most countries; tipping is not expected.' },
    tips: [
      'Google Maps gives poor directions in Korea due to data restrictions — KakaoMap or Naver Map are far better.',
      'Kakao T also rents bikes, e-scooters, and offers chauffeur (대리운전) services.',
      'The Gangnam Kakao Friends store\'s giant Ryan is one of Seoul\'s top photo spots.',
      'Foreign cards may not link to Kakao Pay — carry a T-money card as backup.',
      'Kakao\'s HQ is in Jeju Island, a nod to its startup roots.',
      'Apeach (the peach character) has a dedicated themed cafe — check current pop-up locations.'
    ],
    links: [
      { label: 'Kakao Friends Store', url: 'https://store.kakaofriends.com' },
      { label: 'KakaoMap', url: 'https://map.kakao.com' }
    ]
  },

  'Naver': {
    overview: 'Naver (네이버) is Korea\'s #1 search engine and internet portal — the "Google of Korea" — also owning LINE (Japan\'s top messenger), Webtoon, and major AI/cloud platforms. Its green campus in Seongnam (Bundang) and Naver Map are part of daily Korean life.',
    bestFor: 'Travellers wanting accurate local search/reviews, webtoon fans, and tech-industry watchers.',
    schedule: 'Naver services: 24/7 online. HQ (Seongnam) is a workplace, not a tourist site.',
    howto: [
      'Use Naver Map app for the most accurate Korean navigation, transit, and place reviews.',
      'Search restaurants and cafes on Naver (not Google) — Korean reviews and blog posts are far richer.',
      'Naver Webtoon app offers hundreds of free English-translated Korean webtoons.',
      'Naver Papago is an excellent Korean translation app — better than generic tools for Korean.',
      'Naver Pay works at many online and offline Korean merchants.'
    ],
    price: { range: 'All services free', note: 'Naver search, maps, and Papago translation are free and essential travel tools.' },
    tips: [
      'Naver "blog reviews" (블로그) are how Koreans find the best local spots — use them for hidden gems.',
      'Papago handles Korean menus, signs, and conversations better than most translators.',
      'Naver Map shows real-time bus arrivals and indoor subway-station layouts.',
      'Most Korean small businesses list hours/menus on Naver Place, not Google.',
      'Naver owns Webtoon Entertainment — the source of many Netflix K-drama adaptations.',
      'Create a free Naver account to unlock map bookmarks and translation history.'
    ],
    links: [
      { label: 'Naver Map', url: 'https://map.naver.com' },
      { label: 'Papago Translator', url: 'https://papago.naver.com' }
    ]
  },

  'SK Group': {
    overview: 'SK Group (SK그룹) is Korea\'s 2nd-largest conglomerate, spanning SK Telecom (Korea\'s top mobile carrier), SK Hynix (world #2 memory chips), energy, and EV batteries. Travellers most often meet SK through SKT mobile/SIM services and the T-World stores.',
    bestFor: 'Travellers needing a SIM/eSIM, tech and semiconductor fans, business visitors.',
    schedule: 'SKT T-World & roaming centres (incl. Incheon Airport): airport branches ~07:00–22:00.',
    howto: [
      'Buy a prepaid SKT tourist SIM/eSIM at Incheon Airport arrival hall or T-World stores.',
      'SKT generally has the widest coverage — useful for rural/mountain travel.',
      'Compare SKT, KT, and LG U+ tourist data plans at airport counters before choosing.',
      'eSIM activation is instant if your phone supports it — no physical swap needed.',
      'Keep your passport handy — SIM registration is legally required in Korea.'
    ],
    price: { range: 'Tourist SIM ₩15,000–₩50,000 (5–30 days)', note: 'Unlimited-data tourist plans are common. eSIM often cheaper and bought online before arrival.' },
    tips: [
      'Pre-order an eSIM online before flying for the cheapest rates and instant airport activation.',
      'Korea has near-universal 5G and free WiFi on subways and buses.',
      'SK Hynix is a global chip giant but has no public tourist facilities.',
      'SKT\'s "T" branding appears on T-money cards (a related transit system) — convenient one-stop airport setup.',
      'Pocket WiFi rental is an alternative if travelling as a group sharing one connection.',
      'Return airport SIM counters operate late for evening arrivals.'
    ],
    links: [
      { label: 'SK Telecom Roaming', url: 'https://www.sktroaming.com' },
      { label: 'Incheon Airport SIM Guide', url: 'https://www.airport.kr' }
    ]
  },

  'Lotte': {
    overview: 'Lotte (롯데) is a retail and leisure giant spanning department stores, duty-free, hotels, and Lotte World — plus Lotte World Tower, the 5th-tallest building on Earth (555m). For travellers, Lotte means premium shopping, an indoor/outdoor theme park, and jaw-dropping city views.',
    bestFor: 'Families (theme park), shoppers (duty-free), and sightseers (tower observatory).',
    schedule: 'Lotte World: 10:00–21:00. Seoul Sky observatory: 10:00–22:00. Department stores: 10:30–20:00.',
    howto: [
      'Visit Lotte World (Jamsil) — the world\'s largest indoor theme park plus the outdoor Magic Island.',
      'Ascend Seoul Sky on Lotte World Tower floors 117–123 for a glass-floor sky deck.',
      'Shop tax-free at Lotte Duty Free (Myeongdong main branch or online) and collect at the airport.',
      'Lotte Department Store food halls (basement) are excellent for Korean delicacies and gifts.',
      'Book Lotte World and Seoul Sky tickets online in advance for discounts and skip-the-line entry.'
    ],
    price: { range: 'Lotte World 1-day ₩47,000–₩62,000 · Seoul Sky ₩27,000', note: 'Online/combo tickets and Klook discounts are significantly cheaper than gate prices.' },
    tips: [
      'Buy Lotte World tickets online — gate prices are noticeably higher.',
      'Lotte World Tower\'s Seoul Sky is best at sunset, then city lights — go ~1 hour before dusk.',
      'Lotte Duty Free online pre-order gives the lowest prices; pick up at the airport before departure.',
      'Lotte World gets very crowded on weekends — visit on a weekday morning.',
      'The aquarium and ice rink inside Lotte World Mall are great rainy-day options.',
      'Jamsil Station (Lines 2 & 8) connects directly to the entire Lotte complex.'
    ],
    links: [
      { label: 'Lotte World', url: 'https://adventure.lotteworld.com/eng/main/index.do' },
      { label: 'Seoul Sky Observatory', url: 'https://seoulsky.lotteworld.com' }
    ]
  },

  'Korean Air': {
    overview: 'Korean Air (대한항공) is Korea\'s flag carrier and one of Asia\'s largest airlines, a SkyTeam founder, hubbed at Incheon. After acquiring Asiana Airlines (2024), it became a global top-10 carrier. Many international visitors arrive in Korea on Korean Air.',
    bestFor: 'International travellers flying to/from Korea, frequent flyers, and premium-cabin seekers.',
    schedule: 'Incheon (ICN) operates 24/7. Check-in counters open ~3 hours before departure.',
    howto: [
      'Fly into Incheon (ICN) — Korean Air\'s hub and repeatedly ranked among the world\'s best airports.',
      'Use the Korean Air app for check-in, boarding passes, and SkyPass mileage.',
      'Allow time to enjoy Incheon\'s spas, capsule hotels, and culture zones on long layovers.',
      'SkyTeam status grants lounge access at Incheon\'s premium lounges.',
      'For domestic hops (e.g., to Jeju), Korean Air flies from Gimpo (GMP), not Incheon.'
    ],
    price: { range: 'Varies by route / Domestic Seoul–Jeju ₩40,000–₩90,000', note: 'Domestic flights from Gimpo to Jeju are frequent and cheap. Book the Gimpo–Jeju route well ahead in peak season.' },
    tips: [
      'Domestic flights use Gimpo (GMP), close to Seoul; international uses Incheon (ICN) — don\'t mix them up.',
      'Incheon Airport has a free transit tour for layovers over a few hours.',
      'The AREX train links Incheon and Gimpo airports to central Seoul quickly.',
      'Korean Air\'s Prestige (business) and First lounges at ICN are excellent.',
      'Budget carriers (Jeju Air, Jin Air, T\'way) serve Jeju cheaply if Korean Air is full.',
      'Arrive 3 hours early for international, 1.5 hours for domestic.'
    ],
    links: [
      { label: 'Korean Air', url: 'https://www.koreanair.com' },
      { label: 'Incheon Airport', url: 'https://www.airport.kr' }
    ]
  },

  'LG Energy Solution': {
    overview: 'LG Energy Solution (LG에너지솔루션) is the world\'s #2 EV battery maker, supplying Tesla, GM, Hyundai, and Volkswagen. Spun off from LG Chem in 2020, it symbolises Korea\'s dominance in the global battery and EV-supply-chain race. It has no tourist sites but is central to Korea\'s green-tech story.',
    bestFor: 'EV and clean-energy enthusiasts, investors, and industry-curious travellers.',
    schedule: 'Corporate/industrial — no public visitor facilities.',
    howto: [
      'See the EV future in action: Korea\'s streets are full of IONIQ, Kia EV6, and EV taxis powered by Korean batteries.',
      'Visit the Battery Industry exhibits at Seoul\'s tech expos (e.g., InterBattery, held annually at COEX).',
      'EV charging stations are widespread — a visible result of Korea\'s battery industry.',
      'Read about it at the LG Science Park context in Magok, western Seoul.',
      'Korea\'s "Big 3" battery makers (LGES, Samsung SDI, SK On) together lead the global market.'
    ],
    price: { range: 'N/A — no public attraction', note: 'Best experienced indirectly via Korea\'s dense EV and charging ecosystem.' },
    tips: [
      'COEX in Gangnam hosts InterBattery, Asia\'s largest battery expo, each spring — open to registered visitors.',
      'Korea leads the world in EV-battery patents and manufacturing capacity.',
      'Korean ride-hailing fleets are rapidly electrifying — you may ride in an EV taxi.',
      'LGES competes head-to-head with China\'s CATL for global #1.',
      'The battery boom drives Korean stock-market and job-market news constantly.',
      'For tech tourism, pair with a Hyundai Motorstudio visit to see the full EV story.'
    ],
    links: [
      { label: 'LG Energy Solution', url: 'https://www.lgensol.com' },
      { label: 'InterBattery Expo (COEX)', url: 'https://www.interbattery.or.kr' }
    ]
  },

  'Krafton / NCSOFT': {
    overview: 'Korea is a global gaming and esports superpower. Krafton created the worldwide hit PUBG (PlayerUnknown\'s Battlegrounds), while NCSOFT built the Lineage MMORPG empire. Visitors can dive into Korea\'s legendary PC bang (PC방) gaming-cafe culture and watch world-class esports live.',
    bestFor: 'Gamers, esports fans, and anyone wanting an authentic late-night Korean youth experience.',
    schedule: 'PC bangs: many open 24 hours. LoL Park (esports arena, Jongno): match days vary — book ahead.',
    howto: [
      'Play at a PC bang (PC방) — ultra-fast PCs, snacks, and ramyeon delivered to your seat for ₩1,000–2,000/hour.',
      'Watch a live League of Legends match at LoL Park in Jongno, Seoul (LCK is the world\'s top league).',
      'Visit Yongsan\'s gaming/electronics district for gear and retro arcades.',
      'Try a Korea-style multiplayer session — staff can set up English Windows on request.',
      'Check schedules for Starcraft, LoL, and PUBG tournaments during your visit.'
    ],
    price: { range: 'PC bang ₩1,000–₩2,000/hour · LoL Park tickets ₩10,000–₩30,000', note: 'PC bangs are extremely cheap; food and drinks ordered in-seat are billed to your station.' },
    tips: [
      'LoL Park (롤파크) is a pilgrimage site for esports fans — T1 (Faker\'s team) plays in the LCK here.',
      'PC bangs are a core part of Korean social life — clean, fast, and open all night.',
      'Order ramyeon and snacks directly from the PC bang screen menu.',
      'Korea\'s LCK is widely considered the strongest LoL league in the world.',
      'Many PC bangs require a phone number to log in — ask staff for a guest/tourist login.',
      'Gangnam and Hongdae have premium PC bangs with the newest hardware.'
    ],
    links: [
      { label: 'LoL Park (LCK Arena)', url: 'https://www.leagueoflegends.com' },
      { label: 'Krafton (PUBG)', url: 'https://www.krafton.com' }
    ]
  },

  'Samsung Biologics': {
    overview: 'Samsung Biologics (삼성바이오로직스) is one of the world\'s largest contract biopharmaceutical manufacturers (CDMO), based in Songdo, Incheon. It represents Korea\'s fast rise as a global biotech hub. While not a tourist site, Songdo itself is a futuristic planned smart-city worth exploring.',
    bestFor: 'Biotech/pharma professionals, smart-city enthusiasts, and architecture fans (via Songdo).',
    schedule: 'Corporate facility — no public tours. Songdo Central Park: open daily.',
    howto: [
      'Explore Songdo International Business District — Korea\'s flagship smart city near Incheon Airport.',
      'Stroll Songdo Central Park with its seawater canal and rent a water taxi or pedal boat.',
      'Visit the Tri-bowl and G-Tower for striking modern architecture.',
      'Songdo is a quick stop between Incheon Airport and Seoul — easy to add to arrival/departure day.',
      'The Incheon subway and bus connect Songdo to the airport and central Seoul.'
    ],
    price: { range: 'Songdo Central Park free / water taxi ₩4,000–₩6,000', note: 'The company has no public access; Songdo\'s parks and architecture are the visitor draw.' },
    tips: [
      'Songdo was built from reclaimed land as a model "smart city" — futuristic and uncrowded.',
      'Central Park\'s seawater canal is unique in Korea — relaxing at sunset.',
      'Korea\'s biotech (Samsung Biologics, Celltrion) is a booming global industry.',
      'Songdo is near Incheon Airport — ideal for a first or last day in Korea.',
      'Celltrion, another biotech giant, is also headquartered in Songdo.',
      'The area has international schools and a Western expat community — easy English signage.'
    ],
    links: [
      { label: 'Songdo Central Park', url: 'https://english.visitkorea.or.kr' },
      { label: 'Samsung Biologics', url: 'https://www.samsungbiologics.com' }
    ]
  },

  'POSCO': {
    overview: 'POSCO (포스코) is one of the world\'s largest and most efficient steelmakers, founded in 1968 and headquartered in Pohang on Korea\'s southeast coast. It powered Korea\'s industrialisation and is now expanding into lithium and battery materials. Pohang offers steel-industry heritage plus the easternmost cape of Korea.',
    bestFor: 'Industry and engineering enthusiasts, and travellers heading to the east coast (Pohang/Homigot).',
    schedule: 'POSCO works are industrial. Homigot Sunrise Square: open 24h, famous at dawn.',
    howto: [
      'Combine a Pohang visit with Homigot Cape — Korea\'s easternmost point and a top sunrise spot.',
      'See the iconic "Hands of Harmony" sculptures rising from the sea at Homigot.',
      'Pohang is reachable by KTX from Seoul (~2.5 hours) via Pohang Station.',
      'Try Pohang\'s famous gwamegi (half-dried herring) — a local winter delicacy.',
      'The POSCO steelworks skyline lit up at night is a striking industrial sight from afar.'
    ],
    price: { range: 'Homigot free / KTX Seoul–Pohang ₩45,000–₩53,000', note: 'Pohang is a coastal industrial city; main visitor draws are sunrise capes and fresh seafood.' },
    tips: [
      'Homigot (호미곶) hosts a huge New Year\'s sunrise festival on Jan 1 — book accommodation early.',
      'Pohang\'s Yeongildae Beach has a glowing night walkway popular with locals.',
      'POSCO is pivoting into battery materials (lithium, nickel) — a key EV supply-chain player.',
      'Pohang is the gateway to Ulleungdo Island ferries for adventurous travellers.',
      'Try local seafood at Jukdo Market, one of the east coast\'s largest fish markets.',
      'The "Hands of Harmony" — one hand on land, one in the sea — is Pohang\'s signature photo.'
    ],
    links: [
      { label: 'Homigot Sunrise Square', url: 'https://english.visitkorea.or.kr' },
      { label: 'POSCO', url: 'https://www.posco.co.kr' }
    ]
  },

  /* ───────── HISTORY (8) ───────── */

  'Joseon Dynasty': {
    overview: 'The Joseon Dynasty (조선, 1392–1897) ruled Korea for over 500 years, shaping its language (Hangul), Confucian society, art, and architecture. Its legacy is everywhere in Seoul — five grand palaces, royal shrines, and fortress walls. This is the era most "traditional Korea" experiences come from.',
    bestFor: 'History lovers, hanbok-photo seekers, and first-time visitors wanting Korea\'s royal heritage.',
    schedule: 'Gyeongbokgung: 09:00–18:00, closed Tuesdays. Guard-changing ceremony: 10:00 & 14:00.',
    howto: [
      'Start at Gyeongbokgung, the main Joseon palace, and catch the royal guard-changing ceremony.',
      'Rent a hanbok near the palace gates — wearing it grants FREE palace entry.',
      'Visit Changdeokgung and its UNESCO Secret Garden (Huwon) — book the guided garden tour ahead.',
      'See Jongmyo Shrine, where Joseon kings\' spirit tablets are enshrined (UNESCO).',
      'Walk Bukchon Hanok Village between the palaces for preserved Joseon-era homes.'
    ],
    price: { range: 'Palace entry ₩3,000 each (FREE in hanbok) · Combo ticket ₩10,000', note: 'The ₩10,000 integrated ticket covers 4 palaces + Jongmyo, valid 3 months.' },
    tips: [
      'Wearing hanbok gives free entry to all four main palaces — rentals are ₩15,000–₩30,000 for 1–4 hours.',
      'Changdeokgung\'s Secret Garden requires a separate timed ticket — reserve online early.',
      'The integrated palace ticket (₩10,000) is the best value if visiting several.',
      'Gyeongbokgung is closed Tuesdays; Changdeokgung is closed Mondays — plan accordingly.',
      'King Sejong (creator of Hangul) is the most revered Joseon ruler — his statue is in Gwanghwamun Square.',
      'Evening special night openings of the palaces (spring/autumn) are magical — tickets sell out fast.'
    ],
    links: [
      { label: 'Royal Palaces of Korea', url: 'https://www.royalpalace.go.kr' },
      { label: 'Changdeokgung Secret Garden', url: 'https://eng.cdg.go.kr' }
    ]
  },

  'Korean War & Independence': {
    overview: 'Korea\'s modern history is defined by Japanese colonial rule (1910–1945), liberation, and the Korean War (1950–1953), which divided the peninsula and still shapes the DMZ today. Powerful museums and the world\'s last Cold War border let visitors understand this profound chapter.',
    bestFor: 'History travellers, those interested in geopolitics, and DMZ-tour visitors.',
    schedule: 'War Memorial of Korea: 09:30–18:00, closed Mondays, free. DMZ tours: full-day, book ahead.',
    howto: [
      'Visit the War Memorial of Korea in Yongsan — vast, free, and deeply moving exhibits and outdoor hardware.',
      'Take a guided DMZ/JSA tour from Seoul — passport required, advance booking essential.',
      'See Seodaemun Prison History Hall to understand the independence struggle under colonial rule.',
      'Visit the Independence Hall of Korea in Cheonan for the broader liberation story.',
      'Pay respects at the National Memorial sites; many honour UN and allied forces.'
    ],
    price: { range: 'War Memorial free · DMZ tours ₩50,000–₩130,000', note: 'JSA (Panmunjom) tours cost more, require passport/dress code, and book out weeks ahead.' },
    tips: [
      'JSA/Panmunjom access changes with security conditions — confirm availability before booking.',
      'Bring your passport for any DMZ tour; strict dress codes apply at the JSA.',
      'The War Memorial\'s outdoor aircraft, tanks, and ships are free to explore — great for families.',
      'Seodaemun Prison is sobering but essential for understanding the March 1st Independence Movement.',
      'March 1 (Samiljeol) and Aug 15 (Liberation Day) are national holidays with ceremonies.',
      'Many tours combine the DMZ with the Third Infiltration Tunnel and Dora Observatory.'
    ],
    links: [
      { label: 'War Memorial of Korea', url: 'https://www.warmemo.or.kr' },
      { label: 'DMZ Tour Info', url: 'https://english.visitkorea.or.kr' }
    ]
  },

  'Silla Kingdom': {
    overview: 'The Silla Kingdom (신라, 57 BC–935 AD) unified the Korean peninsula and left a golden Buddhist legacy centred on Gyeongju — often called "the museum without walls." Royal tombs, the Bulguksa temple, and Seokguram grotto make this Korea\'s richest ancient-history destination (all UNESCO).',
    bestFor: 'Ancient-history and archaeology lovers, temple seekers, and cultural travellers.',
    schedule: 'Bulguksa: 09:00–18:00. Gyeongju National Museum: 10:00–18:00, closed some Mondays.',
    howto: [
      'Base yourself in Gyeongju (KTX to Singyeongju Station, ~2 hours from Seoul).',
      'Visit Bulguksa Temple and the Seokguram Grotto Buddha — both UNESCO masterpieces.',
      'Explore Daereungwon tomb park and enter the excavated Cheonmachong royal tomb.',
      'See the Cheomseongdae observatory — one of Asia\'s oldest astronomical structures.',
      'Tour the Gyeongju National Museum for the famous Silla gold crowns.'
    ],
    price: { range: 'Bulguksa ₩6,000 · National Museum free · Tomb park ₩3,000', note: 'Gyeongju\'s sites are clustered and cheap; rent a bike to cover the open-air monuments.' },
    tips: [
      'Gyeongju is compact and bike-friendly — rent one to circle the tombs and ponds.',
      'Donggung Palace & Wolji Pond are stunning after dark — go at night for reflections.',
      'Cherry blossoms make Gyeongju spectacular in early April — peak crowds too.',
      'Seokguram Grotto is a short bus or hike above Bulguksa — go early to beat tour groups.',
      'The Silla gold crowns in the museum are national treasures — don\'t skip them.',
      'Hwangnidan-gil is a trendy hanok cafe street for a modern break between ruins.'
    ],
    links: [
      { label: 'Gyeongju Tourism', url: 'https://www.gyeongju.go.kr/tour/eng' },
      { label: 'Bulguksa Temple', url: 'https://www.bulguksa.or.kr' }
    ]
  },

  'Goryeo Celadon': {
    overview: 'The Goryeo Dynasty (고려, 918–1392) gave Korea its English name and produced celadon (청자) — jade-green glazed pottery considered among the finest ceramics ever made. Goryeo also printed the Tripitaka Koreana woodblocks. Visitors can admire and even craft celadon today.',
    bestFor: 'Art, ceramics, and craft enthusiasts; collectors; and UNESCO-heritage seekers.',
    schedule: 'Gangjin Celadon Museum: 09:00–18:00. National Museum (Seoul): 10:00–18:00, free.',
    howto: [
      'See masterpiece celadon at the National Museum of Korea in Seoul (free admission).',
      'Visit Gangjin or Buan — historic celadon kiln towns — for museums and hands-on workshops.',
      'Try a celadon-making class to shape and glaze your own piece (shipped after firing).',
      'See the Tripitaka Koreana woodblocks at Haeinsa Temple (UNESCO) in the Gayasan mountains.',
      'Buy authentic celadon as a refined, uniquely Korean souvenir.'
    ],
    price: { range: 'National Museum free · Celadon workshop ₩20,000–₩40,000 · pieces ₩30,000+', note: 'Workshops include firing and shipping; finished pieces arrive weeks later.' },
    tips: [
      'The Gangjin Celadon Festival (summer) features kiln demos, markets, and workshops.',
      'Genuine Goryeo celadon\'s "kingfisher" jade-green glaze is nearly impossible to replicate.',
      'Haeinsa\'s Tripitaka Koreana — 80,000 woodblocks — is a serene UNESCO highlight.',
      'The National Museum of Korea is free and world-class — allow at least half a day.',
      'Inlaid (sanggam) celadon with cranes and clouds is the most prized style.',
      'Ceramics ship well — workshops handle international delivery of your fired piece.'
    ],
    links: [
      { label: 'National Museum of Korea', url: 'https://www.museum.go.kr/site/eng/home' },
      { label: 'Gangjin Celadon Museum', url: 'https://www.gangjin.go.kr' }
    ]
  },

  'Hangul Day': {
    overview: 'Hangul (한글), Korea\'s remarkably scientific alphabet, was created by King Sejong the Great in 1443 to give common people literacy. Hangul Day (한글날, October 9) is a national holiday. Visitors can learn to read Hangul in an hour and explore it at dedicated museums.',
    bestFor: 'Language learners, design/typography fans, and culture-curious travellers.',
    schedule: 'National Hangeul Museum (Yongsan): 10:00–18:00, free. Hangul Day: Oct 9 (holiday).',
    howto: [
      'Visit the National Hangeul Museum in Yongsan, Seoul — interactive, free, and beautifully designed.',
      'Learn the alphabet: just 14 consonants + 10 vowels, readable in about an hour.',
      'See King Sejong\'s statue and underground exhibit hall at Gwanghwamun Square.',
      'Try a Korean calligraphy workshop in Insadong to write your name in Hangul.',
      'Buy Hangul-design souvenirs — stationery, tees, and art prints make great gifts.'
    ],
    price: { range: 'Museums free · Calligraphy workshop ₩10,000–₩25,000', note: 'The National Hangeul Museum and Sejong exhibit are free; only craft workshops cost money.' },
    tips: [
      'Learning to read Hangul before your trip makes navigating menus and signs far easier.',
      'King Sejong is on the ₩10,000 banknote — Korea\'s most revered historical figure.',
      'Hangul is praised by linguists as one of the most logical writing systems ever invented.',
      'Gwanghwamun\'s underground "Story of King Sejong" hall is free and air-conditioned.',
      'Hangul Day (Oct 9) features festivals and free cultural events around Seoul.',
      'Insadong shops sell personalised Hangul name stamps (도장) — a popular keepsake.'
    ],
    links: [
      { label: 'National Hangeul Museum', url: 'https://www.hangeul.go.kr/eng' },
      { label: 'Sejong Story (Gwanghwamun)', url: 'https://english.visitkorea.or.kr' }
    ]
  },

  'Confucian Heritage': {
    overview: 'Confucianism (유교) shaped Joseon Korea\'s ethics, family structure, education, and etiquette — and still influences modern Korean social life (age hierarchy, respect, bowing). Visitors can explore seowon (Confucian academies, UNESCO) and witness living rituals at Jongmyo and Seonggyungwan.',
    bestFor: 'Travellers wanting to understand Korean social customs, history buffs, and UNESCO seekers.',
    schedule: 'Jongmyo Shrine: guided tours only (closed Tuesdays). Jongmyo Daeje ritual: first Sunday of May.',
    howto: [
      'Visit Jongmyo Shrine (UNESCO), the supreme Confucian royal ancestral shrine in central Seoul.',
      'Time your trip for the Jongmyo Daeje (May) — a 600-year-old royal ancestral rite with music and dance.',
      'Explore a UNESCO seowon such as Dosan Seowon near Andong (academy of scholar Yi Hwang).',
      'See Seonggyungwan, the Joseon national Confucian academy, in Seoul.',
      'Understand the etiquette: respect for elders, two-handed giving, and bowing — practise it locally.'
    ],
    price: { range: 'Jongmyo ₩1,000 · Seowon ₩2,000–₩3,000 · rituals free to watch', note: 'Jongmyo entry is guided-only on most days, with free-roam allowed on certain weekends.' },
    tips: [
      'The Jongmyo Daeje (royal ancestral ritual, May) is a UNESCO Masterpiece of living heritage.',
      'Confucian values explain Korean customs: use two hands when giving/receiving, and honour seniority.',
      'Dosan Seowon near Andong appears on the old ₩1,000 banknote.',
      'Jongmyo is usually guided-only — check times for the language of your tour.',
      'Yi Hwang (Toegye) and Yi I (Yulgok) are the two greatest Confucian scholars — both on Korean money.',
      'Pair Andong\'s seowon with Hahoe Folk Village for a full Confucian-heritage day.'
    ],
    links: [
      { label: 'Jongmyo Shrine', url: 'https://english.visitkorea.or.kr' },
      { label: 'Korean Confucian Academies (UNESCO)', url: 'https://whc.unesco.org/en/list/1498' }
    ]
  },

  'Joseon Royal Tombs': {
    overview: 'The Royal Tombs of the Joseon Dynasty (조선왕릉) are 40 burial sites of kings and queens, collectively a UNESCO World Heritage site. Set in serene forested parks around Seoul, they blend Confucian ritual landscaping with nature — peaceful, uncrowded escapes within the city.',
    bestFor: 'Nature-and-history walkers, photographers, and travellers seeking calm green spaces.',
    schedule: 'Most tombs: 06:00–18:00 (seasonal), closed Mondays. Small entry fee.',
    howto: [
      'Visit Seonjeongneung in Gangnam — royal tombs in a forest right beside the skyscrapers.',
      'Explore Donggureung (Guri), the largest cluster with nine royal tombs and forest trails.',
      'Walk the spirit path (신도) leading to each burial mound and ritual pavilion.',
      'Combine a tomb visit with a nearby palace for a full Joseon-heritage day.',
      'Bring water and walking shoes — the parks are large and wooded.'
    ],
    price: { range: '₩1,000–₩3,000 per site', note: 'Cheap, rarely crowded, and beautifully maintained — excellent value for a quiet half-day.' },
    tips: [
      'Seonjeongneung (선정릉) is the most convenient — a green oasis in the middle of Gangnam.',
      'Tombs are gorgeous in autumn foliage and spring blossoms.',
      'These are working heritage parks — keep to paths and stay respectful at ritual areas.',
      'Most tombs close Mondays — verify before visiting.',
      'The forested settings make these some of Seoul\'s best free-feeling escapes.',
      'Annual royal ancestral rites are still performed at several tombs.'
    ],
    links: [
      { label: 'Joseon Royal Tombs (UNESCO)', url: 'https://whc.unesco.org/en/list/1319' },
      { label: 'Royal Tombs Info', url: 'https://royaltombs.cha.go.kr' }
    ]
  },

  'Hwarang Warriors': {
    overview: 'The Hwarang (화랑, "flowering knights") were an elite corps of young Silla noblemen trained in martial arts, ethics, poetry, and music. Their code helped unify Korea and inspired modern Korean martial spirit. The legacy lives on around Gyeongju and in Korea\'s martial-arts and Taekwondo culture.',
    bestFor: 'Martial-arts fans, history buffs, and travellers in the Gyeongju/Silla region.',
    schedule: 'Gyeongju heritage sites: daytime. Taekwondowon (Muju) demonstrations: check schedule.',
    howto: [
      'Explore Silla heritage in Gyeongju, the Hwarang\'s homeland, alongside the royal tombs.',
      'Experience Korean martial arts at a Taekwondo demonstration or trial class in Seoul.',
      'Visit Taekwondowon in Muju — the global home of Taekwondo with shows and training.',
      'Catch a Korean martial-arts performance (some palace/tourist shows feature historical warriors).',
      'Learn the Hwarang "Five Commandments" — a window into Korean values of loyalty and honour.'
    ],
    price: { range: 'Taekwondo trial class ₩20,000–₩40,000 · Taekwondowon shows vary', note: 'Many Seoul cultural centres offer short Taekwondo experiences for tourists.' },
    tips: [
      'Taekwondo, Korea\'s Olympic martial art, carries the Hwarang spirit of discipline and honour.',
      'Gyeongju is the best place to connect Hwarang history with real Silla sites.',
      'The popular K-drama "Hwarang" dramatised these youth warriors for global fans.',
      'Taekwondowon in Muju hosts spectacular mass demonstrations and board-breaking shows.',
      'Some Seoul tourist programmes include free Taekwondo trial sessions — check VisitKorea listings.',
      'The Hwarang code emphasised loyalty, filial piety, and courage — still cultural touchstones.'
    ],
    links: [
      { label: 'Taekwondowon (Muju)', url: 'https://www.tkdwon.kr' },
      { label: 'Gyeongju Tourism', url: 'https://www.gyeongju.go.kr/tour/eng' }
    ]
  },

  /* ───────── CITIES (3) ───────── */

  'Jeonju': {
    overview: 'Jeonju (전주) is Korea\'s food and tradition capital — a UNESCO City of Gastronomy, birthplace of bibimbap, and home to 700+ preserved hanok houses. The Jeonju Hanok Village blends living heritage, street food, traditional crafts, and hanji (Korean paper) culture.',
    bestFor: 'Foodies, culture lovers, hanbok-photo seekers, and slow-travel enthusiasts.',
    schedule: 'Hanok Village: open daily (shops ~10:00–22:00). Gyeonggijeon Shrine: 09:00–18:00.',
    howto: [
      'Reach Jeonju by KTX from Seoul (~1h50m) to Jeonju Station, then bus/taxi to the Hanok Village.',
      'Eat authentic Jeonju bibimbap with 30+ toppings — the city\'s signature dish.',
      'Graze the Hanok Village street food: PNB choco pie, baguette burgers, and skewers.',
      'Rent a hanbok to stroll Gyeonggijeon Shrine and the alleyways for photos.',
      'Try a hanji (traditional paper) craft workshop and visit Jeondong Catholic Church.'
    ],
    price: { range: 'Hanbok rental ₩15,000–₩30,000 · Bibimbap ₩12,000–₩25,000', note: 'The village is free to wander; costs are food, hanbok rental, and craft workshops.' },
    tips: [
      'Stay overnight in a hanok guesthouse to enjoy the village after day-trippers leave.',
      'Makgeolli alley (막걸리 골목) serves rice wine with mountains of free side dishes.',
      'Omokdae pavilion gives the best sunset view over the hanok rooftops.',
      'PNB (Pungnyeon) bakery\'s choco pie is the city\'s most famous edible souvenir.',
      'Jeonju is an easy add-on between Seoul and the southwest coast.',
      'The Nambu Night Market (weekends) is a lively street-food highlight.'
    ],
    links: [
      { label: 'Jeonju Tourism', url: 'https://tour.jeonju.go.kr/eng' },
      { label: 'Jeonju Bibimbap Festival', url: 'https://www.jeonjubibimbap.com' }
    ]
  },

  'Jeju': {
    overview: 'Jeju Island (제주도) is Korea\'s volcanic holiday island and a UNESCO triple-crown natural site — featuring Hallasan (Korea\'s highest peak), lava-tube caves, the Seongsan Ilchulbong sunrise crater, and the famous haenyeo women divers. It\'s Korea\'s top honeymoon and nature destination.',
    bestFor: 'Nature lovers, hikers, couples, families, and beach-and-scenery seekers.',
    schedule: 'Outdoor sites open daily, daytime. Seongsan Ilchulbong: best at sunrise (opens ~07:00 seasonally).',
    howto: [
      'Fly to Jeju (CJU) — Seoul Gimpo–Jeju is the world\'s busiest air route, cheap and frequent.',
      'Hike or photograph Seongsan Ilchulbong (Sunrise Peak) at dawn — a UNESCO crater by the sea.',
      'Explore Manjanggul Lava Tube, one of the world\'s finest lava-cave systems.',
      'Summit or part-hike Hallasan, Korea\'s highest mountain (reserve permits for peak trails).',
      'Rent a car — Jeju\'s best spots are spread out and public transport is limited.'
    ],
    price: { range: 'Seoul–Jeju flight ₩40,000–₩90,000 · attractions ₩2,000–₩12,000', note: 'A rental car (₩40,000–₩70,000/day) is the most practical way to explore Jeju.' },
    tips: [
      'Rent a car — Jeju\'s scattered sights are hard to reach by bus.',
      'Hallasan\'s summit trails (Seongpanak/Gwaneumsa) need advance online reservations.',
      'Try black-pork BBQ (흑돼지) and fresh hallabong tangerines — Jeju specialities.',
      'The haenyeo (해녀) free-diving grandmothers are UNESCO living heritage — watch a demonstration.',
      'East Jeju (Seongsan) for sunrise; west (Hyeopjae) for turquoise beaches and sunsets.',
      'Weather changes fast — pack layers and a rain jacket even in summer.'
    ],
    links: [
      { label: 'Visit Jeju (Official)', url: 'https://www.visitjeju.net/en' },
      { label: 'Hallasan Reservation', url: 'https://visithalla.jeju.go.kr' }
    ]
  },

  'Andong': {
    overview: 'Andong (안동) is the heartland of Korean Confucian tradition — home to the UNESCO Hahoe Folk Village, the Andong Mask Dance, Dosan Seowon academy, and the famous Andong jjimdak (braised chicken). It offers the most authentic living-heritage experience in Korea.',
    bestFor: 'Culture and history travellers, folk-tradition seekers, and those wanting rural authenticity.',
    schedule: 'Hahoe Folk Village: 09:00–18:00. Mask Dance: weekends (and daily during the autumn festival).',
    howto: [
      'Visit Hahoe Folk Village (UNESCO) — a living Joseon-era village still inhabited today.',
      'Watch the Hahoe Byeolsingut Tal-nori mask dance, a centuries-old satirical performance.',
      'Explore Dosan Seowon, the Confucian academy of scholar Yi Hwang (on the old ₩1,000 note).',
      'Cross Woryeonggyo, Korea\'s longest wooden footbridge, lit beautifully at night.',
      'Eat Andong jjimdak (braised soy chicken) and try Andong soju, a strong distilled liquor.'
    ],
    price: { range: 'Hahoe Village ₩5,000 · Mask Dance free · Jjimdak ₩25,000–₩35,000 (serves 2–3)', note: 'Andong jjimdak portions are large and shared; the village ticket includes the mask-dance shows on performance days.' },
    tips: [
      'Time your visit for the Andong Mask Dance Festival (late September–October) — the city\'s biggest event.',
      'The mask dance is performed free on weekends outside festival season — check the schedule.',
      'Andong soju is much stronger than green-bottle soju — sip with care.',
      'Hahoe Village is a real community — be respectful of residents\' homes and privacy.',
      'Reach Andong by KTX/train from Seoul (~2 hours) to Andong Station.',
      'Pair Andong with Dosan Seowon for a complete Confucian-heritage day trip.'
    ],
    links: [
      { label: 'Andong Tourism', url: 'https://www.tourandong.com' },
      { label: 'Hahoe Folk Village', url: 'https://www.hahoe.or.kr' }
    ]
  }

}); // end DETAIL_DATA STEP 4 — Companies(12) + History(8) + Cities(3) = 23 added
