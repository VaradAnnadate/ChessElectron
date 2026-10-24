export const BOARD_THEMES = {
  classic: {
    id: 'classic',
    label: 'Emerald',
    light: '#eeeed2',
    dark: '#769656',
  },
  wood: {
    id: 'wood',
    label: 'Wood',
    light: '#f0d9b5',
    dark: '#b58863',
  },
  ocean: {
    id: 'ocean',
    label: 'Ocean',
    light: '#dee3e6',
    dark: '#4b7399',
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight',
    light: '#9bb1be',
    dark: '#344759',
  },
};

export const DEFAULT_THEME = 'classic';

export function getStoredTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const stored = localStorage.getItem('chess_board_theme');
  return stored && BOARD_THEMES[stored] ? stored : DEFAULT_THEME;
}

export function saveStoredTheme(themeId) {
  if (typeof window !== 'undefined' && BOARD_THEMES[themeId]) {
    localStorage.setItem('chess_board_theme', themeId);
  }
}
