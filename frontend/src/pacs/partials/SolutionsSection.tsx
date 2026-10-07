import React, { useState } from 'react';
import { 
  Cloud, 
  Monitor, 
  Sparkles, 
  MessageSquare, 
  Network, 
  CheckCircle2, 
  ArrowRight,
  Shield, 
  Zap, 
  Eye, 
  FileText, 
  Layers, 
  Smartphone,
  Cpu,
  Clock
} from 'lucide-react';
import { useLanguage } from '../../core/context/LanguageContext';

interface SolutionsSectionProps {
  onOpenDemo?: () => void;
}

export const SolutionsSection: React.FC<SolutionsSectionProps> = ({ onOpenDemo }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'pacs' | 'viewer' | 'ai' | 'portal' | 'tele'>('pacs');

  const tabs = [
    { id: 'pacs' as const, label: t('solutions.tabPacs'), icon: Cloud, badge: 'Zero-Footprint' },
    { id: 'viewer' as const, label: t('solutions.tabViewer'), icon: Monitor, badge: '2D & 3D MPR' },
    { id: 'ai' as const, label: t('solutions.tabAi'), icon: Sparkles, badge: 'Voz & Inteligência' },
    { id: 'portal' as const, label: t('solutions.tabPortal'), icon: MessageSquare, badge: 'Automação' },
    { id: 'tele' as const, label: t('solutions.tabTele'), icon: Network, badge: 'Multiempresas' },
  ];

  return (
    <section id="solucoes" className="solutions-section">
      <div className="solutions-container">
        {/* Header */}
        <div className="section-head text-center">
          <div className="section-pill">
            <Layers size={14} />
            <span>{t('solutions.pill')}</span>
          </div>
          <h2 className="section-title">
            {t('solutions.titlePre')}<span className="highlight-cyan">{t('solutions.titleHighlight')}</span>
          </h2>
          <p className="section-subtitle">
            {t('solutions.subtitle')}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="solutions-tabs-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`solution-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {tab.badge && <span className="tab-pill-badge">{tab.badge}</span>}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panes */}
        <div className="solution-tab-content glass-card">
          {activeTab === 'pacs' && (
            <div className="tab-grid">
              <div className="tab-info">
                <div className="tab-badge-accent">
                  <Cloud size={16} /> PACS Cloud de Alta Performance
                </div>
                <h3>Diga adeus aos servidores físicos caros e quedas repentinas</h3>
                <p>
                  Elimine custos com no-breaks caros, salas de servidores refrigeradas 24 horas por dia e manutenções de TI intermináveis. Nosso PACS Cloud roda nativamente na nuvem com escalabilidade infinita e redundância geográfica em datacenters AWS e Oracle.
                </p>

                <div className="features-checklist">
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>100% Web (Zero-Footprint):</strong> Não requer instalação de softwares pesados nas máquinas da clínica.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Armazenamento Seguro MinIO / S3:</strong> Seus estudos DICOM preservados para sempre com criptografia militar.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Compatibilidade C-STORE Universal:</strong> Recebe exames de qualquer equipamento de Tomografia, Ressonância, Raio-X ou Ultrassom.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Acesso de Qualquer Lugar:</strong> Trabalhe do consultório, do hospital ou de casa com a mesma velocidade.</span>
                  </div>
                </div>

                <div className="tab-cta-wrap">
                  <button className="btn-tab-action" onClick={onOpenDemo}>
                    <span>Conhecer o PACS Cloud</span>
                    <ArrowRight size={16} />
                  </button>
                  <span className="tab-note">Migração assistida de dados antigos inclusa</span>
                </div>
              </div>

              <div className="tab-preview">
                <div className="preview-card-mockup">
                  <div className="mockup-topbar">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                    <span className="mockup-title">MinIO S3 • Cloud Storage Status: 100% Sincronizado</span>
                  </div>
                  <div className="mockup-content-pacs">
                    <div className="storage-metric-box">
                      <div className="metric-header">
                        <span>Capacidade Utilizada</span>
                        <span className="text-emerald font-bold">Escalonamento Automático</span>
                      </div>
                      <div className="storage-bar">
                        <div className="storage-fill" style={{ width: '42%' }}></div>
                      </div>
                      <div className="storage-stats">
                        <span>14.8 TB Armazenados</span>
                        <span>0% Perda de Pacotes</span>
                      </div>
                    </div>

                    <div className="mini-features-list">
                      <div className="mini-feature">
                        <Shield size={20} className="text-cyan" />
                        <div>
                          <strong>Backup Duplo em Tempo Real</strong>
                          <p>Espelhamento geográfico contínuo</p>
                        </div>
                      </div>
                      <div className="mini-feature">
                        <Zap size={20} className="text-amber" />
                        <div>
                          <strong>Compressão Inteligente Sem Perdas</strong>
                          <p>Carregamento ultrarrápido mesmo em 4G/5G</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'viewer' && (
            <div className="tab-grid">
              <div className="tab-info">
                <div className="tab-badge-accent">
                  <Monitor size={16} /> Visualizador DICOM Avançado
                </div>
                <h3>Precisão diagnóstica com ferramentas profissionais de radiologia</h3>
                <p>
                  Desenvolvido com tecnologia de ponta CornerstoneJS, o visualizador web entrega a mesma experiência fluida de uma Workstation dedicada direto na aba do seu navegador, sem lentidão.
                </p>

                <div className="features-checklist">
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Reconstrução Multiplanar (MPR):</strong> Visualização simultânea nos planos Axial, Sagital e Coronal com cursor sincronizado.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Ferramentas de Medição Completa:</strong> Distância milimétrica, ângulo de Cobb, elipse com cálculo de densidade Hounsfield (HU) e ROI.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Janelamento Rápido (W/L):</strong> Presets instantâneos para Pulmão, Osso, Cérebro, Partes Moles, Mediastino e Fígado.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Cine Loop Fluido (60 FPS):</strong> Navegação contínua com reprodução automática em tomografias e ultrassonografias.</span>
                  </div>
                </div>

                <div className="tab-cta-wrap">
                  <button className="btn-tab-action" onClick={onOpenDemo}>
                    <span>Testar Visualizador no Navegador</span>
                    <ArrowRight size={16} />
                  </button>
                  <span className="tab-note">Suporte a monitores médicos de alta resolução</span>
                </div>
              </div>

              <div className="tab-preview">
                <div className="preview-card-mockup viewer-demo-preview">
                  <div className="mockup-topbar">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                    <span className="mockup-title">Workstation Web • 4 Viewports MPR Sincronizados</span>
                  </div>
                  <div className="viewer-grid-demo">
                    <div className="view-pane">
                      <div className="pane-tag">AXIAL (CT)</div>
                      <div className="scan-sim-circle ct-scan"></div>
                      <div className="pane-footer">W: 1500 L: -600</div>
                    </div>
                    <div className="view-pane">
                      <div className="pane-tag">SAGITAL</div>
                      <div className="scan-sim-circle ct-sagital"></div>
                      <div className="pane-footer">Zoom: 100%</div>
                    </div>
                    <div className="view-pane">
                      <div className="pane-tag">CORONAL</div>
                      <div className="scan-sim-circle ct-coronal"></div>
                      <div className="pane-footer">Dist: 28.4mm</div>
                    </div>
                    <div className="view-pane">
                      <div className="pane-tag">3D MIP</div>
                      <div className="scan-sim-circle mip-render"></div>
                      <div className="pane-footer">MIP 10mm</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="tab-grid">
              <div className="tab-info">
                <div className="tab-badge-accent">
                  <Sparkles size={16} /> Inteligência Artificial & Laudos
                </div>
                <h3>Emita laudos com até 40% mais rapidez e zero retrabalho</h3>
                <p>
                  Unimos o melhor do reconhecimento de voz adaptado ao vocabulário médico em português com modelos de IA que auxiliam na redação, estruturação e conferência de laudos radiológicos.
                </p>

                <div className="features-checklist">
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Ditado por Voz Inteligente:</strong> Reconhece termos anatômicos, patologias e abreviações com mais de 98% de precisão.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Biblioteca de Máscaras Padronizadas:</strong> Modelos estruturados pré-configurados para todas as subespecialidades.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Conferência Automática de Lateralidade:</strong> A IA alerta caso haja divergência entre o pedido médico e o corpo do laudo (Direita vs Esquerda).</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Assinatura Digital com Certificado ICP-Brasil:</strong> Validade jurídica total para entrega imediata aos pacientes e operadoras.</span>
                  </div>
                </div>

                <div className="tab-cta-wrap">
                  <button className="btn-tab-action" onClick={onOpenDemo}>
                    <span>Ver IA de Laudos em Ação</span>
                    <ArrowRight size={16} />
                  </button>
                  <span className="tab-note">Compatível com microfones comuns e profissionais Philips SpeechMike</span>
                </div>
              </div>

              <div className="tab-preview">
                <div className="preview-card-mockup">
                  <div className="mockup-topbar">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                    <span className="mockup-title">Editor de Laudo • Assistente de IA Ativo</span>
                  </div>
                  <div className="report-editor-mockup">
                    <div className="editor-ai-banner">
                      <Sparkles size={16} className="text-cyan" />
                      <span><strong>IA Sugestão:</strong> Conclusão gerada a partir dos achados descritos.</span>
                    </div>
                    <div className="editor-text-sample">
                      <div className="doc-section">
                        <strong>TÉCNICA:</strong>
                        <p>Exame de Tomografia Computadorizada de Tórax realizado com cortes axiais milimétricos sem contraste.</p>
                      </div>
                      <div className="doc-section">
                        <strong>ANÁLISE COMPARATIVA POR IA:</strong>
                        <p className="text-emerald">Estabilidade dimensional de micronódulo pulmonar em lobo superior direito (4mm vs 4mm em 2025).</p>
                      </div>
                      <div className="doc-signature">
                        <div className="sig-badge">
                          <CheckCircle2 size={14} className="text-emerald" /> Assinado Digitalmente • CRM 12345/SP
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portal' && (
            <div className="tab-grid">
              <div className="tab-info">
                <div className="tab-badge-accent">
                  <MessageSquare size={16} /> Portal do Paciente & WhatsApp
                </div>
                <h3>Economize milhares de reais em papel, impressoras e películas</h3>
                <p>
                  Assim que o laudo é assinado pelo médico radiologista, o paciente e o médico solicitante recebem automaticamente um link seguro no WhatsApp e SMS com visualizador DICOM web e laudo em PDF de alta qualidade.
                </p>

                <div className="features-checklist">
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Disparo 100% Automático via WhatsApp:</strong> Sem necessidade de atendente enviar mensagens manuais uma a uma.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Acesso com QR Code no Protocolo:</strong> O paciente aponta a câmera do celular no comprovante e abre o exame na hora.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Área do Médico Solicitante:</strong> Médicos parceiros acompanham os pacientes com visualização completa das imagens em alta resolução.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Redução Imediata de Custos:</strong> Economia de até 85% em insumos de impressão e atendimento de recepção.</span>
                  </div>
                </div>

                <div className="tab-cta-wrap">
                  <button className="btn-tab-action" onClick={onOpenDemo}>
                    <span>Ver Demonstração de Entrega</span>
                    <ArrowRight size={16} />
                  </button>
                  <span className="tab-note">Personalizado com a logomarca e cores da sua clínica</span>
                </div>
              </div>

              <div className="tab-preview">
                <div className="whatsapp-preview-card">
                  <div className="phone-frame">
                    <div className="phone-header">
                      <div className="phone-avatar">
                        <Smartphone size={16} />
                      </div>
                      <div className="phone-contact">
                        <strong>Clínica Imagem Diagnóstica</strong>
                        <span>Resultado de Exame Disponível</span>
                      </div>
                    </div>
                    <div className="phone-chat-area">
                      <div className="chat-bubble received">
                        <p>Olá, <strong>Mariana Santos</strong>! 👋</p>
                        <p>Seu exame de <strong>Ressonância Magnética</strong> já foi laudado e está disponível para visualização e download.</p>
                        <div className="chat-card-link">
                          <div className="link-title">Visualizar Imagens & Laudo em PDF</div>
                          <div className="link-sub">Clique para abrir no Portal do Paciente Seguro</div>
                        </div>
                        <span className="chat-time">14:32 ✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tele' && (
            <div className="tab-grid">
              <div className="tab-info">
                <div className="tab-badge-accent">
                  <Network size={16} /> Telerradiologia & Gestão
                </div>
                <h3>Escale seu serviço de laudos sem limites geográficos</h3>
                <p>
                  Centralize o fluxo de laudos de múltiplas filiais, hospitais ou parceiros de telerradiologia. Distribua os exames automaticamente por subespecialidade com controle rígido de prazos e SLA.
                </p>

                <div className="features-checklist">
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Roteamento Inteligente por Especialidade:</strong> Encaminhe Neuro para neurorradiologistas, Músculo para musculoesqueléticos, etc.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Alertas de SLA de Urgência & Emergência:</strong> Painel em tempo real com contagem regressiva para exames prioritários.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Gestão Multiempresas Centralizada:</strong> Separação segura de dados de diferentes clínicas em uma única instalação.</span>
                  </div>
                  <div className="check-item">
                    <CheckCircle2 size={18} className="text-cyan" />
                    <span><strong>Relatórios de Produtividade:</strong> Acompanhe volume laudado por radiologista, tempo médio de entrega e taxa de retrabalho.</span>
                  </div>
                </div>

                <div className="tab-cta-wrap">
                  <button className="btn-tab-action" onClick={onOpenDemo}>
                    <span>Agendar Demonstração para Telerradiologia</span>
                    <ArrowRight size={16} />
                  </button>
                  <span className="tab-note">Suporte a integração com prontuários via HL7 / API REST</span>
                </div>
              </div>

              <div className="tab-preview">
                <div className="preview-card-mockup">
                  <div className="mockup-topbar">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                    <span className="mockup-title">Worklist Central • Gestão de SLA em Tempo Real</span>
                  </div>
                  <div className="worklist-mockup-body">
                    <div className="sla-alert-row urgent">
                      <div className="sla-badge">URGÊNCIA • 18m restantes</div>
                      <div className="sla-info">CT CRÂNIO • Trauma • Hosp. São Lucas</div>
                      <div className="sla-status">Em análise</div>
                    </div>
                    <div className="sla-alert-row normal">
                      <div className="sla-badge green">ROTINA • 4h restantes</div>
                      <div className="sla-info">RM JOELHO • Clínica Santa Helena</div>
                      <div className="sla-status">Aguardando Laudo</div>
                    </div>
                    <div className="sla-alert-row normal">
                      <div className="sla-badge green">ROTINA • 6h restantes</div>
                      <div className="sla-info">US ABDÔMEN TOTAL • Unidade Centro</div>
                      <div className="sla-status">Laudo Concluído</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;
