import { useState } from 'react'

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😄', label: 'Very Happy' },
  { emoji: '😍', label: 'In Love' },
  { emoji: '🥰', label: 'Loved' },
  { emoji: '😎', label: 'Cool' },
  { emoji: '😌', label: 'Relieved' },
  { emoji: '😴', label: 'Sleepy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '🤔', label: 'Thoughtful' }
]

function MoodSelector({ onSelect, theme }) {
  const [hoveredEmoji, setHoveredEmoji] = useState(null)

  return (
    <div 
      className="rounded-2xl p-6 shadow-xl"
      style={{
        backgroundColor: theme.card,
        border: `2px solid ${theme.secondary}`
      }}
    >
      <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: theme.primary }}>
        How are you feeling today?
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {MOODS.map((mood) => (
          <button
            key={mood.emoji}
            onClick={() => onSelect(mood.emoji, mood.label)}
            onMouseEnter={() => setHoveredEmoji(mood.emoji)}
            onMouseLeave={() => setHoveredEmoji(null)}
            className={`
              p-4 rounded-xl transition-all duration-300 transform
              ${hoveredEmoji === mood.emoji ? 'scale-125 shadow-2xl z-10' : 'scale-100 hover:scale-110'}
            `}
            style={{
              backgroundColor: hoveredEmoji === mood.emoji ? theme.primary : theme.secondary,
              opacity: hoveredEmoji === mood.emoji ? 1 : 0.8
            }}
          >
            <div className="text-4xl mb-2">{mood.emoji}</div>
            <div 
              className="text-sm font-semibold"
              style={{ color: theme.bg }}
            >
              {mood.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default MoodSelector

