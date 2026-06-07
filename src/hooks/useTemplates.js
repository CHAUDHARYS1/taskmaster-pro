import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useTemplates(workspaceId) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(true)

  const fetchTemplates = useCallback(async () => {
    if (!workspaceId) { setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('board_templates')
      .select('*, board_template_tasks(*)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
    if (!error && data) setTemplates(data)
    setLoading(false)
  }, [workspaceId])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const saveTemplate = useCallback(async (name, projectTasks) => {
    if (!workspaceId || !name?.trim() || !projectTasks?.length) return

    const { data: tmpl, error: tmplErr } = await supabase
      .from('board_templates')
      .insert({ workspace_id: workspaceId, name: name.trim() })
      .select()
      .single()
    if (tmplErr) throw tmplErr

    const taskRows = projectTasks.map((t, i) => ({
      template_id: tmpl.id,
      text:        t.text,
      description: t.description ?? null,
      status:      t.status ?? 'toDo',
      priority:    t.priority ?? null,
      labels:      t.labels ?? null,
      position:    i * 1000,
    }))

    const { error: taskErr } = await supabase
      .from('board_template_tasks')
      .insert(taskRows)
    if (taskErr) throw taskErr

    await fetchTemplates()
    return tmpl
  }, [workspaceId, fetchTemplates])

  const applyTemplate = useCallback(async (templateId, projectId) => {
    if (!projectId) return 0
    const template = templates.find(t => t.id === templateId)
    if (!template?.board_template_tasks?.length) return 0

    const now    = new Date().toISOString()
    const rows   = template.board_template_tasks.map(t => ({
      project_id:  projectId,
      text:        t.text,
      description: t.description ?? null,
      status:      t.status ?? 'toDo',
      priority:    t.priority ?? null,
      labels:      t.labels ?? null,
      position:    t.position,
      created_at:  now,
    }))

    const { error } = await supabase.from('tasks').insert(rows)
    if (error) throw error
    return rows.length
  }, [templates])

  const deleteTemplate = useCallback(async (id) => {
    const { error } = await supabase
      .from('board_templates')
      .delete()
      .eq('id', id)
    if (error) throw error
    setTemplates(prev => prev.filter(t => t.id !== id))
  }, [])

  return { templates, loading, fetchTemplates, saveTemplate, applyTemplate, deleteTemplate }
}
