import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../core/context/LanguageContext';

export const FaqSection: React.FC = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Preciso instalar algum software ou ter um servidor físico na clínica?',
      a: 'Não! O nosso sistema é 100% Web (Zero-Footprint). Você e seus médicos só precisam abrir o navegador de internet (Chrome, Safari, Edge) em qualquer computador com Windows, macOS, iPad ou celular. Não há necessidade de comprar servidores caros, nobreaks ou pagar por licenças por máquina instalada.',
    },
    {
      q: 'O PACS é compatível com os aparelhos de imagem da minha clínica?',
      a: 'Sim, é 100% compatível com qualquer aparelho que suporte o protocolo universal DICOM 3.0, incluindo tomógrafos, ressonâncias, aparelhos de ultrassom, raio-x digital e mamógrafos de marcas como GE Healthcare, Philips, Siemens Healthineers, Canon/Toshiba, Samsung, Mindray, Carestream e Hologic.',
    },
    {
      q: 'Como os pacientes e médicos solicitantes recebem os laudos no WhatsApp?',
      a: 'Assim que o médico radiologista finaliza e assina o laudo no sistema, o paciente e o médico solicitante recebem automaticamente uma mensagem no WhatsApp com o link direto e seguro para visualizar as imagens interativas em alta resolução e o laudo em PDF assinado com certificado ICP-Brasil. Também geramos um QR Code impresso no comprovante de atendimento da recepção.',
    },
    {
      q: 'Os dados e imagens dos pacientes estão seguros e dentro da LGPD?',
      a: 'Com certeza. Operamos com datacenters de classe mundial (AWS e Oracle Cloud) com certificação ISO 27001, HIPAA e conformidade integral com a LGPD e resoluções do Conselho Federal de Medicina (CFM). Todas as imagens e dados trafegam com criptografia TLS 1.3 de ponta a ponta e armazenamento em repouso AES-256.',
    },
    {
      q: 'Vocês realizam a migração dos exames do nosso PACS antigo?',
      a: 'Sim! Nossa equipe de engenharia e suporte cuida de todo o processo de migração dos estudos históricos armazenados no seu PACS antigo para a nuvem sem interrupção do atendimento da sua clínica.',
    },
    {
      q: 'Quantos usuários ou computadores podem acessar simultaneamente?',
      a: 'Usuários ILIMITADOS! Não cobramos taxas adicionais por novos médicos cadastrados, computadores ou recepcionistas. Toda a sua equipe pode trabalhar simultaneamente sem custos extras por licença.',
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="faq-section">
      <div className="faq-container">
        <div className="section-head text-center">
          <div className="section-pill">
            <HelpCircle size={14} />
            <span>{t('faq.pill')}</span>
          </div>
          <h2 className="section-title">
            {t('faq.titlePre')}<span className="highlight-cyan">{t('faq.titleHighlight')}</span>
          </h2>
          <p className="section-subtitle">
            {t('faq.subtitle')}
          </p>
        </div>

        <div className="faq-accordion">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className={`faq-card glass-card ${isOpen ? 'open' : ''}`}>
                <button className="faq-question-btn" onClick={() => toggleFaq(index)} aria-expanded={isOpen}>
                  <span className="faq-q-text">{item.q}</span>
                  <div className={`faq-icon-toggle ${isOpen ? 'active' : ''}`}>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                {isOpen && (
                  <div className="faq-answer-panel">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
