import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './core/layout/Sidebar';
import { pacsService } from './pacs/services/api';
import Worklist from './pacs/components/Worklist';
import Viewer from './pacs/components/Viewer';
import Login from './pacs/components/Login';
import VideoList from './pacs/components/VideoList';
import ReportList from './pacs/components/ReportList';
import CommunicationSettings from './pacs/components/CommunicationSettings';
import Header from './pacs/partials/Header';
import Hero from './pacs/partials/Hero';
import StatsSection from './pacs/partials/StatsSection';
import SolutionsSection from './pacs/partials/SolutionsSection';
import ModalitiesSection from './pacs/partials/ModalitiesSection';
import ComparisonSection from './pacs/partials/ComparisonSection';
import RoiCalculatorSection from './pacs/partials/RoiCalculatorSection';
import TestimonialsSection from './pacs/partials/TestimonialsSection';
import FaqSection from './pacs/partials/FaqSection';
import ContactSection from './pacs/partials/ContactSection';
import DemoModal from './pacs/partials/DemoModal';
import Footer from './pacs/partials/Footer';
import SupportWidget from './pacs/partials/SupportWidget';
import WhatsAppButton from './pacs/partials/WhatsAppButton';
import { ThemeProvider } from './core/context/ThemeContext';
import { LanguageProvider, useLanguage } from './core/context/LanguageContext';
import ThemeLanguageBar from './core/layout/ThemeLanguageBar';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function Home() {
  const navigate = useNavigate();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div className="home-wrapper" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      <Header 
        onPortalClick={() => navigate('/login')} 
        onDemoClick={() => setIsDemoModalOpen(true)}
        brandName="MEDPACS"
      />
      <main style={{ flex: 1 }}>
        <Hero 
          onDemoClick={() => setIsDemoModalOpen(true)} 
          onPortalClick={() => navigate('/login')} 
        />
        <StatsSection />
        <SolutionsSection onOpenDemo={() => setIsDemoModalOpen(true)} />
        <ModalitiesSection />
        <ComparisonSection onOpenDemo={() => setIsDemoModalOpen(true)} />
        <RoiCalculatorSection onOpenDemo={() => setIsDemoModalOpen(true)} />
        <TestimonialsSection onOpenDemo={() => setIsDemoModalOpen(true)} />
        <FaqSection />
        <ContactSection whatsappNumber="5582987654321" />
      </main>
      <Footer />
      <WhatsAppButton phoneNumber="5582987654321" />
      <SupportWidget companyName="MEDPACS Cloud" whatsappNumber="5582987654321" />
      <DemoModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
        whatsappNumber="5582987654321" 
      />
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const { t } = useLanguage();
  const isVideosPath = location.pathname === '/videos';
  const isReportsPath = location.pathname === '/reports';
  const isCommunicationPath = location.pathname === '/communication';
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [stats, setStats] = useState({
    studies_today: 0,
    total_instances: 0,
    pending_reports: 0
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const data = await pacsService.getStats();
        if (isMounted && data) {
          setStats(data);
        }
      } catch (err) {
        // Keeps previous or default values gracefully if backend is offline
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="app-container">
      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
      <main className="main-content">
        {/* Top bar with theme & language toggle */}
        <div className="portal-top-bar glass-card">
          <div className="portal-top-left">
            <button 
              className="portal-mobile-menu-btn" 
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Abrir menu de navegação"
            >
              <Menu size={20} />
            </button>
            <span className="portal-badge-pill">
              <span className="live-dot"></span>
              MEDPACS CLOUD • Online
            </span>
          </div>
          <div className="portal-top-right">
            <ThemeLanguageBar />
          </div>
        </div>

        {isVideosPath ? (
          <VideoList />
        ) : isReportsPath ? (
          <ReportList />
        ) : isCommunicationPath ? (
          <CommunicationSettings />
        ) : (
          <>
            <header style={{ marginBottom: '32px' }}>
              <h1>{t('portal.title')}</h1>
              <p>{t('portal.subtitle')}</p>
            </header>

            <div className="dashboard-grid">
              <div className="glass-card stat-card">
                <span className="stat-title">{t('portal.studiesToday')}</span>
                <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>
                  {stats.studies_today}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('portal.studiesTodaySub')}</span>
              </div>
              
              <div className="glass-card stat-card">
                <span className="stat-title">{t('portal.imagesProcessed')}</span>
                <span className="stat-value">
                  {stats.total_instances.toLocaleString('pt-BR')}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('portal.imagesProcessedSub')}</span>
              </div>
              
              <div className="glass-card stat-card">
                <span className="stat-title">{t('portal.pendingReports')}</span>
                <span className="stat-value" style={{ color: '#f43f5e' }}>
                  {stats.pending_reports}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('portal.pendingReportsSub')}</span>
              </div>
            </div>
            
            <div style={{ marginTop: '32px' }}>
              <Worklist />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/worklist" element={<PrivateRoute><AppLayout /></PrivateRoute>} />
            <Route path="/videos" element={<PrivateRoute><AppLayout /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><AppLayout /></PrivateRoute>} />
            <Route path="/communication" element={<PrivateRoute><AppLayout /></PrivateRoute>} />
            <Route path="/viewer/:studyId" element={<PrivateRoute><Viewer /></PrivateRoute>} />
          </Routes>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;


