-- Migration 009: update accept_invitation to return workspace name + inviter display name
-- These are shown in the welcome modal after a user successfully joins a workspace.

create or replace function public.accept_invitation(invite_token uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_invite        public.invitations;
  v_workspace_name text;
  v_inviter_name  text;
begin
  select * into v_invite
  from public.invitations
  where token = invite_token
    and accepted_at is null
    and expires_at > now();

  if not found then
    raise exception 'Invitation not found or has expired';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_invite.workspace_id, auth.uid(), v_invite.role)
  on conflict (workspace_id, user_id) do nothing;

  update public.invitations
  set accepted_at = now()
  where token = invite_token;

  -- Workspace name
  select name into v_workspace_name
  from public.workspaces
  where id = v_invite.workspace_id;

  -- Inviter display name: "First Last" → email username fallback
  select coalesce(
    nullif(trim(concat(p.first_name, ' ', p.last_name)), ''),
    split_part(u.email, '@', 1)
  ) into v_inviter_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = v_invite.invited_by;

  return jsonb_build_object(
    'workspace_id',    v_invite.workspace_id,
    'workspace_name',  v_workspace_name,
    'invited_by_name', v_inviter_name
  );
end;
$$;
