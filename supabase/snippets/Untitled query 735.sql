create policy "Allow public report submissions"
on public.reports
for insert
to anon, authenticated
with check (true);