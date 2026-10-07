import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  ArrowRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Sliders, 
  Activity, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Ruler, 
  SunMedium, 
  Eye, 
  Layers 
} from 'lucide-react';
import { useLanguage } from '../../core/context/LanguageContext';

interface HeroProps {
  onDemoClick?: () => void;
  onPortalClick?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onDemoClick, onPortalClick }) => {
  const { t } = useLanguage();
  // Estado para o simulador interativo de Workstation DICOM
  const [activeModality, setActiveModality] = useState<'CT' | 'MR' | 'RX' | 'US'>('CT');
  const [activePreset, setActivePreset] = useState<'Cerebro' | 'Osso' | 'Pulmao' | 'PartesMoles'>('Cerebro');
  const [isInverted, setIsInverted] = useState(false);
  const [isPlayingCine, setIsPlayingCine] = useState(true);
  const [currentSlice, setCurrentSlice] = useState(28);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showMeasure, setShowMeasure] = useState(true);

  // Efeito Cine Loop automático
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingCine) {
      interval = setInterval(() => {
        setCurrentSlice((prev) => (prev >= 64 ? 1 : prev + 1));
      }, 140);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingCine]);

  // Filtros CSS conforme o preset selecionado
  const getFilterStyle = () => {
    let contrast = 1.1;
    let brightness = 1.0;

    switch (activePreset) {
      case 'Osso':
        contrast = 1.6;
        brightness = 1.25;
        break;
      case 'Pulmao':
        contrast = 2.0;
        brightness = 0.85;
        break;
      case 'PartesMoles':
        contrast = 1.35;
        brightness = 1.1;
        break;
      case 'Cerebro':
      default:
        contrast = 1.15;
        brightness = 1.05;
        break;
    }

    if (isInverted) {
      return {
        filter: `invert(1) contrast(${contrast}) brightness(${brightness})`,
        transform: `scale(${zoomLevel / 100})`,
        transition: 'filter 0.25s ease, transform 0.2s ease',
      };
    }

    return {
      filter: `contrast(${contrast}) brightness(${brightness})`,
      transform: `scale(${zoomLevel / 100})`,
      transition: 'filter 0.25s ease, transform 0.2s ease',
    };
  };

  const handleReset = () => {
    setIsInverted(false);
    setActivePreset('Cerebro');
    setZoomLevel(100);
    setShowMeasure(true);
    setCurrentSlice(28);
  };

  return (
    <section id="home" className="hero-section">
      <div className="hero-container">

        {/* 1. BADGE SUPERIOR COM PULSO */}
        <div className="hero-badge">
          <span className="badge-pulse-dot"></span>
          <Cloud size={15} className="badge-icon" />
          <span>{t('hero.badge')}</span>
        </div>

        {/* 2. TÍTULO PRINCIPAL */}
        <h1 className="hero-title">
          {t('hero.titlePre')} <br />
          <span className="hero-highlight">{t('hero.titleHighlight')}</span>
        </h1>

        {/* 3. SUBTÍTULO */}
        <p className="hero-subtitle">
          {t('hero.subtitle')}
        </p>

        {/* 4. BOTÕES DE AÇÃO (CTAs) */}
        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={onDemoClick}>
            <span>{t('hero.btnDemo')}</span>
            <ArrowRight size={18} />
          </button>

          <button className="btn-hero-secondary" onClick={onPortalClick}>
            <Activity size={18} />
            <span>{t('hero.btnPortal')}</span>
          </button>
        </div>

        {/* 5. SELOS DE CONFIANÇA E INFRAESTRUTURA */}
        <div className="hero-features">
          <div className="feature-item">
            <span className="status-dot"></span>
            {t('hero.pill1')}
          </div>
          <div className="feature-item">
            <span className="status-dot"></span>
            {t('hero.pill2')}
          </div>
          <div className="feature-item">
            <span className="status-dot"></span>
            {t('hero.pill3')}
          </div>
          <div className="feature-item">
            <span className="status-dot"></span>
            {t('hero.pill4')}
          </div>
        </div>


        {/* 6. WORKSTATION INTERATIVA DICOM SIMULADA */}
        <div id="visualizador" className="hero-workstation-wrapper">
          <div className="workstation-frame glass-card">
            
            {/* Barra de Ferramentas Superior da Workstation */}
            <div className="ws-toolbar">
              <div className="ws-brand-area">
                <span className="ws-dot red"></span>
                <span className="ws-dot yellow"></span>
                <span className="ws-dot green"></span>
                <span className="ws-title">MEDPACS Web Workstation • Visualizador DICOM 2D/3D</span>
              </div>

              {/* Seletor de Modalidade */}
              <div className="ws-modality-tabs">
                <button 
                  className={`ws-mod-btn ${activeModality === 'CT' ? 'active' : ''}`}
                  onClick={() => setActiveModality('CT')}
                >
                  TC Crânio
                </button>
                <button 
                  className={`ws-mod-btn ${activeModality === 'MR' ? 'active' : ''}`}
                  onClick={() => setActiveModality('MR')}
                >
                  RM Encéfalo
                </button>
                <button 
                  className={`ws-mod-btn ${activeModality === 'RX' ? 'active' : ''}`}
                  onClick={() => setActiveModality('RX')}
                >
                  RX Tórax
                </button>
                <button 
                  className={`ws-mod-btn ${activeModality === 'US' ? 'active' : ''}`}
                  onClick={() => setActiveModality('US')}
                >
                  US Abdômen
                </button>
              </div>

              {/* Botões de Ação da Barra */}
              <div className="ws-quick-actions">
                <button 
                  className={`ws-tool-btn ${isPlayingCine ? 'active' : ''}`}
                  onClick={() => setIsPlayingCine(!isPlayingCine)}
                  title={isPlayingCine ? 'Pausar Cine Loop' : 'Iniciar Cine Loop'}
                >
                  {isPlayingCine ? <Pause size={14} /> : <Play size={14} />}
                  <span>Cine ({currentSlice}/64)</span>
                </button>

                <button 
                  className={`ws-tool-btn ${isInverted ? 'active' : ''}`}
                  onClick={() => setIsInverted(!isInverted)}
                  title="Inverter Tons de Cinza (Negativo)"
                >
                  <Eye size={14} />
                  <span>Inverter</span>
                </button>

                <button 
                  className={`ws-tool-btn ${showMeasure ? 'active' : ''}`}
                  onClick={() => setShowMeasure(!showMeasure)}
                  title="Linha de Medição"
                >
                  <Ruler size={14} />
                  <span>Régua</span>
                </button>

                <button 
                  className="ws-tool-btn"
                  onClick={() => setZoomLevel((z) => (z >= 130 ? 100 : z + 15))}
                  title="Ajustar Zoom"
                >
                  <Maximize2 size={14} />
                  <span>{zoomLevel}%</span>
                </button>

                <button 
                  className="ws-tool-btn reset-btn"
                  onClick={handleReset}
                  title="Restaurar Padrão"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Presets Rápidos de Janelamento (Window/Level) */}
            <div className="ws-presets-bar">
              <span className="preset-label">
                <SunMedium size={14} /> Janelamento W/L:
              </span>
              <button 
                className={`preset-btn ${activePreset === 'Cerebro' ? 'active' : ''}`}
                onClick={() => setActivePreset('Cerebro')}
              >
                Cérebro (W:80 L:40)
              </button>
              <button 
                className={`preset-btn ${activePreset === 'Osso' ? 'active' : ''}`}
                onClick={() => setActivePreset('Osso')}
              >
                Janela Óssea (W:2000 L:500)
              </button>
              <button 
                className={`preset-btn ${activePreset === 'Pulmao' ? 'active' : ''}`}
                onClick={() => setActivePreset('Pulmao')}
              >
                Pulmão (W:1500 L:-600)
              </button>
              <button 
                className={`preset-btn ${activePreset === 'PartesMoles' ? 'active' : ''}`}
                onClick={() => setActivePreset('PartesMoles')}
              >
                Partes Moles (W:350 L:50)
              </button>
            </div>

            {/* Viewport Principal com Imagem Médica e Overlays DICOM */}
            <div className="ws-viewport-container">
              
              {/* Overlay Superior Esquerdo: Informações do Paciente */}
              <div className="dicom-overlay top-left">
                <div className="overlay-line bold highlight">SILVA, JOÃO CARLOS</div>
                <div className="overlay-line">ID: #CT-2026-94812</div>
                <div className="overlay-line">NASC: 14/08/1972 (54a) • M</div>
                <div className="overlay-line">DATA: 02/10/2026 • 11:24:02</div>
              </div>

              {/* Overlay Superior Direito: Dados Técnicos do Aparelho */}
              <div className="dicom-overlay top-right">
                <div className="overlay-line bold">CENTRO DIAGNÓSTICO IMAGEM</div>
                <div className="overlay-line">{activeModality} HELICAL MULTISLICE</div>
                <div className="overlay-line">KV: 120 • mA: 280 • FOV: 240mm</div>
                <div className="overlay-line">FILTRO: {activePreset.toUpperCase()}</div>
              </div>

              {/* Viewport Central da Imagem com Simulação Anatômica Realista */}
              <div className="ws-viewport-canvas" style={getFilterStyle()}>
                
                {/* SVG Renderizando Corte Tomográfico / Ressonância com Alta Fidelidade */}
                <svg viewBox="0 0 500 500" className="medical-scan-svg">
                  <defs>
                    <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                      <stop offset="35%" stopColor="#a0aec0" stopOpacity="0.75" />
                      <stop offset="65%" stopColor="#4a5568" stopOpacity="0.6" />
                      <stop offset="85%" stopColor="#2d3748" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#0b0f19" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="ventricleDark" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#000000" stopOpacity="0.95" />
                      <stop offset="70%" stopColor="#1a202c" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#4a5568" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Fundo preto da câmara DICOM */}
                  <rect width="500" height="500" fill="#000000" />

                  {/* Calota Craniana (Osso cortical externo brilhante) */}
                  <ellipse cx="250" cy="245" rx="175" ry="205" fill="none" stroke="#f1f5f9" strokeWidth="11" />
                  <ellipse cx="250" cy="245" rx="168" ry="198" fill="none" stroke="#94a3b8" strokeWidth="4" opacity="0.6" />

                  {/* Parênquima Encefálico com Sulcos e Giros */}
                  <ellipse cx="250" cy="245" rx="160" ry="190" fill="url(#brainGlow)" />

                  {/* Fissura Inter-hemisférica Central */}
                  <path d="M 250 55 Q 248 150 250 245 T 250 435" fill="none" stroke="#1a202c" strokeWidth="3" />

                  {/* Ventrículos Laterais (Formatos característicos em borboleta) */}
                  <path d="M 235 210 Q 215 180 230 150 Q 242 165 242 205 Q 240 230 235 250 Z" fill="url(#ventricleDark)" />
                  <path d="M 265 210 Q 285 180 270 150 Q 258 165 258 205 Q 260 230 265 250 Z" fill="url(#ventricleDark)" />

                  {/* Terceiro Ventrículo */}
                  <ellipse cx="250" cy="255" rx="4" ry="25" fill="#000000" opacity="0.8" />

                  {/* Núcleos da Base e Lobo Temporal */}
                  <path d="M 170 240 Q 190 235 210 260 Q 185 275 170 240 Z" fill="#2d3748" opacity="0.45" />
                  <path d="M 330 240 Q 310 235 290 260 Q 315 275 330 240 Z" fill="#2d3748" opacity="0.45" />

                  {/* Linha de Medição Simulada se ativada */}
                  {showMeasure && (
                    <g className="ws-measurement-annotation">
                      <line x1="175" y1="230" x2="325" y2="230" stroke="#00a8ff" strokeWidth="2" strokeDasharray="4 2" />
                      <circle cx="175" cy="230" r="3" fill="#00a8ff" />
                      <circle cx="325" cy="230" r="3" fill="#00a8ff" />
                      <rect x="220" y="210" width="62" height="18" rx="4" fill="#00a8ff" />
                      <text x="251" y="223" fill="#000000" fontSize="11" fontWeight="bold" textAnchor="middle">
                        28.4 mm
                      </text>
                    </g>
                  )}
                </svg>

              </div>

              {/* Overlay Inferior Esquerdo: Informações de Fatias */}
              <div className="dicom-overlay bottom-left">
                <div className="overlay-line bold">CORTE: {currentSlice} / 64</div>
                <div className="overlay-line">ESPESSURA: 1.25 mm</div>
                <div className="overlay-line">ZOOM: {zoomLevel}%</div>
                <div className="overlay-line text-cyan">STATUS: MINIO S3 ONLINE</div>
              </div>

              {/* Overlay Inferior Direito: Janelamento Atual */}
              <div className="dicom-overlay bottom-right">
                <div className="overlay-line bold">PRESET: {activePreset.toUpperCase()}</div>
                <div className="overlay-line">
                  W: {activePreset === 'Osso' ? '2000' : activePreset === 'Pulmao' ? '1500' : '180'} • L: {activePreset === 'Osso' ? '500' : activePreset === 'Pulmao' ? '-600' : '40'}
                </div>
                <div className="overlay-line text-emerald">IA ASSISTIDA: ATIVA</div>
              </div>

              {/* Pílulas Flutuantes de Alta Tecnologia */}
              <div className="floating-telemetry pill-left">
                <Zap size={14} className="text-amber" />
                <span>Abertura: <strong>0.8s</strong> via MinIO S3</span>
              </div>

              <div className="floating-telemetry pill-right">
                <Sparkles size={14} className="text-cyan" />
                <span>IA Médica: <strong>Zero Inconsistências</strong></span>
              </div>

            </div>

            {/* Barra Inferior com Atalhos Rápidos */}
            <div className="ws-footer-bar">
              <div className="ws-footer-text">
                <CheckCircle2 size={15} className="text-emerald" />
                <span>Visualizador 100% nativo no navegador com tecnologia CornerstoneJS & WebGL.</span>
              </div>
              <button className="btn-ws-try" onClick={onDemoClick}>
                <span>Solicitar Teste Completo da Workstation</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
