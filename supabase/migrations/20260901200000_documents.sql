-- O documento que a loja publica, e a versão a que uma revisão se prende.
--
-- Three tables for what looks like one thing, and the split is ADR-0003. The
-- controller is data somebody types and edits; the document is an identity
-- ("a política desta loja"); the version is a frozen text. A single table would
-- make the third impossible, and the third is the one the whole legal review
-- module hangs from.

-- Quem responde pela loja, dito uma vez e reusado em tudo que ela gera.
--
-- Per store, not per organization, and that is the case an agency makes: forty
-- client shops are forty different companies, and the CNPJ in a policy is a
-- fact about the shop, never about whoever is auditing it.
--
-- Not on `stores` for the same reason `consent_banners` is not: a store is an
-- identity our server recorded from an address, and this is a form a person
-- filled in. A missing row is a company nobody has typed yet, which is the
-- common case and needs no row at all.
create table public.controllers (
  store_id uuid primary key references public.stores (id) on delete cascade,

  -- Razão social, CNPJ, endereço, contato, encarregado. Read whole by one
  -- screen and written whole by one action; the shape and its validation live
  -- in `packages/document`, which is also where a missing field becomes a
  -- visible gap in the generated text instead of an invented fact.
  details jsonb not null default '{}'::jsonb,

  updated_at timestamptz not null default now()
);

alter table public.controllers enable row level security;

create policy "members read controllers of their own stores"
  on public.controllers for select to authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_id and public.is_member_of(s.organization_id)
    )
  );

-- O documento: a política desta loja, os termos desta loja. Um de cada.
--
-- Carries no text of its own. It exists so that the versions have something to
-- be versions of, and so "a política de casadobolo.com.br" is one thing across
-- every regeneration of it.
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  kind text not null check (kind in ('privacy_policy', 'terms_of_use')),
  created_at timestamptz not null default now(),

  unique (store_id, kind)
);

create index documents_store_id_idx on public.documents (store_id);

alter table public.documents enable row level security;

create policy "members read documents of their own stores"
  on public.documents for select to authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_id and public.is_member_of(s.organization_id)
    )
  );

-- A versão: o estado imutável do documento num instante (CONTEXT.md).
--
-- The unit a legal review refers to, and the reason it can refer to anything at
-- all: regenerating creates another version, which neither inherits nor
-- invalidates the review of this one. Editing the text in place would move the
-- object out from under the lawyer, which is exactly what ADR-0003 refused.
create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,

  -- v1, v2, v3 — what the person calls it. Sequential per document, assigned by
  -- the server inside the same transaction that inserts the row.
  number integer not null,

  -- The text, whole. Not a diff against the previous one: a version that can
  -- only be read by replaying its ancestors is a version that stops being
  -- readable the day one of them is lost.
  body text not null,

  -- The company as it was when this was written. A copy, not a reference: the
  -- owner corrects the CNPJ next week, and this version has to keep saying what
  -- the lawyer read.
  company jsonb not null default '{}'::jsonb,

  -- The reading whose trackers this text names, so the document's own claim
  -- about the shop can be traced back to the browser that observed it.
  -- `on delete set null` because a scan expires and a published document does
  -- not stop being published.
  scan_id uuid references public.scans (id) on delete set null,

  created_at timestamptz not null default now(),

  -- When a person said they had read it. Null means nobody has, and nothing
  -- goes on a storefront in that state — the one column here that is meant to
  -- change, and the immutability trigger below knows it.
  approved_at timestamptz,

  unique (document_id, number)
);

create index document_versions_document_id_idx
  on public.document_versions (document_id, number desc);

alter table public.document_versions enable row level security;

create policy "members read versions of their own documents"
  on public.document_versions for select to authenticated
  using (
    exists (
      select 1
      from public.documents d
      join public.stores s on s.id = d.store_id
      where d.id = document_id and public.is_member_of(s.organization_id)
    )
  );

-- A imutabilidade, imposta pelo banco.
--
-- No table here has an update policy, so nothing a browser sends could rewrite
-- a version already. This is about the other hand: ours. The server writes with
-- the service role, and one careless `update` in a route six months from now
-- would silently change a text a lawyer had reviewed and a shop had published.
--
-- Approval is the exception, and the only one: it records that a person read
-- the text, which cannot be known when the text is written.
create function public.keep_version_immutable()
returns trigger
language plpgsql
as $$
begin
  if (new.document_id, new.number, new.body, new.company, new.scan_id, new.created_at)
     is distinct from
     (old.document_id, old.number, old.body, old.company, old.scan_id, old.created_at)
  then
    raise exception
      'a versão de documento % é imutável (ADR-0003); gere uma versão nova',
      old.id;
  end if;

  return new;
end;
$$;

revoke execute on function public.keep_version_immutable()
  from public, anon, authenticated;

create trigger document_versions_are_immutable
  before update on public.document_versions
  for each row execute function public.keep_version_immutable();

-- No insert, update or delete policies on any of the three, as everywhere else
-- in this database. They are written by server actions that have already
-- established membership by reading the store through RLS.
