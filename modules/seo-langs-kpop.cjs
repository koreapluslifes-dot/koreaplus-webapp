// Generated-page languages for the K-POP CHANNEL ONLY (kpop-* content modules).
// The K-pop clusters ship 5 languages the travel side does not: ar (RTL), hi,
// ru, vi, th. They live here and NOT in seo-langs.cjs because that list is also
// consumed by travel modules (seo-festivals.cjs, seo-seasoncity.cjs) which have
// no translations for these codes — appending there emits English-shell pages
// under /guide/ar/… that the travel build never localizes.
// Same rule as seo-langs.cjs: a language belongs here only once its K-pop
// translations exist, and build-seo.cjs must carry an L10N[lang].dir entry for
// it (the modules build every URL from that dir, never from a hardcoded path).
module.exports = [...require('./seo-langs.cjs'), 'ar', 'hi', 'ru', 'vi', 'th'];
