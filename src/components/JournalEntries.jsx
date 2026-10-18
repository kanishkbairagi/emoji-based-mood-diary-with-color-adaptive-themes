import { useState } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { getEmotionVector } from '../utils/themeUtils'

function JournalEntries({ entries, onUpdate, theme, isUnlocked }) {
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString)
      if (isToday(date)) return 'Today'
      if (isYesterday(date)) return 'Yesterday'
      return format(date, 'MMMM d, yyyy')
    } catch {
      return dateString
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
        <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>
          Encrypted Journal Entries
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-slate-900/5 font-mono flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isUnlocked ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            {isUnlocked ? 'AES-256-GCM Active' : 'Vault Locked'}
          </span>
        </div>
      </div>
      
      {entries.length === 0 ? (
        <div className="text-center py-12 opacity-60">
          <p className="text-xl">No journal entries yet. Start by selecting a mood above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => {
            const entryTheme = entry.theme || theme
            const isExpanded = expandedId === entry.id
            const isEditing = editingId === entry.id
            const vector = getEmotionVector(entry.emoji)

            return (
              <div
                key={entry.id}
                className={`
                  rounded-xl p-4 cursor-pointer transition-all duration-300
                  ${isExpanded ? 'shadow-2xl' : 'shadow-md hover:shadow-lg'}
                `}
                style={{
                  backgroundColor: entryTheme.card,
                  border: `2px solid ${entryTheme.secondary}`,
                  transform: isExpanded ? 'scale(1.01)' : 'scale(1)',
                }}
                onClick={() => !isEditing && setExpandedId(isExpanded ? null : entry.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{entry.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 
                          className="text-xl font-bold"
                          style={{ color: entryTheme.primary }}
                        >
                          {entry.label}
                        </h3>
                        {/* Affective continuous coordinates */}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-black/5 font-mono text-slate-600">
                          V: {vector.valence > 0 ? `+${vector.valence}` : vector.valence} | A: {vector.arousal > 0 ? `+${vector.arousal}` : vector.arousal}
                        </span>
                      </div>
                      <p 
                        className="text-xs opacity-70 mt-0.5"
                        style={{ color: entryTheme.text }}
                      >
                        {formatDate(entry.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.encrypted && (
                      <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                        🔒 Encrypted
                      </span>
                    )}
                    {isExpanded && !isEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(entry)
                        }}
                        className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                        style={{
                          backgroundColor: entryTheme.primary,
                          color: entryTheme.bg
                        }}
                      >
                        {entry.journal ? 'Edit' : 'Add Journal'}
                      </button>
                    )}
                  </div>
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
                          placeholder="Write about your day (encrypted with your vault key)..."
                          className="w-full p-3 rounded-lg resize-none focus:outline-none focus:ring-2 text-sm"
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
                            className="px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm hover:scale-105"
                            style={{
                              backgroundColor: entryTheme.primary,
                              color: entryTheme.bg
                            }}
                          >
                            Save Encrypted
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancel()
                            }}
                            className="px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm hover:scale-105"
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
                          <div className="space-y-2">
                            <p 
                              className="text-sm leading-relaxed whitespace-pre-wrap"
                              style={{ color: entryTheme.text }}
                            >
                              {entry.journal}
                            </p>
                            {entry.iv && (
                              <p className="text-[10px] font-mono opacity-50 truncate">
                                IV: {entry.iv} | Tag: {entry.authTag || 'Verified'}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p 
                            className="text-sm opacity-60 italic"
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
