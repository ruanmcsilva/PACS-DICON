import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pacsService } from '../services/api';

const Login: React.FC = () => {
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
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError('Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'white' }}>
            PACS Enterprise
          </h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)' }}>
            Insira suas credenciais médicas
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', fontSize: '0.875rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Usuário</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                outline: 'none',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                outline: 'none',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <input type="checkbox" style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }} />
              Salvar login
            </label>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Função de recuperação de senha será implementada em breve."); }} style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
              Esqueci a senha
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
            {loading ? 'Autenticando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
