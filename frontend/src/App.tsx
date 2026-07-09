import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './core/layout/Sidebar';
import Worklist from './pacs/components/Worklist';
import Viewer from './pacs/components/Viewer';
import Login from './pacs/components/Login';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function AppLayout() {
  return (
    <div className="app-container">
      {/* Sidebar - Fixa na esquerda */}
      <Sidebar />
      
      {/* Área Principal de Conteúdo */}
      <main className="main-content">
        <header style={{ marginBottom: '32px' }}>
          <h1>Worklist de Exames</h1>
          <p>Visão geral dos pacientes e estudos recebidos pelo Servidor DICOM.</p>
        </header>

        {/* Dashboard Placeholder - Grid de estatísticas */}
        <div className="dashboard-grid">
          <div className="glass-card stat-card">
            <span className="stat-title">Estudos Hoje</span>
            <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>12</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>+3% em relação a ontem</span>
          </div>
          
          <div className="glass-card stat-card">
            <span className="stat-title">Imagens Processadas</span>
            <span className="stat-value">3,450</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Armazenadas no MinIO</span>
          </div>
          
          <div className="glass-card stat-card">
            <span className="stat-title">Laudos Pendentes</span>
            <span className="stat-value" style={{ color: '#f43f5e' }}>4</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Requer atenção imediata</span>
          </div>
        </div>
        
        {/* Lista de pacientes dinâmica */}
        <div style={{ marginTop: '32px' }}>
          <Worklist />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>} />
        <Route path="/viewer/:studyId" element={<PrivateRoute><Viewer /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
