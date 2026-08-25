import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://knesset-backend.onrender.com');

const ROUND_TITLES = {
  1: 'כלכלי חברתי',
  2: 'ישראל כמדינה יהודית',
  3: 'רפורמה משפטית',
  4: 'גיוס',
  5: 'מדיני בטחוני',
  6: 'שיטת הממשל'
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;800&display=swap');

  .admin-app {
    min-height: 100vh;
    background: #f0f4f8;
    font-family: 'Rubik', sans-serif;
    direction: rtl;
    padding: 40px 20px;
    color: #333;
  }

  .admin-container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  }

  h1 { text-align: center; color: #1756a9; font-size: 36px; margin-bottom: 30px; }
  h2 { color: #1756a9; margin-bottom: 20px; border-bottom: 2px solid #e1e8f0; padding-bottom: 10px; }

  .form-group { margin-bottom: 25px; }
  label { display: block; font-weight: 600; margin-bottom: 10px; font-size: 18px; }
  input[type="text"] {
    width: 100%; padding: 15px; border: 2px solid #e1e8f0;
    border-radius: 12px; font-size: 18px; box-sizing: border-box;
    font-family: 'Rubik', sans-serif;
  }
  input[type="text"]:focus { outline: none; border-color: #0ea5e9; }

  .btn {
    background: #1756a9; color: white; border: none; padding: 15px 30px;
    border-radius: 12px; font-size: 20px; font-weight: bold; cursor: pointer;
    transition: all 0.2s; font-family: 'Rubik', sans-serif;
  }
  .btn:hover { background: #0ea5e9; transform: translateY(-2px); }
  
  .btn-phase {
    display: block; width: 100%; margin-bottom: 15px; background: #0ea5e9;
  }
  .btn-phase.active { background: #10b981; pointer-events: none; }
  .btn-summary { background: #f59e0b; }
  .btn-summary:hover { background: #d97706; }

  .dashboard-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px;
  }
  
  .stat-box {
    background: #f8fafc; padding: 20px; border-radius: 12px;
    text-align: center; border: 1px solid #e1e8f0;
  }
  .stat-number { font-size: 40px; font-weight: 800; color: #0ea5e9; }

  .help-text { font-size: 14px; color: #64748b; margin-top: 5px; }
`;

export default function AdminView() {
  const [isCreated, setIsCreated] = useState(false);
  const [eventCode, setEventCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [schoolName, setSchoolName] = useState('');
  const [repsInput, setRepsInput] = useState('');
  
  const [participants, setParticipants] = useState(0);
  const [phase, setPhase] = useState('waiting'); // waiting, warmup, round1..6, summary

  useEffect(() => {
    socket.on('live_results', (data) => {
      setParticipants(data.participants);
      setPhase(data.phase);
    });
    
    socket.on('participants_update', (count) => {
      setParticipants(count);
    });

    return () => {
      socket.off('live_results');
      socket.off('participants_update');
    };
  }, []);

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!schoolName || !repsInput) return alert('נא למלא את כל השדות');
    
    const representatives = repsInput.split(',').map(r => r.trim()).filter(r => r !== '');
    if (representatives.length < 2) return alert('יש להזין לפחות 2 נציגים מופרדים בפסיק');

    socket.emit('create_event', { eventCode, schoolName, representatives });
    setIsCreated(true);
  };

  const changePhase = (newPhase) => {
    if (window.confirm('האם אתה בטוח שברצונך להעביר את כל התלמידים לשלב זה?')) {
      socket.emit('change_phase', { eventCode, phase: newPhase });
      setPhase(newPhase);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="admin-app">
        <div className="admin-container">
          <h1>מערכת ניהול פאנל בחירות 🇮🇱</h1>

          {!isCreated ? (
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>שם בית הספר / מוסד:</label>
                <input 
                  type="text" 
                  value={schoolName} 
                  onChange={e => setSchoolName(e.target.value)} 
                  placeholder="לדוגמה: תיכון בליך"
                />
              </div>

              <div className="form-group">
                <label>נציגי הפאנל (מופרדים בפסיק):</label>
                <input 
                  type="text" 
                  value={repsInput} 
                  onChange={e => setRepsInput(e.target.value)} 
                  placeholder="לדוגמה: יריב לוין, יאיר לפיד, איתמר בן גביר"
                />
                <div className="help-text">* התלמידים יבחרו מתוך השמות האלו במהלך הסבבים</div>
              </div>

              <button type="submit" className="btn" style={{ width: '100%' }}>
                צור פאנל חדש
              </button>
            </form>
          ) : (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '30px', padding: '20px', background: '#eff6ff', borderRadius: '12px' }}>
                <h2 style={{ border: 'none', margin: '0 0 10px 0' }}>קוד הכניסה לתלמידים:</h2>
                <div style={{ fontSize: '60px', fontWeight: '800', color: '#1756a9', letterSpacing: '10px' }}>{eventCode}</div>
              </div>

              <div className="dashboard-grid">
                <div className="stat-box">
                  <div className="stat-number">{participants}</div>
                  <div>תלמידים מחוברים</div>
                </div>
                <div className="stat-box">
                  <div className="stat-number" style={{ fontSize: '24px', lineHeight: '40px' }}>
                    {phase === 'waiting' && 'המתנה'}
                    {phase === 'warmup' && 'שאלת חימום'}
                    {phase.startsWith('round') && `סבב ${phase.replace('round', '')}`}
                    {phase === 'summary' && 'שאלון סיום'}
                  </div>
                  <div>שלב נוכחי</div>
                </div>
              </div>

              <h2 style={{ marginTop: '40px' }}>שליטה בשלבי הפאנל</h2>
              <p className="help-text" style={{ marginBottom: '20px' }}>לחיצה על כפתור תעביר אוטומטית את כל המסכים של התלמידים באולם לשלב הנבחר.</p>

              <button className={`btn btn-phase ${phase === 'warmup' ? 'active' : ''}`} onClick={() => changePhase('warmup')}>
                🔥 הפעל שאלת חימום (את מי תרצו לשמוע?)
              </button>
              
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button 
                  key={num} 
                  className={`btn btn-phase ${phase === 'round' + num ? 'active' : ''}`} 
                  onClick={() => changePhase(`round${num}`)}
                >
                  סבב {num}: {ROUND_TITLES[num]}
                </button>
              ))}

              <button className={`btn btn-phase btn-summary ${phase === 'summary' ? 'active' : ''}`} onClick={() => changePhase('summary')} style={{ marginTop: '30px' }}>
                📝 סיום פאנל - הפעל שאלון סיכום
              </button>

            </div>
          )}
        </div>
      </div>
    </>
  );
}