import React, { useState } from 'react';
import { Activity, Menu, X, ArrowRight, Sparkles, PhoneCall } from 'lucide-react';
import { useLanguage } from '../../core/context/LanguageContext';
import ThemeLanguageBar from '../../core/layout/ThemeLanguageBar';

interface HeaderProps {
  onPortalClick?: () => void;
  onDemoClick?: () => void;
  brandName?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onPortalClick, 
  onDemoClick,
  brandName = 'MEDPACS' 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { label: t('header.home'), href: '#home' },
    { label: t('header.solutions'), href: '#solucoes' },
    { label: t('header.workstation'), href: '#visualizador' },
    { label: t('header.calculator'), href: '#calculadora' },
    { label: t('header.faq'), href: '#faq' },
    { label: t('header.contact'), href: '#contato' },
  ];

  return (
    <>
      {/* Top Banner de Avisos e Status */}
      <div className="top-announcement-bar">
        <div className="top-bar-container">
          <div className="top-bar-left">
            <span className="live-status-pill">
              <span className="live-dot"></span>
              {t('topbar.status')}
            </span>
            <span className="top-bar-divider">•</span>
            <span className="top-bar-promo">
              <Sparkles size={13} className="text-amber" />
              {t('topbar.promo')}
            </span>
          </div>

          <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a href="tel:5582987654321" className="top-bar-phone">
              <PhoneCall size={12} />
              <span>{t('topbar.phone')}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Header Sticky */}
      <header className="landing-header">
        <div className="header-container">
          {/* LOGO */}
          <div className="header-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="logo-icon-glow">
              <Activity size={22} className="pulse-svg" />
            </div>
            <div className="logo-text-block">
              <span className="logo-brand">
                {brandName}<strong>CLOUD</strong>
              </span>
              <span className="logo-sub">{t('header.brandSubtitle')}</span>
            </div>
          </div>

          {/* Menus Páginas Desktop */}
          <nav className="header-nav">
            {navLinks.map((item, index) => (
              <a 
                key={index} 
                href={item.href} 
                className="nav-link"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Botões de Ação (CTAs) & Controles de Tema/Idioma */}
          <div className="header-actions">
            <ThemeLanguageBar />

            <button 
              className="btn-header-demo" 
              onClick={onDemoClick}
            >
              {t('header.demo')}
            </button>

            <button
              className="btn-portal"
              onClick={onPortalClick}
              title={t('header.portal')}
            >
              <span>{t('header.portalShort')}</span>
              <ArrowRight size={15} />
            </button>

            {/* Botão Mobile Hamburger */}
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Menu Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <div className="mobile-nav-links">
              {navLinks.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="mobile-nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mobile-nav-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <ThemeLanguageBar />
              </div>
              <button 
                className="btn-header-demo full-width" 
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onDemoClick) onDemoClick();
                }}
              >
                {t('header.requestDemo')}
              </button>
              <button
                className="btn-portal full-width"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onPortalClick) onPortalClick();
                }}
              >
                {t('header.portal')}
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;

