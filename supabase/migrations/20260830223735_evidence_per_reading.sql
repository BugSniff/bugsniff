-- Every reading keeps its screen, not only the ones that went wrong.
--
-- The picture of a store that asks — banner up, trackers already fired — is
-- the strongest thing a report can show, and it only exists on the scans that
-- went right. So there are two now, one per reading.
alter table public.scans rename column evidence_path to evidence_pre_path;
alter table public.scans add column evidence_post_path text;

-- Objects move from `<scan>.jpg` to `<scan>/<reading>.jpg`, so the rule reads
-- the folder instead of the file name. Same rule as before, one separator over:
-- the object resolves back to its scan, and the scan says who may look.
drop policy "members read evidence of their own scans" on storage.objects;

create policy "members read evidence of their own scans"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'scan-evidence'
    and exists (
      select 1
      from public.scans
      where public.scans.id::text = split_part(storage.objects.name, '/', 1)
        and public.scans.organization_id is not null
        and public.is_member_of(public.scans.organization_id)
    )
  );

-- The handful of screenshots taken under the flat layout are unreachable under
-- the new rule, so the rows stop pointing at them. The objects themselves are
-- the same storage-cleanup debt the bucket already carries.
update public.scans
set evidence_pre_path = null
where evidence_pre_path is not null
  and evidence_pre_path not like '%/%';
