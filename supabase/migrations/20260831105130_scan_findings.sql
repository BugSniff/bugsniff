-- The audit's output, at last: an observed fact plus the norm that addresses it.
--
-- Only findings the validator approved are ever written here. A rejected one is
-- not stored and not shown — publishing it is exactly what the validator exists
-- to prevent (ADR-0001), and a rejected finding kept "for reference" is one
-- careless join away from being published anyway.
--
-- Denormalised into the scan on purpose. A finding has no life apart from the
-- reading that produced it: it is not edited, not reassigned, and never queried
-- across scans. A table would buy a foreign key and cost a join on every read.
alter table public.scans
  add column findings jsonb not null default '[]'::jsonb;
