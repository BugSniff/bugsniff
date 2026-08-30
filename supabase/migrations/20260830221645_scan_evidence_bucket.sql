-- Where the screenshots live.
--
-- Private, like everything else here. The object is evidence about somebody
-- else's store, taken by our browser: it belongs to the scan that produced it
-- and to nobody who happens to guess a URL.
insert into storage.buckets (id, name, public)
values ('scan-evidence', 'scan-evidence', false)
on conflict (id) do nothing;

-- The object is named after the scan, so the scan's own rule is the one being
-- asked — the same shape as every other read in this database, scoped to the
-- caller's organizations. An unclaimed scan matches no policy and its
-- screenshot is therefore readable by nobody through the API.
create policy "members read evidence of their own scans"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'scan-evidence'
    and exists (
      select 1
      from public.scans
      where public.scans.id::text = split_part(storage.objects.name, '.', 1)
        and public.scans.organization_id is not null
        and public.is_member_of(public.scans.organization_id)
    )
  );

-- No insert, update or delete policy, as everywhere else: screenshots are
-- written by the worker with the service role. A screenshot is what our own
-- browser saw, not something a visitor may assert.
--
-- ponytail: nothing deletes these when a scan expires, the same debt the
-- `scans` table already carries for its own rows. The daily job that clears
-- expired scans clears their objects in the same pass — worth writing once
-- either of them actually starts accumulating.
