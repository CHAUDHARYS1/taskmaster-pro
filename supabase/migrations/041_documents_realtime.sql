-- Enable Realtime for documents so all workspace members see live list updates
alter publication supabase_realtime add table public.documents;
