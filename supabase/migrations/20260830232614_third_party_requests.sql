-- The other half of "tracker" (CONTEXT.md): a request to a third party.
--
-- A pixel fired by image or by `sendBeacon` writes no cookie, so a store doing
-- only that came back from the scan with an empty table — the most flattering
-- possible way to be wrong about somebody.
--
-- Hosts only, never URLs. The path and the query carry the visitor's own
-- identifiers, and an audit that collects those to prove somebody else
-- collects them has lost its own argument.
alter table public.scans
  add column requests jsonb not null default '[]'::jsonb;

-- A service can be known by the cookie it writes, by the host it talks to, or
-- both — but by at least one of them, or the row names nothing.
alter table public.trackers alter column cookie_pattern drop not null;
alter table public.trackers add column host_pattern text;
alter table public.trackers add constraint trackers_match_something
  check (cookie_pattern is not null or host_pattern is not null);

update public.trackers set host_pattern = case name
  when 'Meta Pixel' then '(^|\.)facebook\.(net|com)$'
  when 'Google Analytics' then '(^|\.)google-analytics\.com$|(^|\.)analytics\.google\.com$'
  when 'Google Ads' then '(^|\.)googleadservices\.com$|(^|\.)googlesyndication\.com$'
  when 'Google DoubleClick' then '(^|\.)doubleclick\.net$'
  when 'TikTok' then '(^|\.)tiktok\.com$|(^|\.)byteoversea\.com$'
  when 'Hotjar' then '(^|\.)hotjar\.(com|io)$'
  when 'Microsoft Clarity' then '(^|\.)clarity\.ms$'
  when 'Microsoft Ads' then '(^|\.)bat\.bing\.com$'
  when 'LinkedIn' then '(^|\.)linkedin\.com$|(^|\.)licdn\.com$'
  when 'Pinterest' then '(^|\.)pinterest\.com$|(^|\.)pinimg\.com$'
  when 'Reddit' then '(^|\.)reddit\.com$|(^|\.)redditstatic\.com$'
  when 'Criteo' then '(^|\.)criteo\.(com|net)$'
  when 'Hubspot' then '(^|\.)hubspot\.com$|(^|\.)hs-scripts\.com$|(^|\.)hs-analytics\.net$'
  when 'RD Station' then '(^|\.)rdstation\.com(\.br)?$'
  when 'Segment' then '(^|\.)segment\.(com|io)$'
  when 'Yandex Metrica' then '(^|\.)mc\.yandex\.(ru|com)$'
  when 'Snapchat' then '(^|\.)snapchat\.com$|(^|\.)sc-static\.net$'
  when 'VWO' then '(^|\.)visualwebsiteoptimizer\.com$'
  when 'Mixpanel' then '(^|\.)mixpanel\.com$'
  when 'Amplitude' then '(^|\.)amplitude\.com$'
end;

-- Known only by the host they talk to: these ship no cookie of their own.
insert into public.trackers (name, host_pattern) values
  ('Google Tag Manager', '(^|\.)googletagmanager\.com$'),
  ('Google Fonts', '(^|\.)fonts\.(googleapis|gstatic)\.com$'),
  ('Hotjar (CDN)', '(^|\.)hotjar\.io$'),
  ('Meta (CDN)', '(^|\.)fbcdn\.net$'),
  ('Cloudflare Insights', '(^|\.)cloudflareinsights\.com$'),
  ('New Relic', '(^|\.)nr-data\.net$|(^|\.)newrelic\.com$'),
  ('Taboola', '(^|\.)taboola\.com$'),
  ('Outbrain', '(^|\.)outbrain\.com$'),
  ('Bing', '(^|\.)bing\.com$'),
  ('Twitter/X', '(^|\.)ads-twitter\.com$|(^|\.)t\.co$');
