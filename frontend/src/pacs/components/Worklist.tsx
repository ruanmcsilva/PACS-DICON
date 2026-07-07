import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IStudy } from '../types';
import { pacsService } from '../services/api';

const Worklist = () => {
    const [studies, setStudies] = useState<IStudy[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStudies = async () => {
            try {
                setLoading(true);
                const data = await pacsService.getStudies();
                setStudies(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching studies:", err);
                setError("Não foi possível carregar a lista de exames.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudies();
    }, []);

    const handleOpenViewer = async (studyId: string) => {
        try {
            // Pick the first series to display for now
            const series = await pacsService.getSeries(studyId);
            if (series.length > 0) {
                navigate(`/viewer/${series[0].id}`);
            } else {
                alert('Este exame não possui séries de imagens.');
            }
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
                <span style={{ fontSize: '0.875rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{studies.length} exames encontrados</span>
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
                                    {study.study_date ? new Date(study.study_date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                                    {study.study_description || '-'}
                                </td>
                                <td style={{ padding: '16px 24px' }}>
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
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Worklist;
