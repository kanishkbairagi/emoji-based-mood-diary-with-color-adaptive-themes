export const getThemeColors = (emoji) => {
  const themes = {
    '😊': {
      bg: '#FFF9E6',
      card: '#FFFFFF',
      primary: '#FFD700',
      secondary: '#FFE55C',
      text: '#2C3E50',
      accent: '#FFA500'
    },
    '😄': {
      bg: '#E8F5E9',
      card: '#FFFFFF',
      primary: '#4CAF50',
      secondary: '#81C784',
      text: '#1B5E20',
      accent: '#66BB6A'
    },
    '😍': {
      bg: '#FCE4EC',
      card: '#FFFFFF',
      primary: '#E91E63',
      secondary: '#F48FB1',
      text: '#880E4F',
      accent: '#EC407A'
    },
    '🥰': {
      bg: '#FFF3E0',
      card: '#FFFFFF',
      primary: '#FF9800',
      secondary: '#FFB74D',
      text: '#E65100',
      accent: '#FF6F00'
    },
    '😎': {
      bg: '#E3F2FD',
      card: '#FFFFFF',
      primary: '#2196F3',
      secondary: '#64B5F6',
      text: '#0D47A1',
      accent: '#42A5F5'
    },
    '😌': {
      bg: '#F3E5F5',
      card: '#FFFFFF',
      primary: '#9C27B0',
      secondary: '#BA68C8',
      text: '#4A148C',
      accent: '#AB47BC'
    },
    '😴': {
      bg: '#E0F2F1',
      card: '#FFFFFF',
      primary: '#009688',
      secondary: '#4DB6AC',
      text: '#004D40',
      accent: '#26A69A'
    },
    '😢': {
      bg: '#E1F5FE',
      card: '#FFFFFF',
      primary: '#00BCD4',
      secondary: '#4DD0E1',
      text: '#006064',
      accent: '#00ACC1'
    },
    '😡': {
      bg: '#FFEBEE',
      card: '#FFFFFF',
      primary: '#F44336',
      secondary: '#E57373',
      text: '#B71C1C',
      accent: '#EF5350'
    },
    '😰': {
      bg: '#FFF8E1',
      card: '#FFFFFF',
      primary: '#FFC107',
      secondary: '#FFD54F',
      text: '#F57F17',
      accent: '#FFB300'
    },
    '😐': {
      bg: '#F5F5F5',
      card: '#FFFFFF',
      primary: '#9E9E9E',
      secondary: '#BDBDBD',
      text: '#424242',
      accent: '#757575'
    },
    '🤔': {
      bg: '#ECEFF1',
      card: '#FFFFFF',
      primary: '#607D8B',
      secondary: '#90A4AE',
      text: '#263238',
      accent: '#78909C'
    }
  }

  return themes[emoji] || themes['😊']
}

