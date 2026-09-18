create policy "Allow public report status updates"
on public.reports
for update
to anon, authenticated
using (true)
with check (true);
