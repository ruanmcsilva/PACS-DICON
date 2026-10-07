import React, { useState } from 'react';
import { 
  Scan, 
  Activity, 
  Layers, 
  Camera, 
  Heart, 
  Sparkles, 
  Radio, 
  Cpu, 
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../core/context/LanguageContext';

export const ModalitiesSection: React.FC = () => {
  const { t } = useLanguage();
  const [selectedModality, setSelectedModality] = useState<string>('CT');

  const modalities = [
    {
      code: 'CT',
      name: 'Tomografia Computadorizada',
      desc: 'Séries multislice volumétricas com centenas de cortes carregadas em milissegundos via MinIO S3.',
      features: ['Reconstrução MPR (Axial, Sagital, Coronal)', 'MIP (Maximum Intensity Projection)', 'Cálculo de Unidades Hounsfield (HU)', 'Presets pulmonar, ósseo e tecidos moles'],
      icon: Layers,
      color: '#00a8ff',
    },
    {
      code: 'MR',
      name: 'Ressonância Magnética',
      desc: 'Alta fidelidade de contraste e suporte completo a sequências T1, T2, FLAIR, Difusão e Mapa ADC.',
      features: ['Sincronização entre séries comparativas', 'Exibição de mapa de difusão e perfusão', 'Navegação multiplanar com cursor em cruz', 'Ferramentas de medição milimétrica'],
      icon: Activity,
      color: '#38bdf8',
    },
    {
      code: 'US',
      name: 'Ultrassonografia & Ecodoppler',
      desc: 'Suporte a vídeos em Cineloop, captura de frames em tempo real e laudos ultrarrápidos para clínicas de ultrassom.',
      features: ['Player de Cineloop a 60 FPS com controle de velocidade', 'Medições obstétricas e cardiológicas', 'Captura de fotos e clipes direta do aparelho', 'Envio de vídeos e fotos direto no WhatsApp do paciente'],
      icon: Heart,
      color: '#ec4899',
    },
    {
      code: 'CR / DX',
      name: 'Radiologia Digital e Computadorizada',
      desc: 'Visualização de Raio-X convencional e digital em altíssima resolução com zoom suave e inversão de cores.',
      features: ['Inversão negativo / positivo instantânea', 'Medição de Ângulo de Cobb (escoliose)', 'Ajuste de contraste e nitidez em tempo real', 'Calibração anatômica por esferas de referência'],
      icon: Scan,
      color: '#06b6d4',
    },
    {
      code: 'MG',
      name: 'Mamografia Digital & Tomossíntese',
      desc: 'Suporte aos protocolos de mamografia com layouts dedicados (RCC, LCC, RMLO, LMLO) e alta resolução de tons de cinza.',
      features: ['Layouts de mamografia 1x1, 2x2 e 4x4 espelhados', 'Lupa digital com alta ampliação (Microcalcificações)', 'Compatibilidade com BI-RADS padronizado', 'Inversão e janelamento específico para tecido mamário'],
      icon: Camera,
      color: '#f43f5e',
    },
    {
      code: 'NM / PT',
      name: 'Medicina Nuclear & PET-CT',
      desc: 'Fusão de imagens metabólicas PET com tomografia anatômica CT e paletas coloridas especializadas.',
      features: ['Paletas de cor (Rainbow, Hot Iron, PET)', 'Fusão de imagens com transparência ajustável', 'Cálculo de SUV (Standardized Uptake Value)', 'Exibição 3D MIP para rastreamento de lesões'],
      icon: Radio,
      color: '#eab308',
    },
    {
      code: 'XA / RF',
      name: 'Hemodinâmica e Fluoroscopia',
      desc: 'Reprodução de angiografias dinâmicas com taxa de quadros alta e subtração digital.',
      features: ['Controle de reprodução quadro a quadro', 'Medição de estenose vascular percentual', 'Anotações em tempo real', 'Armazenamento sem perdas de qualidade'],
      icon: Cpu,
      color: '#a855f7',
    },
    {
      code: 'OT / ES',
      name: 'Endoscopia, ECG e Oftalmologia',
      desc: 'Compatibilidade com imagens e vídeos em cores verdadeiras (RGB DICOM) e documentos PDF encapsulados.',
      features: ['Captura de vídeo em Full HD e 4K', 'Suporte a DICOM Encapsulated PDF', 'Laudos integrados com galeria de fotos', 'Exportação simplificada para o paciente'],
      icon: Sparkles,
      color: '#10b981',
    },
  ];

  const currentModality = modalities.find((m) => m.code === selectedModality) || modalities[0];

  return (
    <section className="modalities-section">
      <div className="modalities-container">
        <div className="section-head text-center">
          <div className="section-pill">
            <Scan size={14} />
            <span>{t('modalities.pill')}</span>
          </div>
          <h2 className="section-title">
            {t('modalities.titlePre')}<span className="highlight-cyan">{t('modalities.titleHighlight')}</span>
          </h2>
          <p className="section-subtitle">
            {t('modalities.subtitle')}
          </p>
        </div>

        {/* Grid de Seleção Rápida */}
        <div className="modalities-badges-grid">
          {modalities.map((item) => {
            const isSelected = item.code === selectedModality;
            const Icon = item.icon;
            return (
              <button
                key={item.code}
                className={`modality-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedModality(item.code)}
                style={{
                  borderColor: isSelected ? item.color : undefined,
                  boxShadow: isSelected ? `0 0 16px ${item.color}35` : undefined,
                }}
              >
                <div className="chip-icon" style={{ color: item.color }}>
                  <Icon size={18} />
                </div>
                <div className="chip-text">
                  <span className="chip-code">{item.code}</span>
                  <span className="chip-name">{item.name.split(' ')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Painel de Destaque da Modalidade Selecionada */}
        <div className="modality-detail-card glass-card">
          <div className="detail-header">
            <div className="detail-tag" style={{ background: `${currentModality.color}20`, color: currentModality.color, borderColor: `${currentModality.color}40` }}>
              <span>Modalidade {currentModality.code}</span>
            </div>
            <h3>{currentModality.name}</h3>
            <p>{currentModality.desc}</p>
          </div>

          <div className="detail-features-grid">
            {currentModality.features.map((feat, idx) => (
              <div key={idx} className="detail-feature-item">
                <CheckCircle2 size={18} style={{ color: currentModality.color }} />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModalitiesSection;
