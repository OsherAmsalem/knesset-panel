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

  .admin-app { min-height: 100vh; background: #f0f4f8; font-family: 'Rubik', sans-serif; direction: rtl; padding: 40px 20px; color: #333; }
  .admin-container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
  h1 { text-align: center; color: #1756a9; font-size: 36px; margin-bottom: 30px; }
  h2 { color: #1756a9; margin-bottom: 20px; border-bottom: 2px solid #e1e8f0; padding-bottom: 10px; }

  .form-group { margin-bottom: 25px; }
  label { display: block; font-weight: 600; margin-bottom: 10px; font-size: 18px; }
  input[type="text"] { width: 100%; padding: 15px; border: 2px solid #e1e8f0; border-radius: 12px; font-size: 18px; box-sizing: border-box; font-family: 'Rubik', sans-serif; }
  input[type="text"]:focus { outline: none; border-color: #0ea5e9; }

  .btn { background: #1756a9; color: white; border: none; padding: 15px 30px; border-radius: 12px; font-size: 20px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-family: 'Rubik', sans-serif; }
  .btn:hover { background: #0ea5e9; transform: translateY(-2px); }
  
  .btn-phase { display: block; width: 100%; margin-bottom: 15px; background: #0ea5e9; }
  .btn-phase.active { background: #10b981; pointer-events: none; }
  .btn-summary { background: #f59e0b; }
  .btn-summary:hover { background: #d97706; }

  .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
  .stat-box { background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #e1e8f0; }
  .stat-number { font-size: 40px; font-weight: 800; color: #0ea5e9; }
  .help-text { font-size: 14px; color: #64748b; margin-top: 5px; }

  .private-dashboard { margin-top: 50px; padding: 30px; background: #fff; border: 2px dashed #f59e0b; border-radius: 20px; box-shadow: 0 5px 20px rgba(245, 158, 11, 0.15); }
  .private-dashboard h3 { color: #d97706; margin-top: 0; text-align: center; font-size: 28px; }
  
  .rating-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
  .rating-box { background: #fef3c7; padding: 20px; border-radius: 15px; text-align: center; border: 1px solid #fde68a; }
  .rating-number { font-size: 48px; font-weight: 800; color: #d97706; }

  .global-stats-container { background: #ecfdf5; padding: 20px; border-radius: 15px; border: 1px solid #a7f3d0; margin-top: 20px; }
  .global-title { color: #059669; font-size: 22px; text-align: center; margin-bottom: 20px; font-weight: bold; }

  .mini-bar-row { margin-bottom: 12px; }
  .mini-bar-label { font-size: 16px; margin-bottom: 4px; font-weight: bold; color: #333; }
  .mini-bar-track { background: #e2e8f0; height: 25px; border-radius: 12px; position: relative; overflow: hidden; }
  .mini-bar-fill { height: 100%; background: #0ea5e9; transition: width 1s; }
  .mini-bar-fill.green { background: #10b981; }
  .mini-bar-value { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-weight: bold; color: white; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
  
  /* כפתור מחיקה חדש */
  .btn-reset { width: 100%; padding: 15px; background: #ef4444; color: white; border: none; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer; margin-top: 30px; transition: 0.2s; font-family: 'Rubik', sans-serif; }
  .btn-reset:hover { background: #dc2626; }
`;

export default function AdminView() {
  const [isCreated, setIsCreated] = useState(false);
  const [eventCode, setEventCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [schoolName, setSchoolName] = useState('');
  const [repsInput, setRepsInput] = useState('');
  
  const [participants, setParticipants] = useState(0);
  const [phase, setPhase] = useState('waiting'); 
  
  const [summaryResults, setSummaryResults] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);

  useEffect(() => {
    const handleDataUpdate = (data) => {
      setParticipants(data.participants);
      setPhase(data.phase);
      setSummaryResults(data.summaryResults);
      setGlobalStats(data.globalStats);
    };

    socket.on('live_results', handleDataUpdate);
    socket.on('event_state', handleDataUpdate);
    socket.on('phase_changed', handleDataUpdate);
    
    socket.on('participants_update', (count) => {
      setParticipants(count);
    });

    return () => {
      socket.off('live_results');
      socket.off('event_state');
      socket.off('phase_changed');
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

  // פונקציית האיפוס החדשה
  const handleResetGlobalStats = () => {
    if (window.confirm('⚠️ אזהרה: פעולה זו תאפס לחלוטין את כל הנתונים הארציים שנשמרו בשרת מכל ההצבעות עד כה. האם להמשיך?')) {
      socket.emit('reset_global_stats', { eventCode });
    }
  };

  const getAvg = (sum, count) => count > 0 ? (sum / count).toFixed(1) : 0;

  const renderMiniChart = (dataObj, colorClass = '') => {
    if(!dataObj || Object.keys(dataObj).length === 0) return <div style={{ opacity: 0.5 }}>אין נתונים</div>;
    const items = Object.entries(dataObj).sort((a, b) => b[1] - a[1]).slice(0, 5); 
    const maxVotes = Math.max(...items.map(i => i[1]), 1);

    return items.map(([name, votes]) => (
      <div className="mini-bar-row" key={name}>
        <div className="mini-bar-label">{name}</div>
        <div className="mini-bar-track">
          <div className={`mini-bar-fill ${colorClass}`} style={{ width: `${(votes / maxVotes) * 100}%` }}></div>
          <div className="mini-bar-value">{votes}</div>
        </div>
      </div>
    ));
  };

  return (
    <>
      <style>{styles}</style>
      <div className="admin-app">
        <div className="admin-container">
          <h1>מערכת ניהול פאנל בחירות <img src="https://flagcdn.com/il.svg" alt="Israel Flag" style={{ width: '45px', verticalAlign: 'middle', borderRadius: '2px', border: '1px solid #cbd5e1' }} /></h1>

          {!isCreated ? (
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>שם בית הספר / מוסד:</label>
                <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="לדוגמה: תיכון בליך" />
              </div>
              <div className="form-group">
                <label>נציגי הפאנל (מופרדים בפסיק):</label>
                <input type="text" value={repsInput} onChange={e => setRepsInput(e.target.value)} placeholder="לדוגמה: יריב לוין, יאיר לפיד, איתמר בן גביר" />
              </div>
              <button type="submit" className="btn" style={{ width: '100%' }}>צור פאנל חדש</button>
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
              
              <button className={`btn btn-phase ${phase === 'warmup' ? 'active' : ''}`} onClick={() => changePhase('warmup')}>🔥 הפעל שאלת חימום</button>
              
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button key={num} className={`btn btn-phase ${phase === `round${num}` ? 'active' : ''}`} onClick={() => changePhase(`round${num}`)}>
                  סבב {num}: {ROUND_TITLES[num]}
                </button>
              ))}

              <button className={`btn btn-phase btn-summary ${phase === 'summary' ? 'active' : ''}`} onClick={() => changePhase('summary')} style={{ marginTop: '30px' }}>
                📝 סיום פאנל - הפעל שאלון סיכום
              </button>

              {/* הדשבורד החסוי */}
              {phase === 'summary' && summaryResults && (
                <div className="private-dashboard">
                  <h3>🔒 דשבורד תוצאות חסוי (למנחה בלבד)</h3>
                  <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>הנתונים באזור זה אינם מוצגים על המקרן הראשי.</p>
                  
                  <div className="rating-grid">
                    <div className="rating-box">
                      <div>ציון הפאנל (באירוע הנוכחי)</div>
                      <div className="rating-number">{getAvg(summaryResults.q4.sum, summaryResults.q4.count)}</div>
                    </div>
                    <div className="rating-box">
                      <div>ציון המנחה (באירוע הנוכחי)</div>
                      <div className="rating-number">{getAvg(summaryResults.q5.sum, summaryResults.q5.count)}</div>
                    </div>
                  </div>

                  {globalStats && (
                    <div className="global-stats-container">
                      <div className="global-title">🌍 נתונים ארציים (ממוצע כלל בתי הספר)</div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <h4 style={{ color: '#059669', margin: '0 0 10px 0' }}>מפלגות מועדפות - ארצי</h4>
                          {renderMiniChart(globalStats.parties, 'green')}
                        </div>
                        <div>
                          <h4 style={{ color: '#059669', margin: '0 0 10px 0' }}>שינוי דעה - ארצי</h4>
                          {renderMiniChart(globalStats.opinionChange, 'green')}
                          
                          <div style={{ marginTop: '20px', padding: '15px', background: '#d1fae5', borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold', color: '#065f46' }}>ממוצע ציון פאנלים ארצי</div>
                            <div style={{ fontSize: '32px', fontWeight: '800', color: '#059669' }}>
                              {getAvg(globalStats.panelRating.sum, globalStats.panelRating.count)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* כפתור האיפוס */}
                  <button className="btn-reset" onClick={handleResetGlobalStats}>
                    🗑️ איפוס נתונים ארציים (למחיקת טסטים)
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
}