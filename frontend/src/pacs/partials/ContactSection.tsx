import React, { useState } from 'react';
import { 
  Send, 
  MessageCircle, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Headphones, 
  Building2, 
  Phone, 
  Mail, 
  User 
} from 'lucide-react';
import { useLanguage } from '../../core/context/LanguageContext';

interface ContactSectionProps {
  whatsappNumber?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  whatsappNumber = '5582987654321',
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [clinic, setClinic] = useState('');
  const [volume, setVolume] = useState('500 a 1.500 exames/mês');
  const [modalities, setModalities] = useState<string[]>(['Tomografia (CT)', 'Ultrassom (US)']);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleModality = (mod: string) => {
    if (modalities.includes(mod)) {
      setModalities(modalities.filter((m) => m !== mod));
    } else {
      setModalities([...modalities, mod]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    const message = `Olá! Gostaria de agendar uma demonstração do PACS Cloud:\n*Nome:* ${name}\n*Clínica:* ${clinic}\n*E-mail:* ${email}\n*WhatsApp:* ${phone}\n*Volume:* ${volume}\n*Modalidades:* ${modalities.join(', ')}`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
    }, 1200);
  };

  return (
    <section id="contato" className="contact-section">
      <div className="contact-container">
        <div className="contact-grid glass-card">
          {/* Coluna da Esquerda: Proposta de Valor e Benefícios */}
          <div className="contact-info-col">
            <div className="section-pill">
              <Sparkles size={14} />
              <span>{t('contact.pill')}</span>
            </div>

            <h2 className="contact-title">
              {t('contact.titlePre')}<span className="highlight-cyan">{t('contact.titleHighlight')}</span>
            </h2>

            <p className="contact-desc">
              {t('contact.subtitle')}
            </p>

            <div className="contact-benefits">
              <div className="benefit-item">
                <div className="benefit-icon-box">
                  <Clock size={20} className="text-cyan" />
                </div>
                <div>
                  <strong>Implantação Imediata em até 24 Horas</strong>
                  <p>Sem paralisação da sua rotina de atendimento.</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon-box">
                  <ShieldCheck size={20} className="text-emerald" />
                </div>
                <div>
                  <strong>14 Dias de Teste Gratuito Sem Compromisso</strong>
                  <p>Comprove na prática a velocidade e a economia gerada.</p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-icon-box">
                  <Headphones size={20} className="text-purple" />
                </div>
                <div>
                  <strong>Plantão Técnico e Suporte 24/7/365</strong>
                  <p>Atendimento humanizado direto no WhatsApp para emergências.</p>
                </div>
              </div>
            </div>

            <div className="whatsapp-quick-call">
              <span>Prefere falar direto pelo WhatsApp?</span>
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Olá! Gostaria de falar com um consultor sobre o sistema PACS Cloud.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-direct"
              >
                <MessageCircle size={20} />
                <span>Conversar no WhatsApp Agora</span>
              </a>
            </div>
          </div>

          {/* Coluna da Direita: Formulário Interativo */}
          <div className="contact-form-col">
            {isSubmitted ? (
              <div className="form-success-box">
                <CheckCircle2 size={64} className="text-emerald" />
                <h3>Demonstração Solicitada com Sucesso!</h3>
                <p>
                  Recebemos seus dados, <strong>{name}</strong>. Nosso especialista entrará em contato com você pelo WhatsApp em minutos!
                </p>
                <div className="success-badge-pulse">
                  <span>Conectando com o plantão comercial...</span>
                </div>
                <button className="btn-modal-primary" onClick={() => setIsSubmitted(false)}>
                  Enviar Outra Mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="lead-form">
                <div className="form-head">
                  <h3>Solicitar Demonstração Gratuita</h3>
                  <p>Preencha os campos abaixo para receber o acesso de teste:</p>
                </div>

                <div className="form-group">
                  <label>
                    <User size={15} /> Seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dra. Juliana Fernandes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <Mail size={15} /> E-mail Profissional *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="juliana@clinica.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Phone size={15} /> WhatsApp com DDD *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(11) 98765-4321"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <Building2 size={15} /> Nome da Clínica / Hospital
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Centro de Diagnóstico Vida"
                      value={clinic}
                      onChange={(e) => setClinic(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Volume Mensal de Exames</label>
                    <select value={volume} onChange={(e) => setVolume(e.target.value)}>
                      <option value="Até 500 exames/mês">Até 500 exames/mês</option>
                      <option value="500 a 1.500 exames/mês">500 a 1.500 exames/mês</option>
                      <option value="1.500 a 4.000 exames/mês">1.500 a 4.000 exames/mês</option>
                      <option value="Acima de 4.000 exames/mês">Acima de 4.000 exames/mês</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Modalidades Utilizadas na sua Clínica:</label>
                  <div className="modalities-checkbox-grid">
                    {['Tomografia (CT)', 'Ressonância (MR)', 'Ultrassom (US)', 'Raio-X (CR/DX)', 'Mamografia (MG)'].map((mod) => (
                      <button
                        type="button"
                        key={mod}
                        className={`mod-pill-btn ${modalities.includes(mod) ? 'selected' : ''}`}
                        onClick={() => toggleModality(mod)}
                      >
                        {modalities.includes(mod) && <CheckCircle2 size={14} />}
                        <span>{mod}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-lead-submit">
                  <span>Agendar Demonstração Gratuita</span>
                  <Send size={18} />
                </button>

                <div className="form-privacy-note">
                  🔒 Garantimos a privacidade total dos seus dados. Sem spam.
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
