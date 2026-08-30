-- The other half of the audit.
--
-- The readings say what the store does. The policy says what the store
-- declares it does. The whole product is the distance between the two, and
-- until now only one side of it was being recorded.
create type public.policy_state as enum (
  -- Found, opened, and long enough to be a policy.
  'found',
  -- No link we could follow from the home page. NOT the same as "this store
  -- has no policy": it is our browser failing to find, never the store failing
  -- to publish, and the screen has to keep saying it that way.
  'not-found',
  -- The link is there and what it opens is not text we can read.
  'unreadable'
);

alter table public.scans
  add column policy_state public.policy_state,
  add column policy_url text,
  -- Kept whole. A finding cites the passage that addresses the fact, and a
  -- summary cannot be cited: the excerpt has to be verbatim from a source we
  -- actually hold (ADR-0001, and the validator built on it).
  add column policy_text text;
