import React from 'react';
import { Activity, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../../core/context/LanguageContext';

export const Footer: React.FC = () => {
    const { t } = useLanguage();

    return (
        <footer className="landing-footer">
            <div className="footer-container">

                {/* COLUNA 1: LOGO E SOBRE */}
                <div className="footer-col footer-brand">
                    <div className="footer-logo">
                        <Activity size={24} color="var(--accent-primary)" />
                        <span className="logo-text">
                            MEDPACS<strong>CLOUD</strong>
                        </span>
                    </div>
                    <p className="footer-description">
                        {t('footer.description')}
                    </p>

                    {/* REDES SOCIAIS COM ÍCONES VETORIAIS */}
                    <div className="social-links">
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z" />
                            </svg>
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                            </svg>
                        </a>
                        <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="WhatsApp">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.09-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.22.25-.86.84-.86 2.06 0 1.21.89 2.39 1.01 2.55.12.17 1.74 2.66 4.22 3.73.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.18-.47-.3Z" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* COLUNA 2: NAVEGAÇÃO */}
                <div className="footer-col">
                    <h4 className="footer-title">{t('footer.navigation')}</h4>
                    <ul className="footer-links">
                        <li><a href="#home">{t('header.home')}</a></li>
                        <li><a href="#solucoes">{t('header.solutions')}</a></li>
                        <li><a href="#visualizador">{t('header.workstation')}</a></li>
                        <li><a href="#calculadora">{t('header.calculator')}</a></li>
                        <li><a href="#contato">{t('header.contact')}</a></li>
                    </ul>
                </div>

                {/* COLUNA 3: RECURSOS */}
                <div className="footer-col">
                    <h4 className="footer-title">{t('footer.solutions')}</h4>
                    <ul className="footer-links">
                        <li><a href="#visualizador">{t('simulator.title')}</a></li>
                        <li><a href="#solucoes">{t('solutions.tabPacs')}</a></li>
                        <li><a href="#solucoes">{t('solutions.tabAi')}</a></li>
                        <li><a href="#solucoes">{t('solutions.tabPortal')}</a></li>
                    </ul>
                </div>

                {/* COLUNA 4: CONTATO */}
                <div className="footer-col">
                    <h4 className="footer-title">{t('footer.contact')}</h4>
                    <div className="footer-contact">
                        <div className="contact-item">
                            <Mail size={16} color="var(--accent-primary)" />
                            <span>comercial@medpacs.com.br</span>
                        </div>
                        <div className="contact-item">
                            <Phone size={16} color="var(--accent-primary)" />
                            <span>+55 (82) 98765-4321</span>
                        </div>
                        <div className="contact-item">
                            <MapPin size={16} color="var(--accent-primary)" />
                            <span>Maceió, AL - Brasil</span>
                        </div>
                        <div className="support-badge">
                            <span className="pulse-dot"></span>
                            {t('topbar.status')}
                        </div>
                    </div>
                </div>

            </div>

            {/* LINHA INFERIOR DE COPYRIGHT */}
            <div className="footer-bottom">
                <div className="footer-bottom-container">
                    <p>© {new Date().getFullYear()} MEDPACS CLOUD Enterprise. {t('footer.rights')}</p>
                    <div className="legal-links">
                        <a href="#privacidade">Privacidade</a>
                        <span>•</span>
                        <a href="#termos">Termos de Uso</a>
                        <span>•</span>
                        <a href="#seguranca">Segurança LGPD</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
