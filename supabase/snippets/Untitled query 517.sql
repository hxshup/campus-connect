create policy "Allow authenticated admin updates"
on public.reports
for update
to authenticated
using (true)
with check (true);
