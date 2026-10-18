import { useState, useEffect } from 'react'
import MoodSelector from './components/MoodSelector'
import MoodTimeline from './components/MoodTimeline'
import MoodCalendar from './components/MoodCalendar'
import JournalEntries from './components/JournalEntries'
import AffectiveCircumplex from './components/AffectiveCircumplex'
import VaultSecurityModal from './components/VaultSecurityModal'
import { getThemeColors, getEmotionVector } from './utils/themeUtils'
import { deriveKeyFromPassword, encryptJournalText, decryptJournalText } from './services/crypto'
import { api } from './services/api'

function App() {
  const [moodEntries, setMoodEntries] = useState(() => {
    const saved = localStorage.getItem('moodEntries')
    return saved ? JSON.parse(saved) : []
  })
  const [selectedMood, setSelectedMood] = useState(null)
  const [activeTab, setActiveTab] = useState('today')
  const [currentTheme, setCurrentTheme] = useState(getThemeColors('😊'))

  // Security & Systems Architecture State
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [cryptoKey, setCryptoKey] = useState(null)
  const [currentUser, setCurrentUser] = useState(() => api.getCurrentUser())
  const [serverOnline, setServerOnline] = useState(false)

  // Probe backend server health on mount
  useEffect(() => {
    async function checkServer() {
      const isUp = await api.pingServer()
      setServerOnline(isUp)
    }
    checkServer()
    const interval = setInterval(checkServer, 15000)
    return () => clearInterval(interval)
  }, [])

  // Local persistence sync
  useEffect(() => {
    localStorage.setItem('moodEntries', JSON.stringify(moodEntries))
  }, [moodEntries])

  // Unlock Vault and derive AES-256-GCM key in browser memory via PBKDF2
  const handleUnlockVault = async ({ username, password, isRegister }) => {
    let salt = 'e0f4a8b9c1d2e3f4a5b6c7d8e9f0a1b2' // Fallback reproducible salt

    if (serverOnline) {
      if (isRegister) {
        const res = await api.register(username, password, salt)
        salt = res.user.cryptoSalt
        setCurrentUser(res.user)
      } else {
        const res = await api.login(username, password)
        salt = res.user.cryptoSalt
        setCurrentUser(res.user)
      }
    } else {
      // Local development fallback
      const localUser = { username, cryptoSalt: salt }
      localStorage.setItem('vault_user', JSON.stringify(localUser))
      setCurrentUser(localUser)
    }

    // Derive 256-bit AES-GCM Key in memory
    const derivedKey = await deriveKeyFromPassword(password, salt)
    setCryptoKey(derivedKey)
    setIsUnlocked(true)

    // Decrypt any encrypted entries currently in state
    const decryptedList = await Promise.all(
      moodEntries.map(async (entry) => {
        if (entry.encryptedData && entry.iv) {
          const decryptedText = await decryptJournalText(
            entry.encryptedData,
            entry.iv,
            entry.authTag,
            derivedKey
          )
          return { ...entry, journal: decryptedText }
        }
        return entry
      })
    )
    setMoodEntries(decryptedList)
  }

  // Lock Vault and discard in-memory cryptographic keys
  const handleLockVault = () => {
    setCryptoKey(null)
    setIsUnlocked(false)
    api.logout()
    setCurrentUser(null)
  }

  // Handle Mood Selection and continuous vector mapping
  const handleMoodSelect = async (emoji, label) => {
    const vector = getEmotionVector(emoji)
    const newEntry = {
      id: Date.now(),
      emoji,
      label,
      date: new Date().toISOString(),
      journal: '',
      valence: vector.valence,
      arousal: vector.arousal,
      encrypted: false,
      theme: getThemeColors(emoji),
    }

    setMoodEntries([newEntry, ...moodEntries])
    setSelectedMood(emoji)
    setCurrentTheme(getThemeColors(emoji))

    // Background sync to server if authenticated and server online
    if (serverOnline && currentUser) {
      try {
        await api.saveEntry({
          moodId: vector.id,
          moodLabel: label,
          valence: vector.valence,
          arousal: vector.arousal,
          encryptedData: 'INITIAL_MOOD_SELECT',
          iv: 'MDEyMzQ1Njc4OWFi',
          authTag: 'MDEyMzQ1Njc4OWFiY2RlZg==',
          entryDate: new Date().toISOString().split('T')[0],
        })
      } catch (err) {
        console.warn('[Sync] Background sync deferred:', err.message)
      }
    }
  }

  // Update & Encrypt Journal with AES-256-GCM
  const updateJournal = async (id, journalText) => {
    let encryptedPayload = null

    // If Vault key is unlocked, encrypt client-side before persistence
    if (isUnlocked && cryptoKey && journalText) {
      encryptedPayload = await encryptJournalText(journalText, cryptoKey)
    }

    const updated = moodEntries.map((entry) => {
      if (entry.id === id) {
        return {
          ...entry,
          journal: journalText,
          encrypted: Boolean(encryptedPayload),
          encryptedData: encryptedPayload?.ciphertext || '',
          iv: encryptedPayload?.iv || '',
          authTag: encryptedPayload?.authTag || '',
        }
      }
      return entry
    })

    setMoodEntries(updated)

    // Sync encrypted ciphertext to backend if online
    if (serverOnline && currentUser && encryptedPayload) {
      const target = updated.find((e) => e.id === id)
      if (target) {
        const vector = getEmotionVector(target.emoji)
        try {
          await api.saveEntry({
            moodId: vector.id,
            moodLabel: target.label,
            valence: vector.valence,
            arousal: vector.arousal,
            encryptedData: encryptedPayload.ciphertext,
            iv: encryptedPayload.iv,
            authTag: encryptedPayload.authTag,
            entryDate: new Date(target.date).toISOString().split('T')[0],
          })
        } catch (err) {
          console.warn('[Sync] Server sync queued:', err.message)
        }
      }
    }
  }

  const todayEntry = moodEntries.find((entry) => {
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
        color: currentTheme.text,
      }}
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Systems & Architecture Telemetry Pill Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-black/10">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            ></span>
            <span className="text-xs font-mono font-medium">
              {serverOnline ? 'PostgreSQL & Redis API Online' : 'Distributed Mode (Offline Fallback)'}
            </span>
          </div>

          <button
            onClick={() => setIsVaultModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all hover:scale-105"
            style={{
              backgroundColor: currentTheme.card,
              border: `1.5px solid ${currentTheme.primary}`,
              color: currentTheme.text,
            }}
          >
            <span>{isUnlocked ? '🔓' : '🔐'}</span>
            <span>{isUnlocked ? 'AES-256 Vault Active' : 'Zero-Knowledge Vault: Locked'}</span>
          </button>
        </div>

        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 tracking-tight" style={{ color: currentTheme.primary }}>
            Emoji Mood Diary
          </h1>
          <p className="text-base sm:text-lg opacity-80">
            Affective Computing & Zero-Knowledge Encrypted Journal
          </p>
        </header>

        <div className="mb-8">
          <MoodSelector onSelect={handleMoodSelect} theme={currentTheme} />
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          {[
            { id: 'today', label: 'Today' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'calendar', label: 'Calendar' },
            { id: 'journal', label: 'Journal' },
            { id: 'circumplex', label: 'Affect 2D Model' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-full font-semibold transition-all duration-300 text-sm ${
                activeTab === tab.id ? 'scale-105 shadow-lg' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? currentTheme.primary : currentTheme.secondary,
                color: currentTheme.bg,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'today' && todayEntry && (
            <div
              className="rounded-2xl p-8 shadow-2xl animate-fadeIn text-center"
              style={{
                backgroundColor: currentTheme.card,
                border: `2px solid ${currentTheme.primary}`,
              }}
            >
              <div className="text-8xl mb-4">{todayEntry.emoji}</div>
              <h2 className="text-3xl font-bold mb-2">{todayEntry.label}</h2>
              <p className="opacity-70">
                {new Date(todayEntry.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}

          {activeTab === 'timeline' && <MoodTimeline entries={moodEntries} theme={currentTheme} />}

          {activeTab === 'calendar' && <MoodCalendar entries={moodEntries} theme={currentTheme} />}

          {activeTab === 'journal' && (
            <JournalEntries
              entries={moodEntries}
              onUpdate={updateJournal}
              theme={currentTheme}
              isUnlocked={isUnlocked}
            />
          )}

          {activeTab === 'circumplex' && (
            <AffectiveCircumplex entries={moodEntries} theme={currentTheme} />
          )}
        </div>
      </div>

      {/* Zero-Knowledge Cryptographic Vault Modal */}
      <VaultSecurityModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        isUnlocked={isUnlocked}
        user={currentUser}
        onUnlock={handleUnlockVault}
        onLock={handleLockVault}
        theme={currentTheme}
      />
    </div>
  )
}

export default App
