-- The scan tells three things apart now, and a boolean could only hold two.
--
-- `false` used to mean "we did not click", and that covered two opposite
-- facts: a store that asks nothing — the strongest observation this audit can
-- make — and a banner the scan could not answer, which is a falsely clean
-- result. Only the first is something to report.
create type public.consent_banner_state as enum (
  -- Found and accepted. The only one confirmed by interaction.
  'accepted',
  -- Something asks, and the scan could not answer it. A queue, not a finding.
  'unrecognised',
  -- Our browser found nothing that asks. The screenshot is what backs it.
  'not-found'
);

-- `null` stays `null`: the scans that predate the two states were read once,
-- and a CASE with no ELSE is how that is said in SQL.
alter table public.scans
  alter column consent_banner type public.consent_banner_state
  using case consent_banner
    when true then 'accepted'::public.consent_banner_state
    when false then 'not-found'::public.consent_banner_state
  end;

-- Which consent platform left its trace. Not proof that a banner was shown:
-- these are configured per country, and one set up for Europe loads its script
-- here and never asks anything. It says which vendor the review queue should
-- go and teach the scan about.
alter table public.scans add column consent_platform text;

-- Where the screenshot of the pre-consent screen lives, in the private
-- `scan-evidence` bucket. Only a picture confirms "this store asks nothing";
-- the machine can only say it did not find one.
alter table public.scans add column evidence_path text;
