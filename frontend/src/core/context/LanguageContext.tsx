import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'pt' | 'en';

export interface Translations {
  [key: string]: string;
}

const translations: Record<Language, Translations> = {
  pt: {
    // Top Bar
    'topbar.status': 'Servidores MinIO S3: 100% Operacionais (SLA 99.99%)',
    'topbar.promo': 'Implantação em até 24h e 14 dias de teste grátis',
    'topbar.phone': 'Plantão Comercial: (82) 98765-4321',

    // Header
    'header.brandSubtitle': 'PACS & Telerradiologia',
    'header.home': 'Início',
    'header.solutions': 'Soluções',
    'header.workstation': 'Workstation DICOM',
    'header.calculator': 'Calculadora ROI',
    'header.faq': 'Dúvidas (FAQ)',
    'header.contact': 'Fale Conosco',
    'header.demo': 'Testar Grátis',
    'header.portal': 'Acessar Portal (PACS / DICOM)',
    'header.portalShort': 'Portal PACS',
    'header.requestDemo': 'Solicitar Demonstração Gratuita',

    // Themes & Presets
    'theme.light': 'Modo Claro',
    'theme.dark': 'Modo Escuro',
    'theme.whiteGreen': 'Branco e Verde',
    'theme.blueWhite': 'Azul e Branco',
    'theme.green': 'Verde',
    'theme.blue': 'Azul',
    'theme.color': 'Cor',
    'lang.portuguese': 'Português',
    'lang.english': 'English',
    'lang.switch': 'Mudar Idioma',

    // Hero Section
    'hero.badge': 'PACS Cloud Enterprise • Zero Pegada Local',
    'hero.titlePre': 'O PACS Cloud que Transforma sua Clínica em uma ',
    'hero.titleHighlight': 'Central de Diagnóstico Ágil',
    'hero.subtitle': 'Armazenamento em nuvem ultraveloz com MinIO S3, visualizador DICOM Web zero-footprint, laudos integrados e entrega de exames automatizada via WhatsApp. Tudo sem servidores locais.',
    'hero.btnDemo': 'Solicitar Demonstração Grátis',
    'hero.btnPortal': 'Acessar Portal Médico',
    'hero.pill1': 'Armazenamento Ilimitado MinIO',
    'hero.pill2': 'Zero Instalação Local',
    'hero.pill3': 'Laudos com IA & Reconhecimento de Voz',
    'hero.pill4': 'Entrega via WhatsApp & QR Code',
    
    // Simulator
    'simulator.title': 'Simulador de Workstation Diagnóstica DICOM Web',
    'simulator.subtitle': 'Experimente em tempo real as ferramentas diagnósticas do visualizador integrado.',
    'simulator.presetBrain': 'Cérebro',
    'simulator.presetBone': 'Osso',
    'simulator.presetLung': 'Pulmão',
    'simulator.presetSoftTissue': 'Partes Moles',
    'simulator.invert': 'Inverter',
    'simulator.playCine': 'Tocar CINE',
    'simulator.pauseCine': 'Pausar CINE',
    'simulator.measure': 'Régua',
    'simulator.reset': 'Resetar',
    'simulator.slice': 'Corte',
    'simulator.zoom': 'Zoom',
    'simulator.interactiveHint': 'Visualizador Interativo • Experimente os filtros diagnósticos acima',

    // Stats Section
    'stats.pill': 'Especificações de Engenharia & Performance',
    'stats.titlePre': 'Arquitetura e Performance Projetadas para o ',
    'stats.titleHighlight': 'Diagnóstico por Imagem',
    'stats.subtitle': 'Uma infraestrutura moderna em nuvem concebida para oferecer transmissão ultrarrápida de exames, segurança biomédica e zero burocracia de servidores locais.',
    'stats.card1.val': '< 1.2s',
    'stats.card1.title': 'Abertura Instantânea',
    'stats.card1.desc': 'Streaming progressivo de tomografias com 1.000+ cortes direto no navegador via MinIO S3.',
    'stats.card2.val': '100% Web',
    'stats.card2.title': 'Zero-Footprint Real',
    'stats.card2.desc': 'Sem necessidade de instalar programas pesados. Funciona em qualquer PC, Mac ou tablet.',
    'stats.card3.val': 'AES-256',
    'stats.card3.title': 'Criptografia & LGPD',
    'stats.card3.desc': 'Segurança médica de ponta a ponta com trilha de auditoria e conformidade com o CFM e LGPD.',
    'stats.card4.val': 'DICOM 3.0',
    'stats.card4.title': 'Conectividade Universal',
    'stats.card4.desc': 'Compatibilidade nativa com aparelhos de imagem de qualquer fabricante (GE, Siemens, Philips, Canon).',
    'stats.card5.val': 'Ilimitado',
    'stats.card5.title': 'Sem Trava por Licença',
    'stats.card5.desc': 'Cadastre quantos radiologistas, técnicos e recepcionistas precisar sem custos extras por máquina.',

    // Solutions Section
    'solutions.pill': 'Soluções Completas de Ponta a Ponta',
    'solutions.titlePre': 'Tudo o que sua Clínica ou Hospital Precisa em ',
    'solutions.titleHighlight': 'Uma Única Plataforma',
    'solutions.subtitle': 'Do recebimento do exame no aparelho à entrega do laudo assinado no WhatsApp do paciente.',
    'solutions.tabPacs': 'PACS Cloud Nativo',
    'solutions.tabViewer': 'Workstation DICOM Web',
    'solutions.tabAi': 'Laudos com IA',
    'solutions.tabPortal': 'Portal do Paciente & WhatsApp',
    'solutions.tabTele': 'Telerradiologia & Gestão',

    // Modalities Section
    'modalities.pill': 'Ampla Compatibilidade Médica',
    'modalities.titlePre': 'Conecte Qualquer Modalidade ',
    'modalities.titleHighlight': 'DICOM 3.0',
    'modalities.subtitle': 'Integração transparente com tomógrafos, ressonâncias, ultrassons, raio-x digitais e mamógrafos.',

    // Comparison Section
    'comparison.pill': 'Por que Modernizar com Nosso PACS Cloud?',
    'comparison.titlePre': 'PACS Tradicional vs ',
    'comparison.titleHighlight': 'PACS Cloud Moderno',
    'comparison.subtitle': 'Entenda por que clínicas e hospitais estão abandonando servidores físicos e licenças por estação.',
    'comparison.traditionalHeader': 'PACS Tradicional (Servidores Locais)',
    'comparison.cloudHeader': 'Nosso PACS Cloud Enterprise',

    // ROI Calculator Section
    'roi.pill': 'Simulador de Retorno sobre Investimento (ROI)',
    'roi.titlePre': 'Descubra Quanto sua Clínica Pode ',
    'roi.titleHighlight': 'Economizar Todo Ano',
    'roi.subtitle': 'A substituição de películas, impressões em papel e servidores locais pelo PACS Cloud gera economia imediata no primeiro mês.',
    'roi.sliderQuestion': 'Qual é o volume mensal de exames da sua clínica?',
    'roi.examUnit': 'exames / mês',
    'roi.annualSaving': 'Economia Anual Estimada',
    'roi.monthlySaving': 'Economia Mensal Estimada',
    'roi.btnCalculate': 'Solicitar Proposta com essa Economia',

    // Testimonials Section
    'testimonials.pill': 'Casos de Sucesso Reais',
    'testimonials.titlePre': 'O que Dizem os ',
    'testimonials.titleHighlight': 'Radiologistas e Gestores',
    'testimonials.subtitle': 'Médicos e administradores de clínicas relatam aumento de produtividade e redução expressiva de custos.',

    // FAQ Section
    'faq.pill': 'Tire Suas Dúvidas',
    'faq.titlePre': 'Perguntas Frequentes Sobre o ',
    'faq.titleHighlight': 'PACS Cloud',
    'faq.subtitle': 'Encontre respostas diretas para as perguntas mais comuns de médicos e administradores de clínicas.',

    // Contact Section
    'contact.pill': 'Atendimento Comercial e Suporte Técnico',
    'contact.titlePre': 'Pronto para Transformar o ',
    'contact.titleHighlight': 'Diagnóstico da sua Clínica?',
    'contact.subtitle': 'Fale diretamente com nossos engenheiros biomédicos e consultores de telerradiologia.',
    'contact.formName': 'Seu Nome Completo',
    'contact.formEmail': 'E-mail Corporativo',
    'contact.formPhone': 'Telefone / WhatsApp',
    'contact.formClinic': 'Nome da Clínica ou Hospital',
    'contact.formVolume': 'Volume Mensal Estimado de Exames',
    'contact.formMsg': 'Como podemos ajudar sua instituição?',
    'contact.btnSubmit': 'Enviar e Iniciar Teste Grátis de 14 Dias',

    // Footer
    'footer.description': 'Plataforma médica de alto desempenho para armazenamento de exames DICOM em nuvem, visualização diagnóstica zero-footprint e telerradiologia colaborativa.',
    'footer.navigation': 'Navegação',
    'footer.solutions': 'Soluções Médicas',
    'footer.contact': 'Contato & Suporte',
    'footer.rights': 'Todos os direitos reservados. Conformidade com CFM, CBR e LGPD.',

    // App Layout / Worklist / Internal Portal
    'portal.title': 'Worklist de Exames',
    'portal.subtitle': 'Visão geral dos pacientes e estudos recebidos pelo Servidor DICOM.',
    'portal.studiesToday': 'Estudos Hoje',
    'portal.studiesTodaySub': 'Exames recebidos hoje',
    'portal.imagesProcessed': 'Imagens Processadas',
    'portal.imagesProcessedSub': 'Armazenadas no MinIO',
    'portal.pendingReports': 'Laudos Pendentes',
    'portal.pendingReportsSub': 'Requer atenção imediata',
    
    // Sidebar
    'sidebar.worklist': 'Worklist (Exames)',
    'sidebar.videos': 'Vídeos (CINE)',
    'sidebar.reports': 'Laudos (Reports)',
    'sidebar.hl7': 'Integração HL7',
    'sidebar.settings': 'Configurações (DICOM)',
    'sidebar.logout': 'Sair do Sistema',

    // Worklist Table & Filters
    'worklist.studiesFound': 'exames encontrados',
    'worklist.importDicom': 'Importar DICOM',
    'worklist.logout': 'Sair',
    'worklist.filterPatient': 'Nome do Paciente',
    'worklist.filterPatientPlaceholder': 'Buscar por nome...',
    'worklist.filterId': 'ID do Paciente',
    'worklist.filterIdPlaceholder': 'Buscar por ID...',
    'worklist.filterDate': 'Data do Exame',
    'worklist.colPatient': 'Paciente',
    'worklist.colId': 'ID',
    'worklist.colModality': 'Modalidade',
    'worklist.colDate': 'Data',
    'worklist.colDescription': 'Descrição',
    'worklist.colImages': 'Imagens',
    'worklist.colStatus': 'Status',
    'worklist.colActions': 'Ações',
    'worklist.btnView': 'Visualizar',
    'worklist.btnReport': 'Laudo',
    'worklist.btnDelete': 'Excluir',
    'worklist.empty': 'Nenhum exame recebido ainda. Envie um ping (C-ECHO) ou imagem (C-STORE) para a porta 11112.',
    'worklist.loading': 'Carregando exames...',

    // Login
    'login.title': 'PACS Enterprise',
    'login.subtitle': 'Insira suas credenciais médicas',
    'login.username': 'Usuário',
    'login.password': 'Senha',
    'login.remember': 'Salvar login',
    'login.forgot': 'Esqueci a senha',
    'login.submit': 'Acessar Sistema',
    'login.loading': 'Autenticando...',
    'login.error': 'Credenciais inválidas. Tente novamente.',
    'login.backHome': 'Voltar para Início',

    // Support Widget
    'support.online': 'Suporte Médico Online',
    'support.helpTitle': 'Central de Atendimento',
    'support.whatsapp': 'Falar pelo WhatsApp',
  },
  en: {
    // Top Bar
    'topbar.status': 'MinIO S3 Servers: 100% Operational (99.99% SLA)',
    'topbar.promo': 'Deployment within 24h & 14-day free trial',
    'topbar.phone': 'Sales Support: +1 (800) 555-0199',

    // Header
    'header.brandSubtitle': 'PACS & Teleradiology',
    'header.home': 'Home',
    'header.solutions': 'Solutions',
    'header.workstation': 'DICOM Workstation',
    'header.calculator': 'ROI Calculator',
    'header.faq': 'FAQ',
    'header.contact': 'Contact Us',
    'header.demo': 'Free Trial',
    'header.portal': 'Access Portal (PACS / DICOM)',
    'header.portalShort': 'PACS Portal',
    'header.requestDemo': 'Request Free Demo',

    // Themes & Presets
    'theme.light': 'Light Mode',
    'theme.dark': 'Dark Mode',
    'theme.whiteGreen': 'White & Green',
    'theme.blueWhite': 'Blue & White',
    'theme.green': 'Green',
    'theme.blue': 'Blue',
    'theme.color': 'Color',
    'lang.portuguese': 'Português',
    'lang.english': 'English',
    'lang.switch': 'Switch Language',

    // Hero Section
    'hero.badge': 'Enterprise Cloud PACS • Zero Local Footprint',
    'hero.titlePre': 'The Cloud PACS Transforming your Clinic into an ',
    'hero.titleHighlight': 'Agile Diagnostic Center',
    'hero.subtitle': 'Ultra-fast cloud storage with MinIO S3, zero-footprint web DICOM viewer, integrated reporting, and automated WhatsApp delivery. All with zero local servers.',
    'hero.btnDemo': 'Request Free Demo',
    'hero.btnPortal': 'Access Medical Portal',
    'hero.pill1': 'Unlimited MinIO Storage',
    'hero.pill2': 'Zero Local Installation',
    'hero.pill3': 'AI Structured Reports & Voice',
    'hero.pill4': 'Delivery via WhatsApp & QR Code',

    // Simulator
    'simulator.title': 'DICOM Web Diagnostic Workstation Simulator',
    'simulator.subtitle': 'Experience in real time the diagnostic tools of our integrated viewer.',
    'simulator.presetBrain': 'Brain',
    'simulator.presetBone': 'Bone',
    'simulator.presetLung': 'Lung',
    'simulator.presetSoftTissue': 'Soft Tissue',
    'simulator.invert': 'Invert',
    'simulator.playCine': 'Play CINE',
    'simulator.pauseCine': 'Pause CINE',
    'simulator.measure': 'Ruler',
    'simulator.reset': 'Reset',
    'simulator.slice': 'Slice',
    'simulator.zoom': 'Zoom',
    'simulator.interactiveHint': 'Interactive Viewer • Test the diagnostic filters above',

    // Stats Section
    'stats.pill': 'Engineering & Performance Specs',
    'stats.titlePre': 'Architecture & Performance Engineered for ',
    'stats.titleHighlight': 'Diagnostic Imaging',
    'stats.subtitle': 'A modern cloud infrastructure engineered to provide ultra-fast study streaming, biomedical security, and zero local server hassle.',
    'stats.card1.val': '< 1.2s',
    'stats.card1.title': 'Instant Loading',
    'stats.card1.desc': 'Progressive streaming of CT scans with 1,000+ slices directly in the browser via MinIO S3.',
    'stats.card2.val': '100% Web',
    'stats.card2.title': 'True Zero-Footprint',
    'stats.card2.desc': 'No need to install heavy software. Works on any PC, Mac, iPad, or tablet.',
    'stats.card3.val': 'AES-256',
    'stats.card3.title': 'Encryption & HIPAA / GDPR',
    'stats.card3.desc': 'End-to-end medical security with comprehensive audit trails and full regulatory compliance.',
    'stats.card4.val': 'DICOM 3.0',
    'stats.card4.title': 'Universal Connectivity',
    'stats.card4.desc': 'Native compatibility with imaging modalities from any manufacturer (GE, Siemens, Philips, Canon).',
    'stats.card5.val': 'Unlimited',
    'stats.card5.title': 'No Per-Machine Locks',
    'stats.card5.desc': 'Register as many radiologists, techs, and receptionists as needed with zero extra cost per machine.',

    // Solutions Section
    'solutions.pill': 'Complete End-to-End Solutions',
    'solutions.titlePre': 'Everything your Clinic or Hospital Needs in ',
    'solutions.titleHighlight': 'A Single Platform',
    'solutions.subtitle': 'From study acquisition at the modality to verified diagnostic report delivery on WhatsApp.',
    'solutions.tabPacs': 'Native Cloud PACS',
    'solutions.tabViewer': 'Web DICOM Workstation',
    'solutions.tabAi': 'AI Reports & Dictation',
    'solutions.tabPortal': 'Patient Portal & WhatsApp',
    'solutions.tabTele': 'Teleradiology & Workflow',

    // Modalities Section
    'modalities.pill': 'Broad Healthcare Compatibility',
    'modalities.titlePre': 'Connect Any Modality with ',
    'modalities.titleHighlight': 'DICOM 3.0',
    'modalities.subtitle': 'Seamless integration with CT scanners, MRIs, Ultrasounds, Digital X-rays, and Mammography units.',

    // Comparison Section
    'comparison.pill': 'Why Upgrade to Our Cloud PACS?',
    'comparison.titlePre': 'Traditional PACS vs ',
    'comparison.titleHighlight': 'Next-Gen Cloud PACS',
    'comparison.subtitle': 'Discover why clinics and hospitals are leaving physical servers and per-seat licenses behind.',
    'comparison.traditionalHeader': 'Traditional PACS (Local Servers)',
    'comparison.cloudHeader': 'Our Enterprise Cloud PACS',

    // ROI Calculator Section
    'roi.pill': 'Return on Investment (ROI) Simulator',
    'roi.titlePre': 'Discover How Much Your Clinic Can ',
    'roi.titleHighlight': 'Save Every Year',
    'roi.subtitle': 'Replacing film printing, paper envelopes, and local servers with Cloud PACS generates instant savings from month one.',
    'roi.sliderQuestion': 'What is your clinic’s monthly study volume?',
    'roi.examUnit': 'studies / month',
    'roi.annualSaving': 'Estimated Annual Savings',
    'roi.monthlySaving': 'Estimated Monthly Savings',
    'roi.btnCalculate': 'Request Proposal with These Savings',

    // Testimonials Section
    'testimonials.pill': 'Real Success Stories',
    'testimonials.titlePre': 'What Leading ',
    'testimonials.titleHighlight': 'Radiologists & Directors Say',
    'testimonials.subtitle': 'Physicians and clinic administrators report increased diagnostic speed and major operational cost cuts.',

    // FAQ Section
    'faq.pill': 'Frequently Asked Questions',
    'faq.titlePre': 'Frequently Asked Questions About ',
    'faq.titleHighlight': 'Cloud PACS',
    'faq.subtitle': 'Find clear answers to the most common questions asked by doctors and healthcare clinic administrators.',

    // Contact Section
    'contact.pill': 'Sales & Technical Support',
    'contact.titlePre': 'Ready to Modernize Your ',
    'contact.titleHighlight': 'Diagnostic Imaging Service?',
    'contact.subtitle': 'Speak directly with our biomedical engineers and teleradiology workflow specialists.',
    'contact.formName': 'Full Name',
    'contact.formEmail': 'Corporate Email',
    'contact.formPhone': 'Phone / WhatsApp',
    'contact.formClinic': 'Clinic or Hospital Name',
    'contact.formVolume': 'Estimated Monthly Study Volume',
    'contact.formMsg': 'How can we assist your institution?',
    'contact.btnSubmit': 'Submit & Start 14-Day Free Trial',

    // Footer
    'footer.description': 'High-performance medical platform for cloud DICOM study archiving, zero-footprint diagnostic viewing, and collaborative teleradiology.',
    'footer.navigation': 'Navigation',
    'footer.solutions': 'Medical Solutions',
    'footer.contact': 'Contact & Support',
    'footer.rights': 'All rights reserved. In compliance with CFM, ACR, CBR, and HIPAA / GDPR.',

    // App Layout / Worklist / Internal Portal
    'portal.title': 'Studies Worklist',
    'portal.subtitle': 'Overview of patients and studies received by the DICOM Server.',
    'portal.studiesToday': 'Studies Today',
    'portal.studiesTodaySub': 'Exams received today',
    'portal.imagesProcessed': 'Processed Images',
    'portal.imagesProcessedSub': 'Stored in MinIO',
    'portal.pendingReports': 'Pending Reports',
    'portal.pendingReportsSub': 'Requires immediate attention',
    
    // Sidebar
    'sidebar.worklist': 'Worklist (Studies)',
    'sidebar.videos': 'Videos (CINE)',
    'sidebar.reports': 'Reports (Laudos)',
    'sidebar.hl7': 'HL7 Integration',
    'sidebar.settings': 'Settings (DICOM)',
    'sidebar.logout': 'Sign Out',

    // Worklist Table & Filters
    'worklist.studiesFound': 'studies found',
    'worklist.importDicom': 'Import DICOM',
    'worklist.logout': 'Logout',
    'worklist.filterPatient': 'Patient Name',
    'worklist.filterPatientPlaceholder': 'Search by name...',
    'worklist.filterId': 'Patient ID',
    'worklist.filterIdPlaceholder': 'Search by ID...',
    'worklist.filterDate': 'Study Date',
    'worklist.colPatient': 'Patient',
    'worklist.colId': 'ID',
    'worklist.colModality': 'Modality',
    'worklist.colDate': 'Date',
    'worklist.colDescription': 'Description',
    'worklist.colImages': 'Images',
    'worklist.colStatus': 'Status',
    'worklist.colActions': 'Actions',
    'worklist.btnView': 'View',
    'worklist.btnReport': 'Report',
    'worklist.btnDelete': 'Delete',
    'worklist.empty': 'No studies received yet. Send a C-ECHO ping or C-STORE image to port 11112.',
    'worklist.loading': 'Loading studies...',

    // Login
    'login.title': 'PACS Enterprise',
    'login.subtitle': 'Enter your medical credentials',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.remember': 'Remember login',
    'login.forgot': 'Forgot password',
    'login.submit': 'Sign In',
    'login.loading': 'Authenticating...',
    'login.error': 'Invalid credentials. Please try again.',
    'login.backHome': 'Back to Home',

    // Support Widget
    'support.online': 'Medical Support Online',
    'support.helpTitle': 'Help & Support Center',
    'support.whatsapp': 'Chat via WhatsApp',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'pt',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'en' || saved === 'pt') ? saved : 'pt';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'pt' ? 'en' : 'pt');
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to Portuguese or defaultText or key
    if (translations.pt && translations.pt[key]) {
      return translations.pt[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
