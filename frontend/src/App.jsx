import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import StudentView from './pages/StudentView';
import AdminView from './pages/AdminView';
import DisplayView from './pages/DisplayView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
            <h1 style={{color: '#005eb8'}}>מערכת פאנל בחירות - כנסת 26</h1>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '40px' }}>
              <Link to="/student"><button style={btnStyle}>כניסת תלמידים</button></Link>
              <Link to="/admin"><button style={btnStyle}>ניהול מנחה</button></Link>
              <Link to="/display"><button style={btnStyle}>מסך מקרן ראשי</button></Link>
            </div>
          </div>
        } />
        <Route path="/student" element={<StudentView />} />
        <Route path="/admin" element={<AdminView />} />
        <Route path="/display" element={<DisplayView />} />
      </Routes>
    </BrowserRouter>
  );
}
const btnStyle = { padding: '15px 30px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#005eb8', color: 'white', border: 'none', borderRadius: '5px' };
