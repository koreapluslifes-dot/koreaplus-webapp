// Single source of truth for generated-page languages (build-seo.cjs content modules).
// Order = en first, then the LOCALES set. Add a NEW language here ONCE — every
// content module that `require('./seo-langs.cjs')` picks it up automatically, so a
// new locale can no longer be silently dropped by a module's private hardcoded list.
// NOTE: a language must have its translations/l10n present before being added, or
// its pages render as English fallback. Keep in sync with build-seo.cjs LOCALES.
module.exports = ['en', 'ja', 'zh', 'es', 'ko', 'fr', 'de', 'pt', 'id'];
