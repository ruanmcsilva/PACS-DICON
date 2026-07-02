import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Viewer from './viewer/Viewer';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App" style={{ display: 'flex', height: '100vh', width: '100vw', margin: 0, padding: 0, overflow: 'hidden' }}>
        <nav style={{ width: '200px', backgroundColor: '#333', color: 'white', padding: '1rem', borderRight: '1px solid #444' }}>
          <h2>PACS/DICOM</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '1rem' }}><Link to="/" style={{ color: '#ccc', textDecoration: 'none' }}>Dashboard</Link></li>
            <li><Link to="/viewer" style={{ color: '#ccc', textDecoration: 'none' }}>Viewer</Link></li>
          </ul>
        </nav>
        <main style={{ flex: 1, backgroundColor: '#1e1e1e' }}>
          <Routes>
            <Route path="/" element={<div style={{ padding: '2rem', color: 'white' }}><h1>Welcome to PACS/DICOM Platform</h1></div>} />
            <Route path="/viewer" element={<Viewer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
