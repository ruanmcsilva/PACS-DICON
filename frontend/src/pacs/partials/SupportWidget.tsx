import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, 
  MessageSquare, 
  X, 
  Building2, 
  Headphones, 
  MonitorPlay, 
  UserCheck, 
  ChevronRight, 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

interface SupportWidgetProps {
  companyName?: string;
  whatsappNumber?: string;
}

export const SupportWidget: React.FC<SupportWidgetProps> = ({
  companyName = 'PACS Enterprise',
  whatsappNumber = '5582987654321',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', contact: '', notes: '' });

  // Posição para o botão flutuante ser arrastável
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const dragInfo = useRef({
    isPointerDown: false,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
    hasMoved: false,
  });

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();

    dragInfo.current = {
      isPointerDown: true,
      startX: clientX,
      startY: clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
      hasMoved: false,
    };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!dragInfo.current.isPointerDown) return;

    const deltaX = clientX - dragInfo.current.startX;
    const deltaY = clientY - dragInfo.current.startY;

    if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
      if (!dragInfo.current.hasMoved) {
        dragInfo.current.hasMoved = true;
        setIsDragging(true);
      }

      const btnSize = 60;
      const newX = Math.max(12, Math.min(window.innerWidth - btnSize - 12, dragInfo.current.initialLeft + deltaX));
      const newY = Math.max(12, Math.min(window.innerHeight - btnSize - 12, dragInfo.current.initialTop + deltaY));

      setPosition({ x: newX, y: newY });
    }
  };

  const handlePointerUp = () => {
    if (!dragInfo.current.isPointerDown) return;

    const didMove = dragInfo.current.hasMoved;
    dragInfo.current.isPointerDown = false;
    setIsDragging(false);

    // Se foi apenas um clique (sem arrastar), abre/fecha a central
    if (!didMove) {
      setIsOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerUp();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handlePointerUp();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const handleSelectOption = (optionKey: string) => {
    setSelectedOption(optionKey);
    setFormSubmitted(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    
    // Opcional: abre o canal direto
    setTimeout(() => {
      const msg = `Olá! Meu nome é ${formData.name}. Solicitação de ${selectedOption}: ${formData.notes || 'Gostaria de atendimento.'}`;
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    }, 1200);
  };

  const options = [
    {
      key: 'comercial',
      tag: 'Planos',
      title: 'Comercial & Vendas',
      subtitle: 'Propostas para clínicas, hospitais e centros.',
      icon: <Building2 size={22} color="#00a8ff" />,
      colorClass: 'cyan',
    },
    {
      key: 'suporte',
      tag: '24/7',
      title: 'Suporte DICOM',
      subtitle: 'Ajuda imediata com servidores e envio.',
      icon: <Headphones size={22} color="#22c55e" />,
      colorClass: 'green',
    },
    {
      key: 'demo',
      tag: 'Ao Vivo',
      title: 'Demonstração',
      subtitle: 'Conheça o visualizador e laudos em ação.',
      icon: <MonitorPlay size={22} color="#a855f7" />,
      colorClass: 'purple',
    },
    {
      key: 'paciente',
      tag: 'Laudos',
      title: 'Portal Exames',
      subtitle: 'Acesse imagens radiológicas e resultados.',
      icon: <UserCheck size={22} color="#f59e0b" />,
      colorClass: 'amber',
    },
  ];

  return (
    <>
      {/* 1. BOTÃO FLUTUANTE ARRASTÁVEL COM ÍCONE PRÓPRIO */}
      <div
        ref={buttonRef}
        className={`support-float-btn ${isDragging ? 'dragging' : ''} ${isOpen ? 'active' : ''}`}
        style={
          position
            ? { left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' }
            : { right: '28px', bottom: '28px' }
        }
        onMouseDown={(e) => {
          e.preventDefault();
          handlePointerDown(e.clientX, e.clientY);
        }}
        onTouchStart={(e) => {
          if (e.touches.length > 0) {
            handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Abrir central de atendimento"
      >
        {!isDragging && !isOpen && (
          <span className="support-tooltip">
            Central de Atendimento
          </span>
        )}

        <div className="support-icon-box">
          {isOpen ? (
            <X size={26} color="#ffffff" />
          ) : (
            <>
              <MessageSquare size={26} color="#ffffff" />
              <span className="notification-bubble">1</span>
            </>
          )}
        </div>
      </div>

      {/* 2. MODAL / WIDGET INTERATIVO (OVERLAY) */}
      {isOpen && (
        <div className="support-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div 
            className="support-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABEÇALHO */}
            <div className="support-modal-header">
              <div className="header-brand-info">
                <div className="header-logo-icon">
                  <Activity size={20} color="#00a8ff" />
                </div>
                <div>
                  <h3 className="brand-name">{companyName}</h3>
                  <span className="online-badge">
                    <span className="pulse-dot-green"></span>
                    Equipe online agora
                  </span>
                </div>
              </div>
              <button 
                className="btn-close-modal" 
                onClick={() => setIsOpen(false)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* BARRA DE PROGRESSO / IDENTIFICADOR */}
            <div className="support-progress-bar-container">
              <div className="support-tag">
                <Sparkles size={13} color="#00a8ff" />
                <span>PACS CLOUD ASSIST</span>
              </div>
              <span className="step-indicator">
                {selectedOption ? 'ETAPA 2 DE 2' : 'ETAPA 1 DE 2'}
              </span>
            </div>

            {/* CORPO DO WIDGET */}
            <div className="support-modal-body">
              {!selectedOption ? (
                /* ETAPA 1: MENU EM CAIXAS LADO A LADO */
                <>
                  <div className="support-welcome-bubble">
                    <p>
                      Olá! Bem-vindo ao <strong>{companyName}</strong>. 
                      Selecione um canal para iniciar seu atendimento:
                    </p>
                  </div>

                  {/* GRID 2x2 DE CAIXAS LADO A LADO */}
                  <div className="support-options-grid">
                    {options.map((opt) => (
                      <button
                        key={opt.key}
                        className={`support-card-box ${opt.colorClass}`}
                        onClick={() => handleSelectOption(opt.key)}
                      >
                        <div className="card-box-header">
                          <div className="card-box-icon">
                            {opt.icon}
                          </div>
                          <span className="card-box-badge">{opt.tag}</span>
                        </div>
                        <h4 className="card-box-title">{opt.title}</h4>
                        <p className="card-box-desc">{opt.subtitle}</p>
                        <div className="card-box-action">
                          <span>Acessar</span>
                          <ChevronRight size={14} />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                /* ETAPA 2: FORMULÁRIO / CONTATO DIRETO */
                <div className="support-step2-container">
                  <button 
                    className="btn-back-step"
                    onClick={() => setSelectedOption(null)}
                  >
                    <ArrowLeft size={16} />
                    <span>Voltar para opções</span>
                  </button>

                  {!formSubmitted ? (
                    <form className="support-form" onSubmit={handleFormSubmit}>
                      <div className="form-header-title">
                        <h4>
                          {selectedOption === 'comercial' && 'Proposta Comercial'}
                          {selectedOption === 'suporte' && 'Suporte Técnico Imediato'}
                          {selectedOption === 'demo' && 'Agendamento de Demonstração'}
                          {selectedOption === 'paciente' && 'Atendimento ao Usuário'}
                        </h4>
                        <p>Preencha abaixo para falarmos diretamente com você:</p>
                      </div>

                      <div className="form-field">
                        <label>Seu Nome Completo</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Dr(a). ou Nome do responsável"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div className="form-field">
                        <label>WhatsApp ou Telefone</label>
                        <input 
                          type="tel" 
                          required 
                          placeholder="(DDD) 99999-9999"
                          value={formData.contact}
                          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        />
                      </div>

                      <div className="form-field">
                        <label>Mensagem ou Dúvida (Opcional)</label>
                        <textarea 
                          rows={3} 
                          placeholder="Como podemos te ajudar?"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                      </div>

                      <button type="submit" className="btn-submit-support">
                        <Send size={16} />
                        <span>Iniciar Atendimento</span>
                      </button>
                    </form>
                  ) : (
                    <div className="support-success-view">
                      <CheckCircle2 size={54} color="#22c55e" />
                      <h4>Solicitação Iniciada!</h4>
                      <p>Estamos te conectando com o nosso especialista responsável...</p>
                      <button 
                        className="btn-finish-modal"
                        onClick={() => {
                          setSelectedOption(null);
                          setIsOpen(false);
                        }}
                      >
                        Concluir
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default SupportWidget;
