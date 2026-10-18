import React, { useState } from 'react'

export default function VaultSecurityModal({
  isOpen,
  onClose,
  isUnlocked,
  user,
  onUnlock,
  onLock,
  theme,
}) {
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState(user?.username || '')
  const [mode, setMode] = useState('unlock') // 'unlock' | 'register'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await onUnlock({ username, password, isRegister: mode === 'register' })
      setPassword('')
      onClose()
    } catch (err) {
      setError(err.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl relative transition-all"
        style={{
          backgroundColor: theme.card,
          border: `2px solid ${theme.primary}`,
          color: theme.text,
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-2xl">
            🔐
          </div>
          <div>
            <h3 className="text-xl font-bold">Zero-Knowledge Vault</h3>
            <p className="text-xs opacity-70">Client-Side AES-256-GCM End-to-End Encryption</p>
          </div>
        </div>

        {isUnlocked ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-sm space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Cryptographic Vault Unlocked
              </p>
              <p className="text-xs opacity-80">
                AES-GCM key active in volatile client memory. Journal entries are authenticated and decrypted.
              </p>
            </div>

            <div className="text-xs font-mono p-3 rounded-xl bg-black/5 space-y-1">
              <p>User: <span className="font-bold">{user?.username || 'Local Crypt'}</span></p>
              <p>Key Derivation: PBKDF2 (100k rounds, SHA-256)</p>
              <p>Cipher Suite: AES-256-GCM (128-bit tag)</p>
            </div>

            <button
              onClick={() => {
                onLock()
                onClose()
              }}
              className="w-full py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm"
              style={{
                backgroundColor: theme.secondary,
                color: theme.text,
              }}
            >
              Lock Vault & Clear In-Memory Keys
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div className="text-xs opacity-80 leading-relaxed bg-black/5 p-3 rounded-xl">
              <p>
                Your private thoughts never leave your browser unencrypted. Enter your vault passphrase to derive your encryption key locally.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. kani_cs"
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 bg-white/70"
                  style={{ borderColor: theme.secondary }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">Vault Passphrase</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passphrase used for PBKDF2 key derivation"
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 bg-white/70"
                  style={{ borderColor: theme.secondary }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="opacity-70">
                {mode === 'unlock' ? "Don't have a vault yet?" : 'Already initialized?'}
              </span>
              <button
                type="button"
                onClick={() => setMode(mode === 'unlock' ? 'register' : 'unlock')}
                className="font-semibold underline hover:opacity-100"
                style={{ color: theme.primary }}
              >
                {mode === 'unlock' ? 'Initialize New Vault' : 'Unlock Existing'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold transition-all duration-300 text-sm shadow-md hover:scale-[1.02]"
              style={{
                backgroundColor: theme.primary,
                color: theme.bg,
              }}
            >
              {loading ? 'Deriving Keys...' : mode === 'unlock' ? 'Unlock Encrypted Vault' : 'Initialize & Encrypt'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
