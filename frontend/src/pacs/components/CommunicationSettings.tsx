import React, { useState, useEffect } from 'react';
import { Server, Plus, Trash2, Wifi, WifiOff, ShieldAlert, CheckCircle } from 'lucide-react';
import { pacsService } from '../services/api';

interface IDicomNode {
  id: string;
  name: string;
  ae_title: string;
  ip_address: string;
  port: number;
  created_at: string;
}

export default function CommunicationSettings() {
  const [nodes, setNodes] = useState<IDicomNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [aeTitle, setAeTitle] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Connection testing state (keyed by node ID)
  const [testingStatus, setTestingStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'failed'>>({});

  const fetchNodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pacsService.getDicomNodes();
      setNodes(data);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar os dispositivos cadastrados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !aeTitle.trim() || !ipAddress.trim() || !port.trim()) {
      setFormError('Todos os campos são obrigatórios.');
      return;
    }

    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
      setFormError('A porta TCP deve ser um número entre 1 e 65535.');
      return;
    }

    // IP validation regex (supports IPv4 or hostnames like 'localhost')
    const ipPattern = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/;
    const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipv4Pattern.test(ipAddress) && !ipPattern.test(ipAddress)) {
      setFormError('Digite um endereço IP ou hostname válido.');
      return;
    }

    try {
      setSubmitting(true);
      const newNode = await pacsService.createDicomNode({
        name,
        ae_title: aeTitle.toUpperCase(),
        ip_address: ipAddress,
        port: portNum,
      });

      setNodes((prev) => [...prev, newNode].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setAeTitle('');
      setIpAddress('');
      setPort('');
      alert('Dispositivo cadastrado com sucesso!');
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Erro ao cadastrar o dispositivo.';
      setFormError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNode = async (id: string, nodeName: string) => {
    if (!confirm(`Deseja realmente remover o dispositivo "${nodeName}"?`)) {
      return;
    }

    try {
      await pacsService.deleteDicomNode(id);
      setNodes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir o dispositivo.');
    }
  };

  const handleTestConnection = (id: string, aeTitle: string) => {
    setTestingStatus((prev) => ({ ...prev, [id]: 'testing' }));
    
    // Simulate connectivity testing (C-ECHO)
    setTimeout(() => {
      // For demonstration, let's randomly succeed or fail, or check if it matches a dummy AE
      const success = Math.random() > 0.3; // 70% success chance for mockup
      setTestingStatus((prev) => ({ 
        ...prev, 
        [id]: success ? 'success' : 'failed' 
      }));
    }, 1500);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header>
        <h1 style={{ marginBottom: '8px' }}>Configuração de Comunicação DICOM</h1>
        <p style={{ margin: 0 }}>Gerencie os dispositivos (CT, RM, Workstations) autorizados a se comunicar e transferir exames.</p>
      </header>

      {error && (
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Lista de Dispositivos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#e2e8f0' }}>Equipamentos Cadastrados</h2>
          
          {loading ? (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Carregando lista de equipamentos...
            </div>
          ) : nodes.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <Server size={48} color="#475569" />
              <div>
                <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--text-primary)' }}>Nenhum dispositivo cadastrado</p>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Utilize o formulário lateral para registrar modalidades e estações.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {nodes.map((node) => {
                const status = testingStatus[node.id] || 'idle';
                return (
                  <div key={node.id} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-primary)', display: 'flex' }}>
                        <Server size={24} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '1rem', color: '#f8fafc' }}>{node.name}</span>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                          <span><strong style={{ color: 'var(--text-primary)' }}>AE Title:</strong> {node.ae_title}</span>
                          <span>|</span>
                          <span><strong style={{ color: 'var(--text-primary)' }}>Endereço:</strong> {node.ip_address}:{node.port}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Connection testing trigger/status */}
                      {status === 'idle' && (
                        <button
                          onClick={() => handleTestConnection(node.id, node.ae_title)}
                          className="btn-echo"
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            color: 'var(--accent-primary)',
                            border: '1px solid var(--accent-primary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Wifi size={14} /> C-ECHO
                        </button>
                      )}
                      {status === 'testing' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Wifi size={14} className="pulse" style={{ color: 'var(--accent-primary)' }} /> Testando...
                        </span>
                      )}
                      {status === 'success' && (
                        <span
                          onClick={() => handleTestConnection(node.id, node.ae_title)}
                          style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' }}
                        >
                          <CheckCircle size={14} /> Conectado
                        </span>
                      )}
                      {status === 'failed' && (
                        <span
                          onClick={() => handleTestConnection(node.id, node.ae_title)}
                          style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '4px' }}
                        >
                          <WifiOff size={14} /> Sem Resposta
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteNode(node.id, node.name)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px',
                          display: 'flex',
                          transition: 'color 0.2s, background-color 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Formulário de Cadastro */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#e2e8f0' }}>Novo Equipamento</h2>
          
          <form onSubmit={handleAddNode} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nome do Dispositivo</label>
              <input
                type="text"
                placeholder="Ex: Tomógrafo Sala 2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>AE Title DICOM</label>
              <input
                type="text"
                placeholder="Ex: CT_ROOM_2"
                value={aeTitle}
                onChange={(e) => setAeTitle(e.target.value)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Endereço IP / Hostname</label>
              <input
                type="text"
                placeholder="Ex: 192.168.1.152"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Porta TCP</label>
              <input
                type="text"
                placeholder="Ex: 104"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {formError && (
              <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px' }}>
                * {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: '8px',
                padding: '12px',
                borderRadius: '8px',
                background: 'linear-gradient(90deg, var(--accent-primary), #0891b2)',
                color: '#0f172a',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.filter = 'brightness(1.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
            >
              <Plus size={18} /> Adicionar Equipamento
            </button>
          </form>
        </div>

      </div>

      <style>{`
        .pulse {
          animation: test-pulse 1s infinite alternate;
        }
        @keyframes test-pulse {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .btn-echo:hover {
          background-color: var(--accent-hover) !important;
          color: #0f172a !important;
        }
      `}</style>
    </div>
  );
}
