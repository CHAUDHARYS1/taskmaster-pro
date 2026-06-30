import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DetectedTask {
  text: string
  suggestedDueDate: string | null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Auth ────────────────────────────────────────────────────────────
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
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Input ────────────────────────────────────────────────────────────
    const { text } = await req.json()
    if (!text || typeof text !== 'string' || !text.trim()) {
      return new Response(JSON.stringify({ tasks: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Anthropic API key ─────────────────────────────────────────────────
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Call Claude ───────────────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10)

    const systemPrompt = `Today's date is ${today}.

You are a task extraction assistant. Read the document and return a JSON array of actionable tasks.

Rules:
1. Only extract genuinely actionable items — things someone needs to do, not observations, notes, or general statements.
2. If a heading introduces a list or checklist, use the HEADING TEXT as the single task title rather than listing each sub-item separately.
3. If list items appear with no heading above them, extract each item as its own task.
4. For due dates: parse natural language expressions ("by Friday", "next Monday", "before the 20th") into absolute YYYY-MM-DD dates relative to today. If no date is mentioned, return null.
5. Skip items that are already checked/completed (marked [x] or ✓).
6. Return [] if nothing actionable is found.

Return ONLY a raw JSON array — no markdown fences, no explanation, no preamble.
Schema: [{ "text": "string", "suggestedDueDate": "YYYY-MM-DD or null" }]`

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Extract tasks from this document:\n\n${text}` },
        ],
      }),
    })

    if (!anthropicRes.ok) {
      const body = await anthropicRes.text()
      console.error('Anthropic API error:', anthropicRes.status, body)
      return new Response(JSON.stringify({ error: 'AI request failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anthropicData = await anthropicRes.json()
    const raw: string = anthropicData?.content?.[0]?.text ?? ''

    // ── Parse + validate ──────────────────────────────────────────────────
    let tasks: DetectedTask[] = []
    try {
      // Strip any accidental markdown code fences before parsing
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim()

      const parsed = JSON.parse(cleaned)

      if (Array.isArray(parsed)) {
        tasks = parsed
          .filter((item): item is DetectedTask =>
            item !== null &&
            typeof item === 'object' &&
            typeof item.text === 'string' &&
            item.text.trim().length > 0,
          )
          .map(item => ({
            text: item.text.trim(),
            suggestedDueDate: typeof item.suggestedDueDate === 'string'
              ? item.suggestedDueDate
              : null,
          }))
      }
    } catch (parseErr) {
      console.error('Failed to parse AI response:', raw, parseErr)
      // Return empty rather than erroring — the UI shows "No tasks detected"
      tasks = []
    }

    return new Response(JSON.stringify({ tasks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('detect-tasks error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
