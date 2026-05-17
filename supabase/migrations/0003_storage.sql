-- 0003_storage.sql
-- Storage buckets and policies.

insert into storage.buckets (id, name, public)
values
  ('empreendimentos', 'empreendimentos', true),
  ('unidades', 'unidades', true),
  ('arquivos', 'arquivos', false)
on conflict (id) do nothing;

-- empreendimentos bucket: public read, admin write
create policy "empreendimentos read public" on storage.objects
  for select using (bucket_id = 'empreendimentos');
create policy "empreendimentos admin write" on storage.objects
  for insert with check (bucket_id = 'empreendimentos' and public.is_admin());
create policy "empreendimentos admin update" on storage.objects
  for update using (bucket_id = 'empreendimentos' and public.is_admin());
create policy "empreendimentos admin delete" on storage.objects
  for delete using (bucket_id = 'empreendimentos' and public.is_admin());

-- unidades bucket: public read, admin write
create policy "unidades read public" on storage.objects
  for select using (bucket_id = 'unidades');
create policy "unidades admin write" on storage.objects
  for insert with check (bucket_id = 'unidades' and public.is_admin());
create policy "unidades admin update" on storage.objects
  for update using (bucket_id = 'unidades' and public.is_admin());
create policy "unidades admin delete" on storage.objects
  for delete using (bucket_id = 'unidades' and public.is_admin());

-- arquivos bucket: logged users read, admin write
create policy "arquivos read logged" on storage.objects
  for select using (bucket_id = 'arquivos' and auth.uid() is not null);
create policy "arquivos admin write" on storage.objects
  for insert with check (bucket_id = 'arquivos' and public.is_admin());
create policy "arquivos admin delete" on storage.objects
  for delete using (bucket_id = 'arquivos' and public.is_admin());
