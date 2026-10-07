import React from 'react';
import { Rocket, HeartHandshake, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface TestimonialsSectionProps {
  onOpenDemo?: () => void;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ onOpenDemo }) => {
  const pilotBenefits = [
    {
      icon: Rocket,
      title: 'Implantação Piloto 100% Gratuita',
      desc: 'Conectamos seus aparelhos (TC, RM, RX, Ultrassom) via protocolo DICOM diretamente à nuvem sem nenhum custo de setup ou taxa de adesão.',
      tag: 'Teste Sem Risco',
      color: '#00a8ff',
    },
    {
      icon: HeartHandshake,
      title: 'Acompanhamento Direto da Engenharia',
      desc: 'Canal exclusivo e direto no WhatsApp com os desenvolvedores da plataforma para suporte técnico prioritário e adaptação aos fluxos da sua equipe.',
      tag: 'Suporte Direto',
      color: '#10b981',
    },
    {
      icon: Sparkles,
      title: 'Condição Vitalícia de Parceiro Fundador',
      desc: 'As clínicas pioneiras participantes do programa de testes garantem mensalidade com desconto fixo permanente para quando optarem por efetivar.',
      tag: 'Benefício Exclusivo',
      color: '#a855f7',
    },
  ];

  return (
    <section id="piloto" className="testimonials-section">
      <div className="testimonials-container">
        <div className="section-head text-center">
          <div className="section-pill">
            <Rocket size={14} />
            <span>Programa de Clínicas Parceiras</span>
          </div>
          <h2 className="section-title">
            Seja um dos Primeiros a Testar o <span className="highlight-cyan">Novo PACS Cloud</span>
          </h2>
          <p className="section-subtitle">
            Estamos selecionando clínicas e serviços de radiologia para homologação prática em ambiente real. Teste com seus próprios equipamentos, com suporte dedicado e condições especiais.
          </p>
        </div>

        <div className="testimonials-grid">
          {pilotBenefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="testimonial-card glass-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `${item.color}15`,
                      border: `1px solid ${item.color}33`,
                      color: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={24} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background: `${item.color}18`,
                      color: item.color,
                      border: `1px solid ${item.color}33`,
                    }}
                  >
                    {item.tag}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                  {item.title}
                </h3>

                <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px', flex: 1 }}>
                  {item.desc}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#38bdf8', fontWeight: 600 }}>
                  <ShieldCheck size={16} />
                  <span>Sem fidelidade ou cobranças surpresa</span>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: '40px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(0, 168, 255, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(0, 168, 255, 0.2)',
            borderRadius: '16px',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Quer transformar a rotina de diagnósticos da sua clínica?
          </h3>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: 0, fontSize: '0.95rem' }}>
            Nossa equipe de engenharia realiza todo o alinhamento de portas DICOM e teste de envio sem interromper suas operações atuais.
          </p>
          <button
            onClick={onOpenDemo}
            className="btn-hero-primary"
            style={{ marginTop: '8px' }}
          >
            <span>Quero Testar na Minha Clínica</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
