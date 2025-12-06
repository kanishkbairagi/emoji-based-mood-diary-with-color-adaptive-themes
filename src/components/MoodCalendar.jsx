import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns'

function MoodCalendar({ entries, theme }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getMoodForDate = (date) => {
    return entries.find(entry => 
      isSameDay(parseISO(entry.date), date)
    )
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div 
      className="rounded-2xl p-6 shadow-xl"
      style={{
        backgroundColor: theme.card,
        border: `2px solid ${theme.secondary}`
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={previousMonth}
          className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-110"
          style={{
            backgroundColor: theme.secondary,
            color: theme.bg
          }}
        >
          ← Prev
        </button>
        <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button
          onClick={nextMonth}
          className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-110"
          style={{
            backgroundColor: theme.secondary,
            color: theme.bg
          }}
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div 
            key={day}
            className="text-center font-semibold py-2"
            style={{ color: theme.primary }}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: monthStart.getDay() }).map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square"></div>
        ))}
        {daysInMonth.map(day => {
          const moodEntry = getMoodForDate(day)
          const isToday = isSameDay(day, new Date())
          
          return (
            <div
              key={day.toString()}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center
                transition-all duration-300 hover:scale-110 cursor-pointer
                ${isToday ? 'ring-4' : ''}
              `}
              style={{
                backgroundColor: moodEntry 
                  ? moodEntry.theme?.secondary || theme.secondary
                  : theme.bg,
                border: `2px solid ${moodEntry ? (moodEntry.theme?.primary || theme.primary) : theme.secondary}`,
                ringColor: theme.primary,
                opacity: moodEntry ? 1 : 0.5
              }}
            >
              <span 
                className="text-sm font-semibold mb-1"
                style={{ color: theme.text }}
              >
                {format(day, 'd')}
              </span>
              {moodEntry && (
                <span className="text-2xl animate-bounce-slow">
                  {moodEntry.emoji}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: theme.bg }}>
        <p className="text-sm opacity-80 text-center">
          Days with emojis indicate you've logged your mood. Click on days to see details!
        </p>
      </div>
    </div>
  )
}

export default MoodCalendar

