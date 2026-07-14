import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Search, Eye, RefreshCw, Calendar, 
  User, Folder, Printer, X, ShieldCheck, ShieldAlert 
} from 'lucide-react';
import { pacsService } from '../services/api';

interface IReportItem {
  report_id: string;
  study_id: string;
  content: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  study_description: string | null;
  study_date: string | null;
  patient_name: string;
  patient_id: string;
  modality: string;
}

const ReportList = () => {
  const [reports, setReports] = useState<IReportItem[]>([]);
  const [filteredReports, setFilteredReports] = useState<IReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS"); // TODOS, DRAFT, FINAL

  // Detail Modal
  const [activeReport, setActiveReport] = useState<IReportItem | null>(null);

  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pacsService.getReports();
      setReports(data);
      setFilteredReports(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Erro ao carregar a lista de laudos salvos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filtering logic
  useEffect(() => {
    let result = reports;

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.patient_name.toLowerCase().includes(q) ||
        r.patient_id.toLowerCase().includes(q) ||
        (r.study_description && r.study_description.toLowerCase().includes(q)) ||
        (r.content && r.content.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== "TODOS") {
      result = result.filter(r => r.status === statusFilter);
    }

    setFilteredReports(result);
  }, [searchQuery, statusFilter, reports]);

  const handleOpenStudy = (studyId: string) => {
    navigate(`/viewer/${studyId}`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Stats calculation
  const totalDrafts = reports.filter(r => r.status === 'DRAFT').length;
  const totalFinals = reports.filter(r => r.status === 'FINAL').length;

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Laudos Médicos Salvos</h1>
          <p>Gerencie, revise e imprima os laudos (Rascunhos e Finalizados) emitidos para os exames.</p>
        </div>
        <button 
          onClick={fetchReports}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
          Atualizar
        </button>
      </header>

      {/* Stats Grid */}
      <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
        <div className="glass-card stat-card">
          <span className="stat-title">Total de Laudos</span>
          <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>{reports.length}</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Emitidos no sistema</span>
        </div>
        
        <div className="glass-card stat-card">
          <span className="stat-title">Rascunhos (Drafts)</span>
          <span className="stat-value" style={{ color: '#eab308' }}>{totalDrafts}</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Laudos aguardando revisão</span>
        </div>
        
        <div className="glass-card stat-card">
          <span className="stat-title">Laudos Finalizados</span>
          <span className="stat-value" style={{ color: '#10b981' }}>{totalFinals}</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Assinados e arquivados</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por paciente, ID ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 16px 12px 42px',
                color: 'white',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginRight: '8px' }}>Status do Laudo:</span>
          {["TODOS", "DRAFT", "FINAL"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.825rem',
                fontWeight: '600',
                border: '1px solid',
                borderColor: statusFilter === status 
                  ? (status === 'FINAL' ? '#10b981' : (status === 'DRAFT' ? '#eab308' : 'var(--accent-primary)'))
                  : 'var(--border-color)',
                background: statusFilter === status 
                  ? (status === 'FINAL' ? 'rgba(16, 185, 129, 0.15)' : (status === 'DRAFT' ? 'rgba(234, 179, 8, 0.15)' : 'var(--accent-active)'))
                  : 'transparent',
                color: statusFilter === status 
                  ? (status === 'FINAL' ? '#10b981' : (status === 'DRAFT' ? '#eab308' : 'var(--accent-primary)'))
                  : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (statusFilter !== status) {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (statusFilter !== status) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }
              }}
            >
              {status === "TODOS" ? "Todos" : (status === "DRAFT" ? "Rascunhos (Drafts)" : "Finalizados")}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table / Card Container */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
          <RefreshCw className="spin-animation" size={32} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Carregando laudos médicos...</span>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center', border: '1px solid #ef4444' }}>
          <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <h3>Erro ao carregar</h3>
          <p>{error}</p>
          <button 
            onClick={fetchReports}
            style={{
              marginTop: '16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Tentar Novamente
          </button>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="glass-card" style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <FileText size={48} style={{ color: 'var(--text-muted)' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>Nenhum laudo encontrado</h3>
          <p style={{ maxWidth: '450px', margin: 0 }}>
            {reports.length === 0 
              ? "Não há laudos salvos no sistema. Você pode elaborar e salvar laudos acessando o visualizador de imagens de qualquer exame."
              : "Nenhum laudo corresponde aos filtros aplicados."}
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Paciente</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Estudo / Exame</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Modalidade</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Data Exame</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Última Modificação</th>
                <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr 
                  key={report.report_id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background-color 0.2s' }}
                  className="table-row-hover"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Patient info */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600', color: 'white' }}>{report.patient_name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {report.patient_id}</span>
                    </div>
                  </td>
                  
                  {/* Study Description */}
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                    {report.study_description || "Sem descrição"}
                  </td>
                  
                  {/* Modality */}
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                    }}>
                      {report.modality}
                    </span>
                  </td>
                  
                  {/* Study Date */}
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                    {report.study_date ? report.study_date : 'N/A'}
                  </td>
                  
                  {/* Status */}
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      border: '1px solid',
                      borderColor: report.status === 'FINAL' ? '#10b981' : '#eab308',
                      color: report.status === 'FINAL' ? '#10b981' : '#eab308',
                      background: report.status === 'FINAL' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(234, 179, 8, 0.08)',
                    }}>
                      {report.status === 'FINAL' ? 'FINALIZADO' : 'RASCUNHO'}
                    </span>
                  </td>
                  
                  {/* Updated At */}
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                    {report.updated_at ? report.updated_at : 'N/A'}
                  </td>
                  
                  {/* Actions */}
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => setActiveReport(report)}
                        style={{
                          background: 'var(--accent-active)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          color: 'var(--accent-primary)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '0.825rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--accent-primary)';
                          e.currentTarget.style.color = 'var(--bg-app)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--accent-active)';
                          e.currentTarget.style.color = 'var(--accent-primary)';
                        }}
                      >
                        <Eye size={13} />
                        Ver Laudo
                      </button>
                      
                      <button
                        onClick={() => handleOpenStudy(report.study_id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontSize: '0.825rem',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        Abrir Exame
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Report Detail Modal */}
      {activeReport && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '24px',
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '850px',
            background: 'var(--bg-app)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                  Revisão de Laudo Médico
                </h3>
              </div>
              <button 
                onClick={() => setActiveReport(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Clinical Details Bar */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Paciente</span>
                  <span style={{ fontSize: '0.925rem', color: 'white', fontWeight: 600 }}>{activeReport.patient_name}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>ID Paciente</span>
                  <span style={{ fontSize: '0.925rem', color: 'var(--text-secondary)' }}>{activeReport.patient_id}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Exame / Estudo</span>
                  <span style={{ fontSize: '0.925rem', color: 'var(--text-secondary)' }}>{activeReport.study_description || 'Sem descrição'}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Modalidade / Data</span>
                  <span style={{ fontSize: '0.925rem', color: 'var(--text-secondary)' }}>{activeReport.modality} &bull; {activeReport.study_date}</span>
                </div>
              </div>

              {/* Status Badge inside view */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status:</span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  border: '1px solid',
                  borderColor: activeReport.status === 'FINAL' ? '#10b981' : '#eab308',
                  color: activeReport.status === 'FINAL' ? '#10b981' : '#eab308',
                  background: activeReport.status === 'FINAL' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(234, 179, 8, 0.08)',
                }}>
                  {activeReport.status === 'FINAL' ? 'FINALIZADO (ASSINADO)' : 'RASCUNHO (DRAFT)'}
                </span>
                
                <span style={{ flex: 1 }}></span>
                
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Salvo em: {activeReport.updated_at}
                </span>
              </div>

              {/* Report Text Sheet */}
              <div style={{
                background: '#020617',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '24px',
                minHeight: '260px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
              }}>
                <div style={{
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                }}>
                  {activeReport.content || 'Nenhum laudo redigido para este exame.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.4)',
            }}>
              <button
                onClick={handlePrint}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              >
                <Printer size={15} />
                Imprimir Laudo
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setActiveReport(null);
                    handleOpenStudy(activeReport.study_id);
                  }}
                  style={{
                    background: 'var(--accent-active)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    color: 'var(--accent-primary)',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-primary)';
                    e.currentTarget.style.color = 'var(--bg-app)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--accent-active)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }}
                >
                  Revisar no Viewer
                </button>
                
                <button 
                  onClick={() => setActiveReport(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print-Friendly Layout (Uses index.css print styling classes) */}
      {activeReport && (
        <div className="print-area" style={{ padding: '40px', color: 'black', background: 'white' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '3px solid black', paddingBottom: '16px' }}>
            <h1 style={{ color: 'black', margin: '0 0 8px 0', fontSize: '24px', letterSpacing: '0.05em', fontWeight: 'bold' }}>PACS-DICOM ENTERPRISE</h1>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>RELATÓRIO DE LAUDO MÉDICO</h3>
          </div>
          
          <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse', marginBottom: '40px', fontSize: '14px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid black', padding: '10px', fontWeight: 'bold', width: '20%' }}>Paciente:</td>
                <td style={{ border: '1px solid black', padding: '10px', width: '30%' }}>{activeReport.patient_name}</td>
                <td style={{ border: '1px solid black', padding: '10px', fontWeight: 'bold', width: '20%' }}>ID Paciente:</td>
                <td style={{ border: '1px solid black', padding: '10px', width: '30%' }}>{activeReport.patient_id}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '10px', fontWeight: 'bold' }}>Exame/Estudo:</td>
                <td style={{ border: '1px solid black', padding: '10px' }}>{activeReport.study_description || 'Sem descrição'}</td>
                <td style={{ border: '1px solid black', padding: '10px', fontWeight: 'bold' }}>Data do Exame:</td>
                <td style={{ border: '1px solid black', padding: '10px' }}>{activeReport.study_date}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '10px', fontWeight: 'bold' }}>Modalidade:</td>
                <td style={{ border: '1px solid black', padding: '10px' }}>{activeReport.modality}</td>
                <td style={{ border: '1px solid black', padding: '10px', fontWeight: 'bold' }}>Status do Laudo:</td>
                <td style={{ border: '1px solid black', padding: '10px', fontWeight: 'bold', color: activeReport.status === 'FINAL' ? '#000' : '#444' }}>
                  {activeReport.status === 'FINAL' ? 'FINALIZADO' : 'RASCUNHO (DRAFT)'}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ minHeight: '350px', borderBottom: '1px solid #000', paddingBottom: '30px' }}>
            <h3 style={{ borderBottom: '1px solid black', paddingBottom: '6px', fontSize: '16px', color: 'black' }}>DESCRIÇÃO E ACHADOS CLÍNICOS</h3>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: '1.8', 
              fontSize: '15px', 
              fontFamily: 'Courier, monospace',
              color: 'black',
              marginTop: '16px',
            }}>
              {activeReport.content || 'Nenhum conteúdo redigido neste laudo.'}
            </div>
          </div>

          <div style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '280px', borderTop: '1px dashed black', margin: '0 auto 8px' }}></div>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Assinatura Médica Responsável</span>
            <span style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Emitido via Sistema PACS-DICOM em {new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportList;
