import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ThemeColor = 'green' | 'blue';

interface ThemeContextType {
  mode: ThemeMode;
  color: ThemeColor;
  setMode: (mode: ThemeMode) => void;
  setColor: (color: ThemeColor) => void;
  toggleMode: () => void;
  toggleColor: () => void;
  setPreset: (preset: 'white-green' | 'blue-white' | 'dark-green' | 'dark-blue') => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  color: 'green',
  setMode: () => {},
  setColor: () => {},
  toggleMode: () => {},
  toggleColor: () => {},
  setPreset: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to 'light' and 'green' as requested by the user: "queria mudar a cor da pagina , para branco e verde"
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme_mode');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [color, setColorState] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem('theme_color');
    return (saved === 'blue' || saved === 'green') ? saved : 'green';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('theme_mode', mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-color', color);
    localStorage.setItem('theme_color', color);
  }, [color]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
  };

  const setColor = (c: ThemeColor) => {
    setColorState(c);
  };

  const toggleMode = () => {
    setModeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleColor = () => {
    setColorState(prev => (prev === 'green' ? 'blue' : 'green'));
  };

  const setPreset = (preset: 'white-green' | 'blue-white' | 'dark-green' | 'dark-blue') => {
    switch (preset) {
      case 'white-green':
        setModeState('light');
        setColorState('green');
        break;
      case 'blue-white':
        setModeState('light');
        setColorState('blue');
        break;
      case 'dark-green':
        setModeState('dark');
        setColorState('green');
        break;
      case 'dark-blue':
        setModeState('dark');
        setColorState('blue');
        break;
    }
  };

  return (
    <ThemeContext.Provider value={{ mode, color, setMode, setColor, toggleMode, toggleColor, setPreset }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
