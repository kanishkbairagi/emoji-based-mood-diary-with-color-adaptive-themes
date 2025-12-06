import { useState, useEffect } from 'react'
import MoodSelector from './components/MoodSelector'
import MoodTimeline from './components/MoodTimeline'
import MoodCalendar from './components/MoodCalendar'
import JournalEntries from './components/JournalEntries'
import { getThemeColors } from './utils/themeUtils'

function App() {
  const [moodEntries, setMoodEntries] = useState(() => {
    const saved = localStorage.getItem('moodEntries')
    return saved ? JSON.parse(saved) : []
  })
  const [selectedMood, setSelectedMood] = useState(null)
  const [activeTab, setActiveTab] = useState('today')
  const [currentTheme, setCurrentTheme] = useState(getThemeColors('😊'))

  useEffect(() => {
    localStorage.setItem('moodEntries', JSON.stringify(moodEntries))
  }, [moodEntries])

  const handleMoodSelect = (emoji, label) => {
    const newEntry = {
      id: Date.now(),
      emoji,
      label,
      date: new Date().toISOString(),
      journal: '',
      theme: getThemeColors(emoji)
    }
    setMoodEntries([newEntry, ...moodEntries])
    setSelectedMood(emoji)
    setCurrentTheme(getThemeColors(emoji))
  }

  const updateJournal = (id, journal) => {
    setMoodEntries(moodEntries.map(entry => 
      entry.id === id ? { ...entry, journal } : entry
    ))
  }

  const todayEntry = moodEntries.find(entry => {
    const entryDate = new Date(entry.date).toDateString()
    const today = new Date().toDateString()
    return entryDate === today
  })

  useEffect(() => {
    if (todayEntry) {
      setCurrentTheme(todayEntry.theme || getThemeColors(todayEntry.emoji))
    }
  }, [todayEntry])

  return (
    <div 
      className="min-h-screen transition-all duration-500"
      style={{
        backgroundColor: currentTheme.bg,
        color: currentTheme.text
      }}
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2" style={{ color: currentTheme.primary }}>
            Emoji Mood Diary
          </h1>
          <p className="text-lg opacity-80">Track your emotions with colorful themes</p>
        </header>

        <div className="mb-8">
          <MoodSelector 
            onSelect={handleMoodSelect} 
            theme={currentTheme}
          />
        </div>

        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
              activeTab === 'today' 
                ? 'scale-110 shadow-lg' 
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'today' ? currentTheme.primary : currentTheme.secondary,
              color: currentTheme.bg
            }}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
              activeTab === 'timeline' 
                ? 'scale-110 shadow-lg' 
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'timeline' ? currentTheme.primary : currentTheme.secondary,
              color: currentTheme.bg
            }}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
              activeTab === 'calendar' 
                ? 'scale-110 shadow-lg' 
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'calendar' ? currentTheme.primary : currentTheme.secondary,
              color: currentTheme.bg
            }}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
              activeTab === 'journal' 
                ? 'scale-110 shadow-lg' 
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'journal' ? currentTheme.primary : currentTheme.secondary,
              color: currentTheme.bg
            }}
          >
            Journal
          </button>
        </div>

        <div className="mt-8">
          {activeTab === 'today' && todayEntry && (
            <div 
              className="rounded-2xl p-8 shadow-2xl animate-fadeIn"
              style={{
                backgroundColor: currentTheme.card,
                border: `2px solid ${currentTheme.primary}`
              }}
            >
              <div className="text-center">
                <div className="text-8xl mb-4 animate-bounce-slow">{todayEntry.emoji}</div>
                <h2 className="text-3xl font-bold mb-2">{todayEntry.label}</h2>
                <p className="opacity-70">
                  {new Date(todayEntry.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <MoodTimeline entries={moodEntries} theme={currentTheme} />
          )}

          {activeTab === 'calendar' && (
            <MoodCalendar entries={moodEntries} theme={currentTheme} />
          )}

          {activeTab === 'journal' && (
            <JournalEntries 
              entries={moodEntries} 
              onUpdate={updateJournal}
              theme={currentTheme} 
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App

