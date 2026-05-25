import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useMembers(workspaceId) {
  const [members, setMembers]       = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading]       = useState(true)

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return
    const { data, error } = await supabase
      .from('workspace_members_view')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true })

    if (!error && data) setMembers(data)
    setLoading(false)
  }, [workspaceId])

  const fetchInvitations = useCallback(async () => {
    if (!workspaceId) return
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (data) setInvitations(data)
  }, [workspaceId])

  useEffect(() => {
    fetchMembers()
    fetchInvitations()
  }, [fetchMembers, fetchInvitations])

  const inviteMember = async ({ email, role = 'member', workspaceName = '' }) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('invitations')
      .insert({ workspace_id: workspaceId, email, role, invited_by: user.id })
      .select()
      .single()
    if (error) throw error
    setInvitations(prev => [data, ...prev])

    // Fire-and-forget — email failure doesn't break the invite
    const inviteUrl = `${window.location.origin}/invite/${data.token}`
    supabase.functions.invoke('send-invite-email', {
      body: { email, inviteUrl, workspaceName, role },
    }).catch(console.error)

    return data
  }

  const removeMember = async (userId) => {
    const { error } = await supabase.rpc('remove_member', {
      p_workspace_id: workspaceId,
      p_user_id: userId,
    })
    if (error) throw error
    setMembers(prev => prev.filter(m => m.user_id !== userId))
  }

  return { members, invitations, loading, inviteMember, removeMember, refetch: fetchMembers }
}
