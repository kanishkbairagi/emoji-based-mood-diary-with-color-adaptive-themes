/**
 * Affective Computing & Theme Engine
 * Maps emoji emotional states to:
 * 1. UI Palette Colors (dynamic color-adaptive theming)
 * 2. Russell's Circumplex Model of Affect 2D Emotion Vectors (Valence & Arousal)
 * 
 * Valence: -1.0 (Displeasure) to +1.0 (Pleasure)
 * Arousal: -1.0 (Deactivated / Low Energy) to +1.0 (Activated / High Energy)
 */

export const MOOD_AFFECT_MAP = {
  '😄': {
    id: 'very_happy',
    label: 'Very Happy',
    valence: 0.90,
    arousal: 0.75,
    colors: {
      bg: '#E8F5E9',
      card: '#FFFFFF',
      primary: '#4CAF50',
      secondary: '#81C784',
      text: '#1B5E20',
      accent: '#66BB6A'
    }
  },
  '😊': {
    id: 'happy',
    label: 'Happy',
    valence: 0.80,
    arousal: 0.40,
    colors: {
      bg: '#FFF9E6',
      card: '#FFFFFF',
      primary: '#FFD700',
      secondary: '#FFE55C',
      text: '#2C3E50',
      accent: '#FFA500'
    }
  },
  '😍': {
    id: 'in_love',
    label: 'In Love',
    valence: 0.95,
    arousal: 0.60,
    colors: {
      bg: '#FCE4EC',
      card: '#FFFFFF',
      primary: '#E91E63',
      secondary: '#F48FB1',
      text: '#880E4F',
      accent: '#EC407A'
    }
  },
  '🥰': {
    id: 'loved',
    label: 'Loved',
    valence: 0.85,
    arousal: 0.30,
    colors: {
      bg: '#FFF3E0',
      card: '#FFFFFF',
      primary: '#FF9800',
      secondary: '#FFB74D',
      text: '#E65100',
      accent: '#FF6F00'
    }
  },
  '😎': {
    id: 'cool',
    label: 'Cool',
    valence: 0.70,
    arousal: 0.20,
    colors: {
      bg: '#E3F2FD',
      card: '#FFFFFF',
      primary: '#2196F3',
      secondary: '#64B5F6',
      text: '#0D47A1',
      accent: '#42A5F5'
    }
  },
  '😌': {
    id: 'relieved',
    label: 'Relieved',
    valence: 0.60,
    arousal: -0.40,
    colors: {
      bg: '#F3E5F5',
      card: '#FFFFFF',
      primary: '#9C27B0',
      secondary: '#BA68C8',
      text: '#4A148C',
      accent: '#AB47BC'
    }
  },
  '😴': {
    id: 'sleepy',
    label: 'Sleepy',
    valence: 0.10,
    arousal: -0.80,
    colors: {
      bg: '#E0F2F1',
      card: '#FFFFFF',
      primary: '#009688',
      secondary: '#4DB6AC',
      text: '#004D40',
      accent: '#26A69A'
    }
  },
  '😢': {
    id: 'sad',
    label: 'Sad',
    valence: -0.75,
    arousal: -0.50,
    colors: {
      bg: '#E1F5FE',
      card: '#FFFFFF',
      primary: '#00BCD4',
      secondary: '#4DD0E1',
      text: '#006064',
      accent: '#00ACC1'
    }
  },
  '😡': {
    id: 'angry',
    label: 'Angry',
    valence: -0.85,
    arousal: 0.85,
    colors: {
      bg: '#FFEBEE',
      card: '#FFFFFF',
      primary: '#F44336',
      secondary: '#E57373',
      text: '#B71C1C',
      accent: '#EF5350'
    }
  },
  '😰': {
    id: 'anxious',
    label: 'Anxious',
    valence: -0.65,
    arousal: 0.80,
    colors: {
      bg: '#FFF8E1',
      card: '#FFFFFF',
      primary: '#FFC107',
      secondary: '#FFD54F',
      text: '#F57F17',
      accent: '#FFB300'
    }
  },
  '😐': {
    id: 'neutral',
    label: 'Neutral',
    valence: 0.00,
    arousal: 0.00,
    colors: {
      bg: '#F5F5F5',
      card: '#FFFFFF',
      primary: '#9E9E9E',
      secondary: '#BDBDBD',
      text: '#424242',
      accent: '#757575'
    }
  },
  '🤔': {
    id: 'thoughtful',
    label: 'Thoughtful',
    valence: 0.10,
    arousal: 0.10,
    colors: {
      bg: '#ECEFF1',
      card: '#FFFFFF',
      primary: '#607D8B',
      secondary: '#90A4AE',
      text: '#263238',
      accent: '#78909C'
    }
  }
}

export const getThemeColors = (emoji) => {
  return MOOD_AFFECT_MAP[emoji]?.colors || MOOD_AFFECT_MAP['😊'].colors
}

export const getEmotionVector = (emoji) => {
  const meta = MOOD_AFFECT_MAP[emoji] || MOOD_AFFECT_MAP['😊']
  return {
    id: meta.id,
    label: meta.label,
    valence: meta.valence,
    arousal: meta.arousal
  }
}
