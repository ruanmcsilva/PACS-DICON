import React, { useState } from 'react';
import { X, CheckCircle, Send, Sparkles, Building2, Phone, Mail, User, ShieldCheck } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber?: string;
}

export const DemoModal: React.FC<DemoModalProps> = ({
  isOpen,
  onClose,
  whatsappNumber = '5582987654321',
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [clinic, setClinic] = useState('');
  const [volume, setVolume] = useState('500 a 1.500 exames/mês');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Enviar mensagem de lead opcionalmente ao WhatsApp
    const message = `Olá! Solicitei uma demonstração do PACS Cloud pelo site:\n*Nome:* ${name}\n*Clínica:* ${clinic}\n*E-mail:* ${email}\n*WhatsApp:* ${phone}\n*Volume:* ${volume}`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
    }, 1200);
  };

  const handleReset = () => {
    setSubmitted(false);
    setName('');
    setEmail('');
    setPhone('');
    setClinic('');
    onClose();
  };

  return (
    <div className="demo-modal-overlay" onClick={onClose}>
      <div className="demo-modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <button className="demo-modal-close" onClick={onClose} aria-label="Fechar modal">
          <X size={20} />
        </button>

        {submitted ? (
          <div className="demo-modal-success">
            <div className="success-icon-wrap">
              <CheckCircle size={56} className="text-emerald" />
            </div>
            <h3>Demonstração Solicitada com Sucesso!</h3>
            <p>
              Obrigado, <strong>{name}</strong>! Nossos consultores especialistas em PACS e Telerradiologia entrarão em contato em até <strong>15 minutos</strong>.
            </p>
            <div className="success-action-box">
              <span>Redirecionando para o WhatsApp do plantão...</span>
            </div>
            <button className="btn-modal-primary" onClick={handleReset}>
              Concluir
            </button>
          </div>
        ) : (
          <div className="demo-modal-body">
            <div className="demo-modal-header">
              <div className="demo-badge">
                <Sparkles size={14} className="badge-glow" />
                <span>Teste Gratuito por 14 Dias</span>
              </div>
              <h2>Agendar Demonstração Exclusiva</h2>
              <p>
                Descubra como o nosso PACS Cloud e visualizador DICOM web reduzem custos e aceleram os laudos da sua clínica.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="demo-form">
              <div className="form-group">
                <label>
                  <User size={15} /> Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Carlos Eduardo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <Mail size={15} /> E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="carlos@clinicadiagnostico.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Phone size={15} /> WhatsApp / Telefone *
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
                    placeholder="Ex: Clínica Radiológica Vida"
                    value={clinic}
                    onChange={(e) => setClinic(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Volume Médio de Exames/Mês</label>
                  <select value={volume} onChange={(e) => setVolume(e.target.value)}>
                    <option value="Até 500 exames/mês">Até 500 exames/mês</option>
                    <option value="500 a 1.500 exames/mês">500 a 1.500 exames/mês</option>
                    <option value="1.500 a 4.000 exames/mês">1.500 a 4.000 exames/mês</option>
                    <option value="Mais de 4.000 exames/mês">Mais de 4.000 exames/mês (Hospitalar)</option>
                  </select>
                </div>
              </div>

              <div className="form-security-note">
                <ShieldCheck size={16} />
                <span>Seus dados estão protegidos conforme as diretrizes da LGPD e HIPAA.</span>
              </div>

              <button type="submit" className="btn-modal-primary">
                <span>Solicitar Demonstração Gratuita</span>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoModal;
