create policy "Allow public report viewing"
on public.reports
for select
to anon, authenticated
using (true);