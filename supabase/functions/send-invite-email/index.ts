import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AVATAR_COLORS = ['#7c3aed', '#2563EB', '#059669', '#d97706', '#dc2626', '#0891b2']

function avatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

function buildHtml(opts: {
  inviterName: string
  workspaceName: string
  roleLabel: string
  inviteUrl: string
  markUrl: string
}): string {
  const { inviterName, workspaceName, roleLabel, inviteUrl, markUrl } = opts
  const inviterFirst = inviterName.split(' ')[0]
  const wsInitials = initials(workspaceName)
  const wsColor = avatarColor(workspaceName)

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>You've been invited to ${workspaceName}</title>
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
    ${inviterName} added you to ${workspaceName} on Taskmaster Pro.
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

                <!-- Hero -->
                <tr>
                  <td class="tm-px" style="padding:44px 48px 0;">
                    <p style="margin:0 0 16px; font-family:'IBM Plex Mono',monospace; font-size:11px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:#2563EB;">Workspace invite</p>
                    <h1 class="tm-hero-h1" style="margin:0; font-family:'Instrument Serif',Georgia,'Times New Roman',serif; font-size:40px; font-weight:400; line-height:1.08; letter-spacing:-0.5px; color:#1a1a1a;">
                      ${inviterFirst} invited you.<br><span style="font-style:italic; color:#2563EB;">Jump&nbsp;in.</span>
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td class="tm-px" style="padding:22px 48px 0;">
                    <p style="margin:0; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:16px; line-height:1.6; color:#444444;">
                      <strong style="color:#1a1a1a; font-weight:600;">${inviterName}</strong> added you to a workspace on Taskmaster Pro. Accept the invite to see the board and start collaborating in real time.
                    </p>
                  </td>
                </tr>

                <!-- Workspace tile -->
                <tr>
                  <td class="tm-px" style="padding:28px 48px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa; border:1px solid #eeeeee; border-radius:5px;">
                      <tr>
                        <td style="padding:20px 22px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="48" style="vertical-align:middle; padding-right:16px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td width="48" height="48" align="center" valign="middle" style="width:48px; height:48px; background-color:${wsColor}; border-radius:8px; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:18px; font-weight:700; color:#ffffff; text-align:center;">${wsInitials}</td>
                                  </tr>
                                </table>
                              </td>
                              <td style="vertical-align:middle;">
                                <p style="margin:0 0 3px; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:16px; font-weight:700; color:#1a1a1a;">${workspaceName}</p>
                                <p style="margin:0; font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:0.3px; color:#666666;">Role: ${roleLabel}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="tm-px" style="padding:28px 48px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#2563EB" style="border-radius:5px;">
                          <a href="${inviteUrl}" style="display:inline-block; padding:14px 28px; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:15px; font-weight:600; line-height:1; color:#ffffff; text-decoration:none; border-radius:5px;">Accept invite&nbsp;&rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fallback link -->
                <tr>
                  <td class="tm-px" style="padding:18px 48px 44px;">
                    <p style="margin:0; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:#888888;">
                      Not expecting this? You can safely ignore this email. This link expires in 7 days.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="tm-px" style="padding:28px 48px 8px;">
              <p style="margin:0 0 14px; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:#888888;">
                Trouble with the button? Paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color:#2563EB; text-decoration:underline; word-break:break-all; font-family:'IBM Plex Mono',monospace; font-size:12px;">${inviteUrl}</a>
              </p>
              <p style="margin:14px 0 0; font-family:'Plus Jakarta Sans',Helvetica,Arial,sans-serif; font-size:12px; line-height:1.6; color:#888888;">
                Taskmaster Pro &middot; You received this because someone added you to a workspace.<br>
                If this wasn't you, ignore this email — no account has been created.
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, inviteUrl, workspaceName, role, inviterName } = await req.json()
    if (!email || !inviteUrl || !workspaceName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resolvedInviterName = (inviterName as string | undefined)?.trim() || 'A teammate'
    const roleLabel = role === 'viewer' ? 'Viewer (read-only)' : role === 'admin' ? 'Admin' : 'Member'
    const appUrl = Deno.env.get('APP_URL') ?? 'https://taskmaster-pro.netlify.app'
    const markUrl = `${appUrl}/mark.png`

    const html = buildHtml({ inviterName: resolvedInviterName, workspaceName, roleLabel, inviteUrl, markUrl })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Replace with a verified Resend domain for reliable inbox delivery.
        // onboarding@resend.dev only delivers to the Resend account owner's address.
        from: 'Taskmaster Pro <onboarding@resend.dev>',
        to: [email],
        subject: `${resolvedInviterName} added you to ${workspaceName}`,
        text: `${resolvedInviterName} added you to ${workspaceName} on Taskmaster Pro as a ${roleLabel}.\n\nAccept your invitation:\n${inviteUrl}\n\nThis link expires in 7 days.`,
        html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      return new Response(JSON.stringify({ error: body }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
