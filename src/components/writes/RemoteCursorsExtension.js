import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const pluginKey = new PluginKey('remoteCursors')

export const RemoteCursorsExtension = Extension.create({
  name: 'remoteCursors',

  addCommands() {
    return {
      updateRemoteCursors: (cursors) => ({ dispatch, tr }) => {
        tr.setMeta(pluginKey, cursors)
        tr.setMeta('addToHistory', false)
        if (dispatch) dispatch(tr)
        return true
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pluginKey,
        state: {
          init: () => ({ cursors: {} }),
          apply(tr, prev) {
            const meta = tr.getMeta(pluginKey)
            return meta !== undefined ? { cursors: meta } : prev
          },
        },
        props: {
          decorations(state) {
            const { cursors } = pluginKey.getState(state)
            if (!cursors || Object.keys(cursors).length === 0) return DecorationSet.empty

            const decorations = []
            const docSize = state.doc.content.size

            for (const cursor of Object.values(cursors)) {
              const { user_id, anchor, head, color, display_name } = cursor
              if (anchor == null || head == null) continue

              const clampedHead   = Math.min(Math.max(0, head),   docSize)
              const clampedAnchor = Math.min(Math.max(0, anchor), docSize)

              // Cursor caret
              const cursorEl = document.createElement('span')
              cursorEl.className = 'we-remote-cursor'
              cursorEl.setAttribute('aria-hidden', 'true')
              cursorEl.style.setProperty('--cursor-color', color ?? '#2563EB')

              const labelEl = document.createElement('span')
              labelEl.className = 'we-remote-cursor-label'
              labelEl.style.background = color ?? '#2563EB'
              labelEl.textContent = (display_name ?? 'User').split(' ')[0]
              cursorEl.appendChild(labelEl)

              decorations.push(
                Decoration.widget(clampedHead, cursorEl, { key: `cursor-${user_id}`, side: 1 })
              )

              // Selection range highlight (only when text is selected)
              if (clampedAnchor !== clampedHead) {
                const from = Math.min(clampedAnchor, clampedHead)
                const to   = Math.max(clampedAnchor, clampedHead)
                decorations.push(
                  Decoration.inline(from, to, {
                    class: 'we-remote-selection',
                    style: `background: ${color ?? '#2563EB'}33`,
                  }, { key: `selection-${user_id}` })
                )
              }
            }

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})
