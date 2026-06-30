import { Mark, mergeAttributes } from '@tiptap/core'

export const CommentMark = Mark.create({
  name: 'comment',
  spanning: true,
  inclusive: false,

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: el => el.getAttribute('data-comment-id'),
        renderHTML: attrs =>
          attrs.commentId ? { 'data-comment-id': attrs.commentId } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-comment-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'we-comment-mark' }), 0]
  },

  addCommands() {
    return {
      setCommentMark: commentId => ({ commands }) =>
        commands.setMark(this.name, { commentId }),

      removeCommentMark: commentId => ({ tr, state, dispatch }) => {
        let changed = false
        state.doc.descendants((node, pos) => {
          node.marks.forEach(mark => {
            if (mark.type.name === 'comment' && mark.attrs.commentId === commentId) {
              tr.removeMark(pos, pos + node.nodeSize, mark.type)
              changed = true
            }
          })
        })
        if (changed && dispatch) dispatch(tr)
        return changed
      },
    }
  },
})
