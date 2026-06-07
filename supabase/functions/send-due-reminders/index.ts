import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Validate the shared secret so only our pg_cron job can trigger this
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const resendKey   = Deno.env.get('RESEND_API_KEY') ?? ''
  const appUrl      = Deno.env.get('APP_URL') ?? 'https://taskmaster-pro.netlify.app'

  if (!serviceKey || !resendKey) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Service role bypasses RLS so we can read all workspaces
  const supabase = createClient(supabaseUrl, serviceKey)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0] // YYYY-MM-DD

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, text, workspace_id, workspaces(name)')
    .eq('due_date', tomorrowStr)
    .neq('status', 'done')

  if (tasksError) {
    return new Response(JSON.stringify({ error: tasksError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!tasks || tasks.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, message: 'No tasks due tomorrow' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Group tasks by workspace
  const byWorkspace: Record<string, typeof tasks> = {}
  for (const task of tasks) {
    if (!byWorkspace[task.workspace_id]) byWorkspace[task.workspace_id] = []
    byWorkspace[task.workspace_id].push(task)
  }

  let emailsSent = 0

  for (const [workspaceId, workspaceTasks] of Object.entries(byWorkspace)) {
    const workspaceName = (workspaceTasks[0].workspaces as { name: string } | null)?.name ?? 'your workspace'

    // Join workspace_members with profiles to filter by email-reminder preference
    const { data: memberRows } = await supabase
      .from('workspace_members')
      .select('user_id, profiles(email, preferences)')
      .eq('workspace_id', workspaceId)

    // Exclude members who have explicitly opted out of email reminders
    const members = (memberRows ?? [])
      .map(r => r.profiles as { email: string; preferences: Record<string, unknown> } | null)
      .filter(p => p?.email && p?.preferences?.['emailReminders'] !== false)

    if (!members || members.length === 0) continue

    const count       = workspaceTasks.length
    const taskListHtml = workspaceTasks.map(t => `<li>${t.text}</li>`).join('')
    const subject     = `${count} task${count > 1 ? 's' : ''} due tomorrow in ${workspaceName}`

    for (const { email } of members as { email: string }[]) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Taskmaster Pro <reminders@resend.dev>',
          to: [email],
          subject,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
              <h2 style="margin:0 0 16px">Tasks due tomorrow</h2>
              <p style="margin:0 0 16px;color:#444">
                The following task${count > 1 ? 's are' : ' is'} due tomorrow
                in <strong>${workspaceName}</strong>:
              </p>
              <ul style="margin:0 0 24px;padding-left:20px;color:#111">
                ${taskListHtml}
              </ul>
              <a href="${appUrl}"
                 style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;
                        padding:12px 24px;border-radius:6px;font-weight:600">
                Open board
              </a>
              <p style="margin:24px 0 0;color:#888;font-size:13px">
                You're receiving this because you're a member of ${workspaceName} on Taskmaster Pro.
              </p>
            </div>
          `,
        }),
      })

      if (res.ok) emailsSent++
    }
  }

  return new Response(JSON.stringify({ sent: emailsSent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
