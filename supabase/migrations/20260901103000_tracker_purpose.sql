-- Why a service is on the page, which is the only thing that decides whether
-- the consent banner may hold it back.
--
-- Naming a cookie was enough while the product only reported. A banner has to
-- act, and acting needs one distinction the table never carried: `_ga` and
-- `fonts.googleapis.com` are both named services, and blocking the first
-- before consent is the whole point while blocking the second takes the shop's
-- typography down and gates nothing. Purpose is what tells them apart.
--
-- Three values, because that is what a preferences panel can honestly offer:
--
--   `essential`  the shop's own plumbing. Never blocked, never offered as a
--                choice — a checkbox that cannot be unticked is theatre.
--   `analytics`  measuring the visitor. Blocked until consent.
--   `marketing`  advertising and profiling. Blocked until consent.
--
-- Still not a judgement, same as the rest of this table (see `trackers`):
-- purpose says what a service is for, never whether it should be there.
alter table public.trackers
  add column purpose text not null default 'marketing'
  check (purpose in ('essential', 'analytics', 'marketing'));

-- Measuring the visitor rather than selling to them. Session recording, A/B
-- testing and RUM land here too: they are about the person's session, so a
-- panel that calls them necessary would be calling a choice a requirement.
update public.trackers set purpose = 'analytics' where name in (
  'Google Analytics',
  'Hotjar',
  'Hotjar (CDN)',
  'Microsoft Clarity',
  'Segment',
  'Yandex Metrica',
  'VWO',
  'Mixpanel',
  'Amplitude',
  'Cloudflare Insights',
  'New Relic'
);

-- The shop's own plumbing. Blocking this before consent breaks the shop the
-- visitor came to, and buys them nothing: a typeface asks no question.
update public.trackers set purpose = 'essential' where name in (
  'Google Fonts'
);

-- Everything else stays `marketing`, the column's default, which is the
-- direction this default was chosen to err in: a service added to the table
-- tomorrow and forgotten today is held back until somebody says yes, rather
-- than firing because nobody classified it.
--
-- Google Tag Manager is the row worth reading twice. A container is neither
-- audience nor advertising — it is how both arrive — and it sits under
-- `marketing` because whichever of the two toggles gates it, the error runs
-- the same way: the container does not load, and the tags inside it do not
-- fire. Nothing is let through by the choice, which is the only direction an
-- audit tool may be wrong in. The tags it would have injected stay blocked by
-- their own hosts regardless, so the purpose here decides when the container
-- may load and nothing else.
