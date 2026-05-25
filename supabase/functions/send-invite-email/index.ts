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
        // Use your verified Resend domain in production.
        // During development, onboarding@resend.dev works for the account owner's email only.
        // Use a verified domain in production (e.g. noreply@yourdomain.com).
        // onboarding@resend.dev is Resend's shared sender — only delivers to
        // the Resend account owner's email address during development.
        from: 'Taskmaster Pro <onboarding@resend.dev>',
        to: [email],
        subject: `You've been invited to ${workspaceName}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="margin:0 0 16px">You're invited to ${workspaceName}</h2>
            <p style="margin:0 0 24px;color:#444">
              You've been added as a <strong>${roleLabel}</strong> on
              <strong>Taskmaster Pro</strong>.
            </p>
            <a href="${inviteUrl}"
               style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;
                      padding:12px 24px;border-radius:6px;font-weight:600">
              Accept invitation
            </a>
            <p style="margin:24px 0 0;color:#888;font-size:13px">
              This link expires in 7 days. If you weren't expecting this, you can ignore it.
            </p>
          </div>
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
