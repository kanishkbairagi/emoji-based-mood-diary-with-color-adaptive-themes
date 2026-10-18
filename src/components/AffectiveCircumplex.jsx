import React from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts'
import { getEmotionVector, getThemeColors } from '../utils/themeUtils'

export default function AffectiveCircumplex({ entries, theme }) {
  // Transform diary entries into 2D coordinates on Russell's Circumplex Plane
  const data = entries.map((entry) => {
    const vector = getEmotionVector(entry.emoji)
    return {
      id: entry.id,
      emoji: entry.emoji,
      label: entry.label,
      date: new Date(entry.date).toLocaleDateString(),
      valence: vector.valence,
      arousal: vector.arousal,
      color: getThemeColors(entry.emoji).primary,
    }
  })

  // Custom tooltip explaining the mathematical coordinates
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </div>
          <p className="text-slate-400">Logged: {item.date}</p>
          <div className="pt-1 border-t border-slate-800 space-y-0.5 font-mono">
            <p>Valence (Pleasure): <span className="text-emerald-400">{item.valence > 0 ? `+${item.valence}` : item.valence}</span></p>
            <p>Arousal (Energy): <span className="text-amber-400">{item.arousal > 0 ? `+${item.arousal}` : item.arousal}</span></p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div
      className="rounded-2xl p-6 shadow-xl transition-all duration-500"
      style={{
        backgroundColor: theme.card,
        border: `2px solid ${theme.secondary}`,
      }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>
            Affective Circumplex Model (Russell 2D)
          </h2>
          <p className="text-sm opacity-75 mt-1">
            Continuous mapping of emotional states onto Valence (Pleasure) and Arousal (Activation) vectors.
          </p>
        </div>
        <div className="mt-2 md:mt-0 px-3 py-1 bg-black/5 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{entries.length} Affective Vectors Logged</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 opacity-60">
          <p className="text-lg">No emotional coordinates logged yet. Select a mood to plot your vector!</p>
        </div>
      ) : (
        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              
              {/* Reference axes intersecting at (0, 0) Neutral */}
              <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" />
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" />

              <XAxis
                type="number"
                dataKey="valence"
                domain={[-1, 1]}
                tickCount={5}
                name="Valence"
                unit=""
                tick={{ fill: '#64748b', fontSize: 11 }}
                label={{ value: 'Valence (Pleasure →)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="arousal"
                domain={[-1, 1]}
                tickCount={5}
                name="Arousal"
                unit=""
                tick={{ fill: '#64748b', fontSize: 11 }}
                label={{ value: 'Arousal (Activation ↑)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
              />

              <Tooltip content={<CustomTooltip />} />

              <Scatter data={data} animationDuration={600}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#1e293b" strokeWidth={1.5} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quadrant Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs opacity-80 pt-4 border-t border-black/10">
        <div className="p-2 rounded bg-black/5">
          <span className="font-bold block text-emerald-600">Q1: High Energy + Pleasure</span>
          <span>Joy, Excitement, Euphoria</span>
        </div>
        <div className="p-2 rounded bg-black/5">
          <span className="font-bold block text-rose-600">Q2: High Energy + Distress</span>
          <span>Anxiety, Tension, Anger</span>
        </div>
        <div className="p-2 rounded bg-black/5">
          <span className="font-bold block text-indigo-600">Q3: Low Energy + Distress</span>
          <span>Sadness, Lethargy, Boredom</span>
        </div>
        <div className="p-2 rounded bg-black/5">
          <span className="font-bold block text-sky-600">Q4: Low Energy + Pleasure</span>
          <span>Calm, Serenity, Relief</span>
        </div>
      </div>
    </div>
  )
}
