import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IStudy } from '../types';
import { pacsService } from '../services/api';
import { useLanguage } from '../../core/context/LanguageContext';

const Worklist = () => {
    const { t } = useLanguage();
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

    const fetchStudies = async (showLoading: boolean = true) => {
        try {
            if (showLoading) setLoading(true);
            const filters: any = {};
            if (filterName) filters.patient_name = filterName;
            if (filterId) filters.patient_id = filterId;
            if (filterDate) filters.study_date = filterDate;

            const data = await pacsService.getStudies(filters);
            setStudies(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching studies:", err);
            if (showLoading) setError("Não foi possível carregar a lista de exames.");
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudies(true);
        // Polling em tempo real a cada 4 segundos para detectar fatias e exames chegando
        const interval = setInterval(() => {
            fetchStudies(false);
        }, 4000);
        return () => clearInterval(interval);
    }, [filterName, filterId, filterDate]);

    const handleOpenViewer = async (studyId: string) => {
        try {
            navigate(`/viewer/${studyId}`);
        } catch (err) {
            console.error(err);
            alert('Erro ao carregar as imagens do exame.');
        }
    };

    const handleDeleteStudy = async (studyId: string) => {
        if (!window.confirm("Tem certeza que deseja excluir este exame? Todas as imagens, laudos e anotações serão removidos permanentemente.")) return;
        try {
            await pacsService.deleteStudy(studyId);
            fetchStudies();
        } catch (err) {
            console.error(err);
            alert("Erro ao excluir o exame.");
        }
    };


    if (loading) {
        return (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>{t('worklist.loading')}</p>
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
                <p>{t('worklist.empty')}</p>
            </div>
        );
    }

    return (
        <div className="glass-card worklist-card" style={{ overflow: 'hidden' }}>
            <div className="worklist-header" style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h3 style={{ margin: 0 }}>{t('portal.title')}</h3>
                <div className="worklist-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{studies.length} {t('worklist.studiesFound')}</span>
                    <button 
                        onClick={() => setIsUploadModalOpen(true)}
                        className="btn-worklist-import"
                        style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                        {t('worklist.importDicom')}
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="btn-worklist-logout"
                        style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600 }}
                    >
                        {t('worklist.logout')}
                    </button>
                </div>
            </div>
            
            {/* Barra de Pesquisa */}
            <div className="worklist-search-bar" style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <div className="worklist-search-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px', minWidth: '160px' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('worklist.filterPatient')}</label>
                    <input 
                        type="text" 
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        placeholder={t('worklist.filterPatientPlaceholder')}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
                <div className="worklist-search-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 160px', minWidth: '140px' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('worklist.filterId')}</label>
                    <input 
                        type="text" 
                        value={filterId}
                        onChange={(e) => setFilterId(e.target.value)}
                        placeholder={t('worklist.filterIdPlaceholder')}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
                <div className="worklist-search-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 160px', minWidth: '140px' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('worklist.filterDate')}</label>
                    <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
                <button 
                    onClick={fetchStudies}
                    className="btn-worklist-search"
                    style={{ padding: '8px 24px', height: '42px', borderRadius: '6px', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }}
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                    {t('worklist.filterSearch', 'Buscar')}
                </button>
            </div>
            
            <div className="worklist-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="worklist-table" style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500 }}>{t('worklist.colId')}</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500 }}>{t('worklist.colPatient')}</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500 }}>{t('worklist.colDate')}</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500 }}>{t('worklist.colDescription')}</th>
                            <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500 }}>{t('worklist.colActions')}</th>
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
                                        <div style={{ display: 'flex', gap: '8px' }}>
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
                                                {t('worklist.btnView')}
                                            </button>
                                            
                                            <button style={{
                                                background: 'transparent',
                                                border: '1px solid #ef4444',
                                                color: '#ef4444',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = '#ef4444';
                                                e.currentTarget.style.color = '#fff';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = '#ef4444';
                                            }}
                                            onClick={() => handleDeleteStudy(study.id)}
                                            title={t('worklist.btnDelete')}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                            </button>
                                        </div>
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
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)', padding: '16px' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: 'min(500px, 100%)', padding: 'clamp(20px, 4vw, 32px)', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Fazer Upload de Exame</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}>✕</button>
                        </div>
                        
                        <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: 'clamp(20px, 4vw, 36px)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>
                            <div>
                                <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: 'var(--text-primary)' }}>Arraste seus arquivos DICOM aqui</p>
                                <p style={{ margin: 0, fontSize: '0.85rem' }}>ou clique abaixo para procurar no computador</p>
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
                                <div style={{ padding: '10px 20px', backgroundColor: 'var(--accent-primary)', color: 'white', borderRadius: '8px', fontWeight: 600, display: 'inline-block', opacity: uploading ? 0.7 : 1, fontSize: '0.9rem' }}>
                                    {uploading ? 'Enviando arquivos...' : 'Selecionar Arquivos'}
                                </div>
                            </label>
                        </div>
                        
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            Nota: Os arquivos serão enviados para fila e processados em segundo plano.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Worklist;
