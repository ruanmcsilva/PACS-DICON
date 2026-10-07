import React from 'react';
import { Sun, Moon, Globe, Palette, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface ThemeLanguageBarProps {
  compact?: boolean;
}

export const ThemeLanguageBar: React.FC<ThemeLanguageBarProps> = ({ compact = false }) => {
  const { mode, color, toggleMode, toggleColor, setPreset } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const isLight = mode === 'light';
  const isGreen = color === 'green';

  return (
    <div className={`theme-lang-controls ${compact ? 'compact' : ''}`}>
      {/* Idioma: EN / PT */}
      <button 
        type="button"
        className="control-pill-btn lang-btn" 
        onClick={toggleLanguage}
        title={t('lang.switch')}
        aria-label={t('lang.switch')}
      >
        <Globe size={14} className="control-icon" />
        <span className="lang-text">
          {language === 'pt' ? '🇧🇷 PT' : '🇺🇸 EN'}
        </span>
      </button>

      {/* Tema: Dark / White (Claro / Escuro) */}
      <button 
        type="button"
        className={`control-pill-btn theme-mode-btn ${isLight ? 'is-light' : 'is-dark'}`}
        onClick={toggleMode}
        title={isLight ? t('theme.dark') : t('theme.light')}
        aria-label={isLight ? t('theme.dark') : t('theme.light')}
      >
        {isLight ? (
          <>
            <Moon size={14} className="control-icon" />
            {!compact && <span className="btn-label">{t('theme.dark')}</span>}
          </>
        ) : (
          <>
            <Sun size={14} className="control-icon" />
            {!compact && <span className="btn-label">{t('theme.light')}</span>}
          </>
        )}
      </button>

      {/* Cores: Branco e Verde vs Azul e Branco */}
      <div className="color-selector-group" title={t('theme.color')}>
        <button
          type="button"
          className={`color-dot-btn color-green ${isGreen ? 'active' : ''}`}
          onClick={() => {
            if (color !== 'green') toggleColor();
          }}
          title={isLight ? "Branco e Verde" : "Dark e Verde"}
          aria-label="Verde"
        >
          <span className="dot-circle dot-emerald"></span>
          {!compact && <span className="dot-label">{t('theme.green')}</span>}
          {isGreen && <Check size={11} className="active-check" />}
        </button>

        <button
          type="button"
          className={`color-dot-btn color-blue ${!isGreen ? 'active' : ''}`}
          onClick={() => {
            if (color !== 'blue') toggleColor();
          }}
          title={isLight ? "Azul e Branco" : "Dark e Azul"}
          aria-label="Azul"
        >
          <span className="dot-circle dot-cyan"></span>
          {!compact && <span className="dot-label">{t('theme.blue')}</span>}
          {!isGreen && <Check size={11} className="active-check" />}
        </button>
      </div>
    </div>
  );
};

export default ThemeLanguageBar;
