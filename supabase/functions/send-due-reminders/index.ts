import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NUMBER_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']

type DueStatus = 'overdue' | 'today' | 'tomorrow'

interface Task {
  id: string
  text: string
  workspace_id: string
  workspaces: { name: string } | null
  dueStatus: DueStatus
}

function taskRow(text: string, workspaceName: string, status: DueStatus): string {
  const cfg = {
    overdue:  { border: '#b91c1c', color: '#b91c1c', bg: 'rgba(185,28,28,0.10)',  label: 'Overdue' },
    today:    { border: '#92400e', color: '#92400e', bg: 'rgba(146,64,14,0.10)',   label: 'Due today' },
    tomorrow: { border: '#92400e', color: '#92400e', bg: 'rgba(146,64,14,0.10)',   label: 'Tomorrow' },
  }[status]

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
    <tr>
      <td style="background-color:#ffffff; border:1px solid #eeeeee; border-left:3px solid ${cfg.border}; border-radius:5px; padding:14px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;">
              <p style="margin:0 0 4px; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:15px; font-weight:700; color:#1a1a1a;">${text}</p>
              <p style="margin:0; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:13px; color:#666666;">${workspaceName}</p>
            </td>
            <td align="right" style="vertical-align:middle; white-space:nowrap; padding-left:12px;">
              <span style="display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:11px; font-weight:500; color:${cfg.color}; background-color:${cfg.bg}; padding:4px 9px; border-radius:3px;">${cfg.label}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

function buildHtml(opts: {
  workspaceName: string
  tasks: Task[]
  appUrl: string
  markUrl: string
}): string {
  const { workspaceName, tasks, appUrl, markUrl } = opts
  const count = tasks.length
  const taskWord = count <= 10 ? NUMBER_WORDS[count] : `${count}`
  const taskLabel = count === 1 ? 'task' : 'tasks'
  const hasOverdue = tasks.some(t => t.dueStatus === 'overdue')

  const taskRowsHtml = tasks
    .map(t => taskRow(t.text, t.workspaces?.name ?? workspaceName, t.dueStatus))
    .join('\n')

  const preheader = hasOverdue
    ? `${count} ${taskLabel} need your attention in ${workspaceName} — including overdue items.`
    : `${count} ${taskLabel} coming due in ${workspaceName}. Here's what needs you.`

  const heroLine2 = hasOverdue ? 'Needs your attention.' : 'Due soon.'

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Tasks due soon</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a { text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .tm-container { width: 100% !important; }
      .tm-px { padding-left: 24px !important; padding-right: 24px !important; }
      .tm-hero-h1 { font-size: 32px !important; line-height: 1.1 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f7;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#f5f5f7; opacity:0;">
    ${preheader}
  </div>
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f7;">
    <tr>
      <td align="center" style="padding:32px 16px 48px;">

        <table role="presentation" class="tm-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Logo header -->
          <tr>
            <td class="tm-px" style="padding:8px 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle; padding-right:12px;">
                    <img src="${markUrl}" width="34" height="34" alt="Taskmaster Pro" style="display:block; width:34px; height:34px; border-radius:8px;">
                  </td>
                  <td style="vertical-align:middle; white-space:nowrap; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:19px; font-weight:700; letter-spacing:-0.3px; color:#1a1a1a;">
                    Taskmaster<span style="color:#2563EB;">&nbsp;Pro</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border:1px solid #eeeeee; border-radius:5px; box-shadow:0 1px 3px rgba(0,0,0,0.06);">

                <tr>
                  <td class="tm-px" style="padding:44px 48px 0;">
                    <p style="margin:0 0 16px; font-family:'IBM Plex Mono',monospace; font-size:11px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:#92400e;">Due soon</p>
                    <h1 class="tm-hero-h1" style="margin:0; font-family:'Instrument Serif',Georgia,'Times New Roman',serif; font-size:40px; font-weight:400; line-height:1.08; letter-spacing:-0.5px; color:#1a1a1a;">
                      ${taskWord} ${taskLabel}.<br><span style="font-style:italic; color:#2563EB;">${heroLine2}</span>
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td class="tm-px" style="padding:22px 48px 0;">
                    <p style="margin:0; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:16px; line-height:1.6; color:#444444;">
                      A heads-up on what's coming due in <strong style="color:#1a1a1a;">${workspaceName}</strong>. Knock them out, or nudge the date if plans changed.
                    </p>
                  </td>
                </tr>

                <!-- Task list -->
                <tr>
                  <td class="tm-px" style="padding:24px 48px 0;">
                    ${taskRowsHtml}
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="tm-px" style="padding:28px 48px 44px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#2563EB" style="border-radius:5px;">
                          <a href="${appUrl}" style="display:inline-block; padding:14px 28px; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:15px; font-weight:600; line-height:1; color:#ffffff; text-decoration:none; border-radius:5px;">Open my board&nbsp;&rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="tm-px" style="padding:28px 48px 8px;">
              <p style="margin:0 0 6px; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:#888888;">
                You're receiving this because you're a member of ${workspaceName} on Taskmaster Pro.
              </p>
              <p style="margin:14px 0 0; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:12px; line-height:1.6; color:#888888;">
                Taskmaster Pro<br>
                <a href="${appUrl}/settings" style="color:#888888; text-decoration:underline;">Notification settings</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="${appUrl}/settings" style="color:#888888; text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}

serve(async (req) => {
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

  const supabase = createClient(supabaseUrl, serviceKey)

  const now = new Date()
  const todayStr     = now.toISOString().split('T')[0]
  const tomorrowDate = new Date(now)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowStr  = tomorrowDate.toISOString().split('T')[0]

  const [overdueRes, todayRes, tomorrowRes] = await Promise.all([
    supabase.from('tasks').select('id, text, workspace_id, workspaces(name)').lt('due_date', todayStr).neq('status', 'done'),
    supabase.from('tasks').select('id, text, workspace_id, workspaces(name)').eq('due_date', todayStr).neq('status', 'done'),
    supabase.from('tasks').select('id, text, workspace_id, workspaces(name)').eq('due_date', tomorrowStr).neq('status', 'done'),
  ])

  const allTasks: Task[] = [
    ...(overdueRes.data ?? []).map(t => ({ ...t, workspaces: t.workspaces as { name: string } | null, dueStatus: 'overdue' as const })),
    ...(todayRes.data ?? []).map(t => ({ ...t, workspaces: t.workspaces as { name: string } | null, dueStatus: 'today' as const })),
    ...(tomorrowRes.data ?? []).map(t => ({ ...t, workspaces: t.workspaces as { name: string } | null, dueStatus: 'tomorrow' as const })),
  ]

  if (allTasks.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, message: 'No tasks due' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Group by workspace
  const byWorkspace: Record<string, Task[]> = {}
  for (const task of allTasks) {
    if (!byWorkspace[task.workspace_id]) byWorkspace[task.workspace_id] = []
    byWorkspace[task.workspace_id].push(task)
  }

  let emailsSent = 0
  const debug: unknown[] = []

  for (const [workspaceId, workspaceTasks] of Object.entries(byWorkspace)) {
    const workspaceName = workspaceTasks[0].workspaces?.name ?? 'your workspace'

    const { data: memberRows } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)

    const userIds = (memberRows ?? []).map(r => r.user_id)
    if (userIds.length === 0) { debug.push({ workspace: workspaceName, skip: 'no members' }); continue }

    const { data: profileRows, error: profilesError } = await supabase
      .from('profiles')
      .select('email, preferences')
      .in('id', userIds)

    const members = (profileRows ?? [])
      .filter(p => p?.email && p?.preferences?.['emailReminders'] !== false)

    if (!members || members.length === 0) {
      debug.push({ workspace: workspaceName, userIds, profileRows, profilesError, skip: 'no eligible members' })
      continue
    }

    const count = workspaceTasks.length
    const subject = `${count} task${count > 1 ? 's' : ''} need${count === 1 ? 's' : ''} your attention in ${workspaceName}`
    const html = buildHtml({ workspaceName, tasks: workspaceTasks, appUrl, markUrl: `${appUrl}/mark.png` })

    for (const { email } of members as { email: string }[]) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Taskmaster Pro <reminders@resend.dev>',
          to: ['shitalchau10@gmail.com'], // TODO: remove override once domain verified
          subject,
          html,
        }),
      })

      if (res.ok) {
        emailsSent++
        debug.push({ workspace: workspaceName, to: email, status: 'sent' })
      } else {
        const body = await res.text()
        debug.push({ workspace: workspaceName, to: email, status: res.status, error: body })
      }
    }
  }

  return new Response(JSON.stringify({ sent: emailsSent, tasksFound: allTasks.length, debug }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
