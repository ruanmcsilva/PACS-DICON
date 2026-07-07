
const Sidebar = () => {
  return (
    <nav className="sidebar glass-panel">
      <div className="sidebar-logo">
        {/* Simple SVG icon for Logo */}
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          <path d="M5 3v4"/>
          <path d="M19 17v4"/>
          <path d="M3 5h4"/>
          <path d="M17 19h4"/>
        </svg>
        PACS-DICOM
      </div>
      
      <div className="sidebar-nav">
        <a href="#" className="nav-item active">
          Worklist (Exames)
        </a>
        <a href="#" className="nav-item">
          Viewer (Imagens)
        </a>
        <a href="#" className="nav-item">
          Laudos (Reports)
        </a>
        <a href="#" className="nav-item">
          Integração HL7
        </a>
      </div>
      
      {/* Spacer to push admin to bottom */}
      <div style={{ flex: 1 }}></div>

      <div className="sidebar-nav" style={{ paddingBottom: '24px' }}>
        <a href="#" className="nav-item">
          Configurações
        </a>
      </div>
    </nav>
  );
};

export default Sidebar;
