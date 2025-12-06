import { useState } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'

function JournalEntries({ entries, onUpdate, theme }) {
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  const formatDate = (dateString) => {
    const date = parseISO(dateString)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMMM d, yyyy')
  }

  const handleEdit = (entry) => {
    setEditingId(entry.id)
    setEditText(entry.journal || '')
  }

  const handleSave = (id) => {
    onUpdate(id, editText)
    setEditingId(null)
    setEditText('')
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditText('')
  }

  return (
    <div 
      className="rounded-2xl p-6 shadow-xl"
      style={{
        backgroundColor: theme.card,
        border: `2px solid ${theme.secondary}`
      }}
    >
      <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.primary }}>
        Your Journal Entries
      </h2>
      
      {entries.length === 0 ? (
        <div className="text-center py-12 opacity-60">
          <p className="text-xl">No journal entries yet. Start by selecting a mood!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => {
            const entryTheme = entry.theme || theme
            const isExpanded = expandedId === entry.id
            const isEditing = editingId === entry.id

            return (
              <div
                key={entry.id}
                className={`
                  rounded-xl p-4 cursor-pointer transition-all duration-500
                  ${isExpanded ? 'shadow-2xl' : 'shadow-md hover:shadow-lg'}
                `}
                style={{
                  backgroundColor: entryTheme.card,
                  border: `2px solid ${entryTheme.secondary}`,
                  transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
                  animation: `fadeInUp 0.5s ease ${index * 0.1}s both`
                }}
                onClick={() => !isEditing && setExpandedId(isExpanded ? null : entry.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{entry.emoji}</span>
                    <div>
                      <h3 
                        className="text-xl font-bold"
                        style={{ color: entryTheme.primary }}
                      >
                        {entry.label}
                      </h3>
                      <p 
                        className="text-sm opacity-70"
                        style={{ color: entryTheme.text }}
                      >
                        {formatDate(entry.date)}
                      </p>
                    </div>
                  </div>
                  {isExpanded && !isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(entry)
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-110"
                      style={{
                        backgroundColor: entryTheme.primary,
                        color: entryTheme.bg
                      }}
                    >
                      {entry.journal ? 'Edit' : 'Add Journal'}
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div 
                    className="mt-4 pt-4 border-t animate-fadeIn"
                    style={{ borderColor: entryTheme.secondary }}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder="Write about your day..."
                          className="w-full p-3 rounded-lg resize-none focus:outline-none focus:ring-2"
                          style={{
                            backgroundColor: entryTheme.bg,
                            color: entryTheme.text,
                            border: `2px solid ${entryTheme.secondary}`,
                            minHeight: '120px'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSave(entry.id)
                            }}
                            className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-110"
                            style={{
                              backgroundColor: entryTheme.primary,
                              color: entryTheme.bg
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancel()
                            }}
                            className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-110"
                            style={{
                              backgroundColor: entryTheme.secondary,
                              color: entryTheme.bg
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {entry.journal ? (
                          <p 
                            className="text-base leading-relaxed whitespace-pre-wrap animate-fadeIn"
                            style={{ color: entryTheme.text }}
                          >
                            {entry.journal}
                          </p>
                        ) : (
                          <p 
                            className="text-base opacity-60 italic animate-fadeIn"
                            style={{ color: entryTheme.text }}
                          >
                            No journal entry yet. Click "Add Journal" to write about your day.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default JournalEntries

