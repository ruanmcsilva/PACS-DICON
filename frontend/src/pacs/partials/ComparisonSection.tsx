import React from 'react';
import { Check, X, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../core/context/LanguageContext';

interface ComparisonSectionProps {
  onOpenDemo?: () => void;
}

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({ onOpenDemo }) => {
  const { t } = useLanguage();
  const comparisonItems = [
    {
      feature: 'Investimento Inicial em Servidores',
      traditional: 'R$ 30.000 a R$ 80.000 em servidores, racks, ar-condicionado 24h e nobreaks',
      cloud: 'R$ 0 em hardware local. 100% hospedado em nuvem de alta performance (AWS / Oracle)',
    },
    {
      feature: 'Licenças e Quantidade de Usuários',
      traditional: 'Cobrança por máquina instalada ou por usuário simultâneo',
      cloud: 'Usuários, médicos e secretárias ILIMITADOS a custo zero',
    },
    {
      feature: 'Acesso Remoto (Home Office / Telerradiologia)',
      traditional: 'Requer VPNs lentas que caem constantemente e instalação manual de softwares pesados',
      cloud: 'Acesso instantâneo via navegador Web (Zero-Footprint) de qualquer PC, Mac ou iPad',
    },
    {
      feature: 'Entrega de Resultados aos Pacientes',
      traditional: 'Filmes radiológicos, envelopes caros e impressões com alto custo operacional',
      cloud: 'Envio 100% automatizado no WhatsApp e SMS com visualizador DICOM web e QR Code',
    },
    {
      feature: 'Inteligência Artificial e Reconhecimento de Voz',
      traditional: 'Módulos extras caríssimos ou inexistentes na maioria dos sistemas antigos',
      cloud: 'IA integrada para conferência de laudos, ditado por voz e análise inteligente de histórico',
    },
    {
      feature: 'Segurança e Backup contra Perda de Dados',
      traditional: 'Fitas ou HDs externos vulneráveis a panes físicas, queima por raio ou ransomware',
      cloud: 'Armazenamento MinIO S3 redundante com criptografia militar e espelhamento em tempo real',
    },
    {
      feature: 'Atualizações e Novas Funcionalidades',
      traditional: 'Sistemas parados no tempo com versões antigas e cobrança por upgrades',
      cloud: 'Atualizações automáticas e melhorias contínuas sem parar o serviço',
    },
    {
      feature: 'Suporte Técnico e Plantão',
      traditional: 'Limitado ao horário comercial ou filas demoradas de atendimento',
      cloud: 'Plantão 24/7/365 com atendimento humanizado via WhatsApp para urgências',
    },
  ];

  return (
    <section className="comparison-section">
      <div className="comparison-container">
        <div className="section-head text-center">
          <div className="section-pill">
            <Sparkles size={14} />
            <span>{t('comparison.pill')}</span>
          </div>
          <h2 className="section-title">
            {t('comparison.titlePre')}<span className="highlight-cyan">{t('comparison.titleHighlight')}</span>
          </h2>
          <p className="section-subtitle">
            {t('comparison.subtitle')}
          </p>
        </div>

        <div className="comparison-table-wrapper glass-card">
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="col-feature">Recurso / Feature</th>
                <th className="col-traditional">
                  <div className="table-head-badge traditional">
                    <ShieldAlert size={16} />
                    <span>{t('comparison.traditionalHeader')}</span>
                  </div>
                </th>
                <th className="col-cloud">
                  <div className="table-head-badge cloud">
                    <Sparkles size={16} />
                    <span>{t('comparison.cloudHeader')}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonItems.map((item, index) => (
                <tr key={index}>
                  <td className="cell-feature">
                    <strong>{item.feature}</strong>
                  </td>
                  <td className="cell-traditional">
                    <div className="cell-content">
                      <div className="icon-cross">
                        <X size={16} />
                      </div>
                      <span>{item.traditional}</span>
                    </div>
                  </td>
                  <td className="cell-cloud">
                    <div className="cell-content">
                      <div className="icon-check">
                        <Check size={16} />
                      </div>
                      <span>{item.cloud}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="comparison-cta-box glass-card">
          <div className="cta-box-text">
            <h3>Pronto para migrar sua clínica para a era moderna do PACS Cloud?</h3>
            <p>Faça um teste de 14 dias sem compromisso e veja a velocidade na prática com seus próprios exames.</p>
          </div>
          <button className="btn-hero-primary" onClick={onOpenDemo}>
            Solicitar Demonstração Grátis
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
