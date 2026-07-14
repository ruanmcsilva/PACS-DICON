import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Film, Play, Trash2, Search, Eye, RefreshCw, 
  Calendar, User, Folder, Tag, X, ShieldAlert 
} from 'lucide-react';
import { pacsService } from '../services/api';

interface IVideoItem {
  series_id: string;
  series_description: string | null;
  modality: string;
  series_number: number | null;
  video_path: string;
  study_id: string;
  study_description: string | null;
  study_date: string | null;
  patient_name: string;
  patient_id: string;
}

const VideoList = () => {
  const [videos, setVideos] = useState<IVideoItem[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<IVideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModality, setSelectedModality] = useState("TODOS");

  // Video Modal
  const [activeVideo, setActiveVideo] = useState<IVideoItem | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);

  // Delete Confirmation
  const [videoToDelete, setVideoToDelete] = useState<IVideoItem | null>(null);

  const navigate = useNavigate();

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pacsService.getSeriesWithVideos();
      setVideos(data);
      setFilteredVideos(data);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Erro ao carregar a lista de gravações de vídeo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Filter logic
  useEffect(() => {
    let result = videos;

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => 
        v.patient_name.toLowerCase().includes(q) ||
        v.patient_id.toLowerCase().includes(q) ||
        (v.series_description && v.series_description.toLowerCase().includes(q)) ||
        (v.study_description && v.study_description.toLowerCase().includes(q))
      );
    }

    // Filter by modality
    if (selectedModality !== "TODOS") {
      result = result.filter(v => v.modality === selectedModality);
    }

    setFilteredVideos(result);
  }, [searchQuery, selectedModality, videos]);

  // Open Video Player
  const handlePlayVideo = async (video: IVideoItem) => {
    if (loadingVideoId) return;
    try {
      setLoadingVideoId(video.series_id);
      const blob = await pacsService.getSeriesVideo(video.series_id);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setActiveVideo(video);
    } catch (err) {
      console.error("Error loading video blob:", err);
      alert("Erro ao reproduzir o vídeo. Tente novamente.");
    } finally {
      setLoadingVideoId(null);
    }
  };

  // Close Video Player
  const handleCloseVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    setActiveVideo(null);
  };

  // Delete video file
  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;
    try {
      await pacsService.deleteSeriesVideo(videoToDelete.series_id);
      setVideos(prev => prev.filter(v => v.series_id !== videoToDelete.series_id));
      setVideoToDelete(null);
    } catch (err) {
      console.error("Error deleting video:", err);
      alert("Erro ao deletar a gravação de vídeo.");
    }
  };

  const handleOpenStudy = (studyId: string) => {
    navigate(`/viewer/${studyId}`);
  };

  // Extract unique modalities for filter pills
  const modalities = ["TODOS", ...Array.from(new Set(videos.map(v => v.modality)))];

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Gravações CINE (Vídeos)</h1>
          <p>Assista aos loops de exames e vídeos de ultrassom capturados pelo visualizador.</p>
        </div>
        <button 
          onClick={fetchVideos}
          className="btn-refresh"
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
          <span className="stat-title">Total de Gravações</span>
          <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>{videos.length}</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loops de CINE registrados</span>
        </div>
        
        <div className="glass-card stat-card">
          <span className="stat-title">Modalidades Ativas</span>
          <span className="stat-value">
            {Array.from(new Set(videos.map(v => v.modality))).join(', ') || 'Nenhuma'}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tipos de exames gravados</span>
        </div>
        
        <div className="glass-card stat-card">
          <span className="stat-title">Armazenamento</span>
          <span className="stat-value" style={{ fontSize: '1.75rem', lineHeight: '2.25rem', paddingTop: '6px' }}>MinIO S3</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Armazenados em nuvem/local seguro</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
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

        {/* Modality pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginRight: '8px' }}>Filtrar por Modalidade:</span>
          {modalities.map(mod => (
            <button
              key={mod}
              onClick={() => setSelectedModality(mod)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.825rem',
                fontWeight: '600',
                border: '1px solid',
                borderColor: selectedModality === mod ? 'var(--accent-primary)' : 'var(--border-color)',
                background: selectedModality === mod ? 'var(--accent-active)' : 'transparent',
                color: selectedModality === mod ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (selectedModality !== mod) {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedModality !== mod) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }
              }}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Main List Grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
          <RefreshCw className="spin-animation" size={32} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Carregando gravações CINE...</span>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center', border: '1px solid #ef4444' }}>
          <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <h3>Ocorreu um erro</h3>
          <p>{error}</p>
          <button 
            onClick={fetchVideos}
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
      ) : filteredVideos.length === 0 ? (
        <div className="glass-card" style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Film size={48} style={{ color: 'var(--text-muted)' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>Nenhum vídeo encontrado</h3>
          <p style={{ maxWidth: '400px', margin: 0 }}>
            {videos.length === 0 
              ? "Não há gravações CINE de exames salvas no sistema. Você pode gravar loops CINE acessando o visualizador de qualquer exame."
              : "Nenhum vídeo corresponde aos filtros de busca aplicados."}
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '24px' 
        }}>
          {filteredVideos.map(video => (
            <div 
              key={video.series_id}
              className="glass-card video-card-item"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Media Placeholder Preview Area */}
              <div 
                style={{
                  height: '160px',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color)',
                }}
                onClick={() => handlePlayVideo(video)}
              >
                {/* Visual medical grid background overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.05,
                  backgroundImage: 'radial-gradient(var(--text-muted) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}></div>

                <div 
                  className="play-hover-btn"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--accent-active)',
                    border: '2px solid var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)',
                    zIndex: 1,
                    transition: 'transform 0.2s, background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = 'var(--accent-active)';
                  }}
                >
                  {loadingVideoId === video.series_id ? (
                    <RefreshCw size={24} className="spin-animation" style={{ color: 'var(--accent-primary)' }} />
                  ) : (
                    <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
                  )}
                </div>

                {/* Modality Badge */}
                <span style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'var(--bg-app)',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--accent-primary)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                }}>
                  {video.modality}
                </span>

                <span style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                }}>
                  SÉRIE {video.series_number ?? 1}
                </span>
              </div>

              {/* Card Details */}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={14} style={{ color: 'var(--accent-primary)' }} />
                    {video.patient_name}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {video.patient_id}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    <Folder size={12} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={video.study_description ?? ''}>
                      {video.study_description || "Sem descrição de estudo"}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    <Tag size={12} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={video.series_description ?? ''}>
                      {video.series_description || `Série #${video.series_number ?? ''}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                    <span>{video.study_date ? video.study_date : 'Data Indisponível'}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  <button 
                    onClick={() => handlePlayVideo(video)}
                    disabled={loadingVideoId !== null}
                    style={{
                      flex: 1,
                      background: 'var(--accent-active)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: 'var(--accent-primary)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      cursor: loadingVideoId !== null ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      opacity: loadingVideoId !== null && loadingVideoId !== video.series_id ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (loadingVideoId === null) {
                        e.currentTarget.style.background = 'var(--accent-primary)';
                        e.currentTarget.style.color = 'var(--bg-app)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (loadingVideoId === null) {
                        e.currentTarget.style.background = 'var(--accent-active)';
                        e.currentTarget.style.color = 'var(--accent-primary)';
                      }
                    }}
                  >
                    {loadingVideoId === video.series_id ? (
                      <>
                        <RefreshCw size={14} className="spin-animation" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" />
                        Assistir
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => handleOpenStudy(video.study_id)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '6px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                    title="Abrir no Visualizador"
                  >
                    <Eye size={14} />
                  </button>

                  <button 
                    onClick={() => setVideoToDelete(video)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      borderRadius: '6px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#ef4444';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    title="Excluir vídeo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal Player */}
      {activeVideo && (
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
            maxWidth: '800px',
            background: 'var(--bg-app)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>
                  CINE Loop: {activeVideo.patient_name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ID: {activeVideo.patient_id} &bull; {activeVideo.modality} &bull; {activeVideo.series_description || `Série #${activeVideo.series_number}`}
                </span>
              </div>
              <button 
                onClick={handleCloseVideo}
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

            {/* Modal Content */}
            <div style={{
              background: '#020617',
              position: 'relative',
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {videoUrl && (
                <video 
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    maxHeight: '65vh',
                    display: 'block',
                  }}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              background: 'rgba(15, 23, 42, 0.4)',
            }}>
              <button
                onClick={() => {
                  handleCloseVideo();
                  handleOpenStudy(activeVideo.study_id);
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
                <Eye size={14} />
                Abrir Visualizador Completo
              </button>
              
              <button 
                onClick={handleCloseVideo}
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
      )}

      {/* Delete Confirmation Modal */}
      {videoToDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '24px',
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '450px',
            background: 'var(--bg-app)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            padding: '24px',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={20} />
              Excluir Gravação CINE?
            </h3>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 24px 0', lineHeight: '1.5' }}>
              Tem certeza que deseja excluir permanentemente o vídeo de <strong>{videoToDelete.patient_name}</strong>? 
              Esta gravação será removida do servidor e do armazenamento MinIO e não poderá ser recuperada.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setVideoToDelete(null)}
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
                Cancelar
              </button>

              <button
                onClick={handleDeleteVideo}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: 'white',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoList;
