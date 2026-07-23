import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IStudy } from '../types';
import { pacsService } from '../services/api';

const Worklist = () => {
    const [studies, setStudies] = useState<IStudy[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filtros
    const [filterName, setFilterName] = useState("");
    const [filterId, setFilterId] = useState("");
    const [filterDate, setFilterDate] = useState("");
    
    // Upload Modal
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        
        try {
            setUploading(true);
            await pacsService.uploadDicom(event.target.files);
            alert("Arquivos enviados com sucesso! O sistema processará em segundo plano.");
            setIsUploadModalOpen(false);
            
            setTimeout(() => fetchStudies(), 2000);
            
        } catch (err) {
            console.error(err);
            alert("Erro ao fazer upload dos arquivos.");
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const fetchStudies = async () => {
        try {
            setLoading(true);
            const filters: any = {};
            if (filterName) filters.patient_name = filterName;
            if (filterId) filters.patient_id = filterId;
            if (filterDate) filters.study_date = filterDate;

            const data = await pacsService.getStudies(filters);
            setStudies(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching studies:", err);
            setError("Não foi possível carregar a lista de exames.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudies();
    }, []);

    const handleOpenViewer = async (studyId: string) => {
        try {
            navigate(`/viewer/${studyId}`);
        } catch (err) {
            console.error(err);
            alert('Erro ao carregar as imagens do exame.');
        }
    };

    if (loading) {
        return (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>Carregando exames...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: '#f43f5e' }}>
                <p>{error}</p>
            </div>
        );
    }

    if (studies.length === 0) {
        return (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.5 }}>
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <p>Nenhum exame recebido ainda. Envie um ping (C-ECHO) ou imagem (C-STORE) para a porta 11112.</p>
            </div>
        );
    }

    return (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Worklist de Exames</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{studies.length} exames encontrados</span>
                    <button 
                        onClick={() => setIsUploadModalOpen(true)}
                        style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                        Importar DICOM
                    </button>
                    <button 
                        onClick={handleLogout}
                        style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Sair
                    </button>
                </div>
            </div>
            
            {/* Barra de Pesquisa */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Nome do Paciente</label>
                    <input 
                        type="text" 
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        placeholder="Buscar por nome..."
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID do Paciente</label>
                    <input 
                        type="text" 
                        value={filterId}
                        onChange={(e) => setFilterId(e.target.value)}
                        placeholder="Buscar por ID..."
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Data do Exame</label>
                    <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', colorScheme: 'dark' }}
                    />
                </div>
                <button 
                    onClick={fetchStudies}
                    style={{ padding: '8px 24px', height: '42px', borderRadius: '6px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                    Buscar
                </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500 }}>ID Paciente</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500 }}>Nome do Paciente</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500 }}>Data do Exame</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500 }}>Descrição</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500 }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studies.map((study) => (
                            <tr key={study.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '16px 24px', fontFamily: 'monospace' }}>
                                    {study.patient?.patient_id || 'N/A'}
                                </td>
                                <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                                    {study.patient?.patient_name || 'Desconhecido'}
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                    {study.study_date ? (() => {
                                        try {
                                            const d = new Date(study.study_date);
                                            return isNaN(d.getTime()) ? 'Data Inválida' : d.toLocaleDateString();
                                        } catch {
                                            return 'Erro';
                                        }
                                    })() : 'N/A'}
                                </td>
                                <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                                    {study.study_description || '-'}
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                    {(study.series_count !== undefined && study.series_count > 0) ? (
                                        <button style={{
                                            background: 'transparent',
                                            border: '1px solid var(--accent-primary)',
                                            color: 'var(--accent-primary)',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.background = 'var(--accent-primary)';
                                            e.currentTarget.style.color = '#fff';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'var(--accent-primary)';
                                        }}
                                        onClick={() => handleOpenViewer(study.id)}
                                        >
                                            Abrir Viewer
                                        </button>
                                    ) : (
                                        <span style={{ 
                                            display: 'inline-block',
                                            padding: '8px 12px', 
                                            borderRadius: '8px', 
                                            backgroundColor: 'rgba(245, 158, 11, 0.2)', 
                                            color: '#fbbf24', 
                                            border: '1px solid #f59e0b',
                                            fontSize: '0.875rem',
                                            fontWeight: 600 
                                        }}>
                                            ⏳ Aguardando Imagens...
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Upload */}
            {isUploadModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Fazer Upload de Exame</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                        </div>
                        
                        <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>
                            <div>
                                <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: 'var(--text-primary)' }}>Arraste seus arquivos DICOM aqui</p>
                                <p style={{ margin: 0, fontSize: '0.875rem' }}>ou clique abaixo para procurar no computador</p>
                            </div>
                            
                            <label style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
                                <input 
                                    type="file" 
                                    multiple 
                                    accept=".dcm"
                                    onChange={handleUpload}
                                    style={{ display: 'none' }}
                                    disabled={uploading}
                                />
                                <div style={{ padding: '10px 24px', backgroundColor: 'var(--accent-primary)', color: 'white', borderRadius: '8px', fontWeight: 600, display: 'inline-block', opacity: uploading ? 0.7 : 1 }}>
                                    {uploading ? 'Enviando arquivos...' : 'Selecionar Arquivos'}
                                </div>
                            </label>
                        </div>
                        
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            Nota: Os arquivos serão enviados para fila e processados em segundo plano.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Worklist;
