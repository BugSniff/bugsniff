-- Every e-mail typed into the scan form becomes a user, because signInWithOtp
-- creates the account when the link is requested and not when it is clicked —
-- and the trigger on auth.users gives each one an organization on the way
-- through. A thousand addresses typed by someone bored is a thousand
-- organizations.
--
-- Blocking that at the edge is imperfect: an IP rule cannot tell a bored person
-- from an office behind one address. Deleting is exact. Whoever never clicked a
-- link never proved the address was theirs, and after three days they are not
-- coming.
--
-- With magic link there is no other way in, so `email_confirmed_at` being null
-- means precisely "never opened a link". Someone already confirmed who requests
-- a link and ignores it is untouched.
--
-- Deleting the user is all it takes: the member row cascades, the trigger from
-- ADR-0004 sees the owner leave and takes the organization, and the
-- organization takes its scans.
create extension if not exists pg_cron;

select cron.schedule(
  'delete-unconfirmed-accounts',
  '17 4 * * *',
  $$
    delete from auth.users
    where email_confirmed_at is null
      and created_at < now() - interval '3 days'
  $$
);
