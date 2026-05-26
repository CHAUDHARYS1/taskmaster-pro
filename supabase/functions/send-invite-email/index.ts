import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Verify the caller has a valid Supabase session
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

    const { email, inviteUrl, workspaceName, role } = await req.json()
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

    const roleLabel = role === 'viewer' ? 'viewer (read-only)' : 'member'

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
        subject: `You've been invited to ${workspaceName} on Taskmaster Pro`,
        text: `You've been invited to ${workspaceName} on Taskmaster Pro.\n\nYou've been added as a ${roleLabel}.\n\nAccept your invitation:\n${inviteUrl}\n\nThis link expires in 7 days. If you weren't expecting this, you can ignore it.`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
          <body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
            <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
              <div style="background:#2563EB;padding:24px 32px">
                <p style="margin:0;color:#fff;font-size:18px;font-weight:700">Taskmaster Pro</p>
              </div>
              <div style="padding:32px">
                <h1 style="margin:0 0 8px;font-size:22px;color:#111">You've been invited</h1>
                <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6">
                  You've been added to <strong>${workspaceName}</strong> as a <strong>${roleLabel}</strong>.
                </p>
                <a href="${inviteUrl}"
                   style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;
                          padding:13px 28px;border-radius:8px;font-weight:600;font-size:15px">
                  Accept invitation
                </a>
                <p style="margin:28px 0 0;color:#999;font-size:13px;line-height:1.5">
                  This link expires in 7 days.<br>
                  If you weren't expecting this invitation, you can safely ignore this email.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
