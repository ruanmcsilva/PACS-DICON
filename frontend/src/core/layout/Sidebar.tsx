import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, Home, X } from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { t } = useLanguage();

  const handleLogout = () => {
    localStorage.removeItem('token');
    onClose?.();
    navigate('/login');
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <>
      {/* Backdrop para fechar o menu no Mobile/Tablet ao tocar fora */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onClose} 
          aria-label="Fechar menu lateral"
        />
      )}

      <nav className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header-row">
          <div className="sidebar-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              <path d="M5 3v4"/>
              <path d="M19 17v4"/>
              <path d="M3 5h4"/>
              <path d="M17 19h4"/>
            </svg>
            <span>MEDPACS</span>
          </div>

          {/* Botão de Fechar no Mobile */}
          <button 
            className="sidebar-close-btn" 
            onClick={onClose}
            aria-label="Fechar navegação"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="sidebar-nav">
          <Link to="/worklist" onClick={handleLinkClick} className={`nav-item ${currentPath === '/worklist' ? 'active' : ''}`}>
            {t('sidebar.worklist')}
          </Link>
          <Link to="/videos" onClick={handleLinkClick} className={`nav-item ${currentPath === '/videos' ? 'active' : ''}`}>
            {t('sidebar.videos')}
          </Link>
          <Link to="/reports" onClick={handleLinkClick} className={`nav-item ${currentPath === '/reports' ? 'active' : ''}`}>
            {t('sidebar.reports')}
          </Link>
          <span className="nav-item" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            {t('sidebar.hl7')}
          </span>
        </div>
        
        {/* Spacer to push admin to bottom */}
        <div style={{ flex: 1 }}></div>

        <div className="sidebar-nav" style={{ paddingBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/communication" onClick={handleLinkClick} className={`nav-item ${currentPath === '/communication' ? 'active' : ''}`}>
            {t('sidebar.settings')}
          </Link>
          <Link to="/" onClick={handleLinkClick} className="nav-item" title="Ir para Página Inicial">
            <Home size={16} style={{ marginRight: '8px' }} />
            <span>{t('header.home')}</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="nav-item" 
            style={{ background: 'transparent', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer', color: '#f43f5e' }}
          >
            <LogOut size={16} style={{ marginRight: '8px' }} />
            <span>{t('sidebar.logout')}</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;

