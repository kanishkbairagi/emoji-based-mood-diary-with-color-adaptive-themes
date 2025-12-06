import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'

function MoodTimeline({ entries, theme }) {
  const moodValues = {
    '😊': 8,
    '😄': 10,
    '😍': 9,
    '🥰': 9,
    '😎': 7,
    '😌': 6,
    '😴': 4,
    '😢': 2,
    '😡': 1,
    '😰': 3,
    '😐': 5,
    '🤔': 5
  }

  const chartData = entries
    .slice(0, 30)
    .reverse()
    .map(entry => ({
      date: format(parseISO(entry.date), 'MMM dd'),
      mood: moodValues[entry.emoji] || 5,
      emoji: entry.emoji
    }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="p-3 rounded-lg shadow-lg"
          style={{
            backgroundColor: theme.card,
            border: `1px solid ${theme.primary}`
          }}
        >
          <p className="text-2xl mb-1">{payload[0].payload.emoji}</p>
          <p style={{ color: theme.primary }}>
            {`Mood: ${payload[0].value}/10`}
          </p>
        </div>
      )
    }
    return null
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
        Mood Timeline (Last 30 Days)
      </h2>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.secondary} opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke={theme.text}
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              domain={[0, 10]}
              stroke={theme.text}
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="mood" 
              stroke={theme.primary}
              strokeWidth={3}
              dot={{ fill: theme.accent, r: 5 }}
              activeDot={{ r: 8, fill: theme.primary }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12 opacity-60">
          <p className="text-xl">No mood data yet. Start tracking your moods!</p>
        </div>
      )}
    </div>
  )
}

export default MoodTimeline

