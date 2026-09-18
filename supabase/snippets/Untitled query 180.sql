drop policy "Allow authenticated admin updates"
on public.reports;

create policy "Allow only admin updates"
on public.reports
for update
to authenticated
using (
  auth.uid() = 'ab24c5b5-2e92-4ab2-9179-28349a9a95a9'
)
with check (
  auth.uid() = 'ab24c5b5-2e92-4ab2-9179-28349a9a95a9'
);