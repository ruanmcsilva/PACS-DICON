import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { pacsService } from '../services/api';
import { useLanguage } from '../../core/context/LanguageContext';
import ThemeLanguageBar from '../../core/layout/ThemeLanguageBar';
import { ArrowLeft } from 'lucide-react';

const Login: React.FC = () => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const data = await pacsService.login(username, password);
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        navigate('/worklist');
      }
    } catch (err) {
      console.error(err);
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      padding: '24px'
    }}>
      {/* Top Controls */}
      <div className="login-header-controls" style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        right: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10
      }}>
        <Link 
          to="/" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: 'var(--text-secondary)', 
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            padding: '8px 14px',
            borderRadius: '9999px',
            background: 'var(--accent-active)',
            border: '1px solid var(--border-color)'
          }}
        >
          <ArrowLeft size={16} />
          <span>{t('login.backHome')}</span>
        </Link>
        <ThemeLanguageBar />
      </div>

      <div className="glass-card login-card" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('login.title')}
          </h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)' }}>
            {t('login.subtitle')}
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', fontSize: '0.875rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('login.username')}</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: admin ou usuario@clinica.com"
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('login.password')}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha..."
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-app)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <input type="checkbox" style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }} />
              {t('login.remember')}
            </label>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Função de recuperação de senha será implementada em breve."); }} style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
              {t('login.forgot')}
            </a>
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              marginTop: '8px',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loading ? t('login.loading') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

