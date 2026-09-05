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

  .admin-app { min-height: 100vh; background: #f0f4f8; font-family: 'Rubik', sans-serif; direction: rtl; padding: 40px 20px; color: #333; position: relative; }
  
  .company-logo { position: absolute; top: 25px; left: 30px; width: 80px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.15)); z-index: 100; }
  .admin-container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: relative; z-index: 10; }
  h1 { text-align: center; color: #1756a9; font-size: 36px; margin-bottom: 30px; }
  
  .login-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
  .login-card { background: white; padding: 50px 40px; border-radius: 20px; box-shadow: 0 15px 40px rgba(0,0,0,0.1); width: 100%; max-width: 450px; text-align: center; position: relative; z-index: 10; }
  .login-card h2 { border: none; margin-bottom: 10px; color: #1756a9; font-size: 32px; padding: 0; }
  .login-card p { color: #64748b; margin-bottom: 30px; font-size: 18px; }

  .tabs { display: flex; margin-bottom: 30px; border-bottom: 2px solid #e1e8f0; }
  .tab { flex: 1; text-align: center; padding: 15px; cursor: pointer; font-size: 20px; font-weight: bold; color: #64748b; transition: 0.3s; }
  .tab.active { color: #1756a9; border-bottom: 4px solid #1756a9; }
  .tab:hover:not(.active) { color: #0ea5e9; }

  .form-group { margin-bottom: 25px; }
  label { display: block; font-weight: 600; margin-bottom: 10px; font-size: 18px; }
  input[type="text"], input[type="password"] { width: 100%; padding: 15px; border: 2px solid #e1e8f0; border-radius: 12px; font-size: 18px; box-sizing: border-box; font-family: 'Rubik', sans-serif; }
  input[type="text"]:focus, input[type="password"]:focus { outline: none; border-color: #0ea5e9; }

  .btn { background: #1756a9; color: white; border: none; padding: 15px 30px; border-radius: 12px; font-size: 20px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-family: 'Rubik', sans-serif; }
  .btn:hover { background: #0ea5e9; transform: translateY(-2px); }
  .btn-join { background: #10b981; }
  .btn-join:hover { background: #059669; }
  
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

  .local-stats-container { background: #ecfdf5; padding: 20px; border-radius: 15px; border: 1px solid #a7f3d0; margin-top: 20px; }
  .local-title { color: #059669; font-size: 22px; text-align: center; margin-bottom: 20px; font-weight: bold; }

  .mini-bar-row { margin-bottom: 12px; }
  .mini-bar-label { font-size: 16px; margin-bottom: 4px; font-weight: bold; color: #333; }
  .mini-bar-track { background: #e2e8f0; height: 25px; border-radius: 12px; position: relative; overflow: hidden; }
  .mini-bar-fill { height: 100%; background: #0ea5e9; transition: width 1s; }
  .mini-bar-fill.green { background: #10b981; }
  .mini-bar-value { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-weight: bold; color: white; font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }

  .btn-export { width: 100%; padding: 18px; background: #8b5cf6; color: white; border: none; border-radius: 12px; font-size: 22px; font-weight: bold; cursor: pointer; margin-top: 25px; transition: 0.2s; font-family: 'Rubik', sans-serif; box-shadow: 0 6px 15px rgba(139, 92, 246, 0.4); }
  .btn-export:hover { background: #7c3aed; transform: translateY(-2px); }
`;

export default function AdminView() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const [isCreated, setIsCreated] = useState(false);
  const [viewMode, setViewMode] = useState('create');
  
  const [eventCode, setEventCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [repsInput, setRepsInput] = useState('');
  
  const [participants, setParticipants] = useState(0);
  const [phase, setPhase] = useState('waiting'); 
  const [isVotingOpen, setIsVotingOpen] = useState(true); 
  const [summaryResults, setSummaryResults] = useState(null);

  useEffect(() => {
    socket.on('admin_joined_success', (code) => {
      setEventCode(code);
      setIsCreated(true);
    });

    socket.on('error_message', (msg) => {
      alert(msg);
    });

    const handleDataUpdate = (data) => {
      setParticipants(data.participants);
      setPhase(data.phase);
      setIsVotingOpen(data.isVotingOpen); 
      setSummaryResults(data.summaryResults);
      if (data.schoolName) setSchoolName(data.schoolName);
    };

    socket.on('live_results', handleDataUpdate);
    socket.on('event_state', handleDataUpdate);
    socket.on('phase_changed', handleDataUpdate);
    
    socket.on('participants_update', (count) => {
      setParticipants(count);
    });

    return () => {
      socket.off('admin_joined_success');
      socket.off('error_message');
      socket.off('live_results');
      socket.off('event_state');
      socket.off('phase_changed');
      socket.off('participants_update');
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === '272026' || passwordInput === '122026') {
      setIsAuthenticated(true);
    } else {
      alert('❌ שגיאה: הסיסמה שגויה! אין לך הרשאה להיכנס למערכת ניהול הפאנל.');
      setPasswordInput('');
    }
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!eventCode || !schoolName || !repsInput) return alert('נא למלא את כל השדות');
    
    const representatives = repsInput.split(',').map(r => r.trim()).filter(r => r !== '');
    if (representatives.length < 2) return alert('יש להזין לפחות 2 נציגים מופרדים בפסיק');

    socket.emit('create_event', { eventCode: eventCode.trim(), schoolName, representatives });
  };

  const handleJoinAdmin = (e) => {
    e.preventDefault();
    if (!joinCode) return alert('נא להזין קוד אירוע');
    socket.emit('join_admin', { eventCode: joinCode.trim() });
  };

  const changePhase = (newPhase) => {
    if (window.confirm('האם אתה בטוח שברצונך להעביר את כל התלמידים לשלב זה?')) {
      socket.emit('change_phase', { eventCode, phase: newPhase });
      setPhase(newPhase);
    }
  };

  const handleToggleVoting = () => {
    socket.emit('toggle_voting', { eventCode });
  };

  const getAvg = (sum, count) => count > 0 ? (sum / count).toFixed(1) : 0;

  // פונקציית הייצוא - עכשיו מושכת נתונים רק מהאירוע הנוכחי!
  const exportToCSV = () => {
    if (!summaryResults) return;

    let csvContent = "\uFEFF"; 
    
    csvContent += `דוח נתונים - פאנל בחירות (אירוע: ${schoolName || eventCode})\n\n`;
    
    csvContent += "1. מנצח הפאנל\nנציג,קולות\n";
    if (summaryResults.q1) {
      Object.entries(summaryResults.q1)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, votes]) => {
          csvContent += `"${name}",${votes}\n`;
        });
    }
    csvContent += "\n";

    csvContent += "2. מפלגות מועדפות\nמפלגה,קולות\n";
    if (summaryResults.q2) {
      Object.entries(summaryResults.q2)
        .sort((a, b) => b[1] - a[1])
        .forEach(([party, votes]) => {
          csvContent += `"${party}",${votes}\n`;
        });
    }
    csvContent += "\n";

    csvContent += "3. השפעת הפאנל (שינוי דעה)\nתשובה,קולות\n";
    if (summaryResults.q3) {
      Object.entries(summaryResults.q3)
        .sort((a, b) => b[1] - a[1])
        .forEach(([opinion, votes]) => {
          csvContent += `"${opinion}",${votes}\n`;
        });
    }
    csvContent += "\n";

    csvContent += "4. ציוני הפעילות\nקטגוריה,ציון ממוצע\n";
    const avgPanel = getAvg(summaryResults.q4?.sum || 0, summaryResults.q4?.count || 0);
    const avgHost = getAvg(summaryResults.q5?.sum || 0, summaryResults.q5?.count || 0);
    csvContent += `ציון הפאנל ממוצע,${avgPanel}\n`;
    csvContent += `ציון המנחה ממוצע,${avgHost}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Panel_Stats_${eventCode}_${new Date().toLocaleDateString('he-IL').replace(/\./g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMiniChart = (dataObj, colorClass = '') => {
    if(!dataObj || Object.keys(dataObj).length === 0) return <div style={{ opacity: 0.5 }}>אין נתונים עדיין</div>;
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

  if (!isAuthenticated) {
    return (
      <>
        <style>{styles}</style>
        <div className="admin-app">
          <img src="/image_a4f483.png" alt="אקטיביטיז הפקות" className="company-logo" />
          <div className="login-container">
            <div className="login-card">
              <h2>כניסת צוות 🔒</h2>
              <p>הזן סיסמת מנחה או מנהל להמשך</p>
              <form onSubmit={handleLogin}>
                <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="הזן סיסמה..." style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '24px' }} />
                <button type="submit" className="btn" style={{ width: '100%', marginTop: '20px' }}>היכנס למערכת</button>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="admin-app">
        <img src="/image_a4f483.png" alt="אקטיביטיז הפקות" className="company-logo" />
        <div className="admin-container">
          <h1>מערכת ניהול פאנל בחירות <img src="https://flagcdn.com/il.svg" alt="Israel Flag" style={{ width: '45px', verticalAlign: 'middle', borderRadius: '2px', border: '1px solid #cbd5e1' }} /></h1>

          {!isCreated ? (
            <div>
              <div className="tabs">
                <div className={`tab ${viewMode === 'create' ? 'active' : ''}`} onClick={() => setViewMode('create')}>✨ יצירת פאנל חדש</div>
                <div className={`tab ${viewMode === 'join' ? 'active' : ''}`} onClick={() => setViewMode('join')}>🔑 התחברות כמנהל</div>
              </div>

              {viewMode === 'create' ? (
                <form onSubmit={handleCreateEvent}>
                  <div className="form-group">
                    <label>קוד אירוע מותאם אישית (יופץ לתלמידים):</label>
                    <input type="text" value={eventCode} onChange={e => setEventCode(e.target.value)} placeholder="לדוגמה: 1234, GORDON2026..." />
                    <div className="help-text">* בחר קוד ייחודי קל לזכירה</div>
                  </div>
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
                <form onSubmit={handleJoinAdmin}>
                  <div className="form-group">
                    <label>הזן קוד של אירוע פעיל:</label>
                    <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="הכנס קוד אירוע" />
                  </div>
                  <button type="submit" className="btn btn-join" style={{ width: '100%' }}>התחבר כמנהל לאירוע</button>
                </form>
              )}
            </div>
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

              <button 
                onClick={handleToggleVoting} 
                className="btn" 
                style={{ width: '100%', marginBottom: '25px', background: isVotingOpen ? '#ef4444' : '#10b981' }}
              >
                {isVotingOpen ? '⏸️ חסום הצבעה לתלמידים (עצור כרגע)' : '▶️ פתח הצבעה מחדש'}
              </button>
              
              <button className={`btn btn-phase ${phase === 'warmup' ? 'active' : ''}`} onClick={() => changePhase('warmup')}>🔥 הפעל שאלת חימום</button>
              
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button key={num} className={`btn btn-phase ${phase === `round${num}` ? 'active' : ''}`} onClick={() => changePhase(`round${num}`)}>
                  סבב {num}: {ROUND_TITLES[num]}
                </button>
              ))}

              <button className={`btn btn-phase btn-summary ${phase === 'summary' ? 'active' : ''}`} onClick={() => changePhase('summary')} style={{ marginTop: '30px' }}>
                📝 סיום פאנל - הפעל שאלון סיכום
              </button>

              {/* הדשבורד מציג נתונים אך ורק מהאירוע הנוכחי! */}
              {phase === 'summary' && summaryResults && (
                <div className="private-dashboard">
                  <h3>🔒 דשבורד תוצאות חסוי (למנחה בלבד)</h3>
                  
                  <div className="rating-grid">
                    <div className="rating-box">
                      <div>ציון הפאנל (באירוע הנוכחי)</div>
                      <div className="rating-number">{getAvg(summaryResults.q4?.sum, summaryResults.q4?.count)}</div>
                    </div>
                    <div className="rating-box">
                      <div>ציון המנחה (באירוע הנוכחי)</div>
                      <div className="rating-number">{getAvg(summaryResults.q5?.sum, summaryResults.q5?.count)}</div>
                    </div>
                  </div>

                  <div className="local-stats-container">
                    <div className="local-title">📊 נתוני סיכום (אירוע נוכחי בלבד)</div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <h4 style={{ color: '#059669', margin: '0 0 10px 0' }}>מפלגות מועדפות</h4>
                        {renderMiniChart(summaryResults.q2, 'green')}
                      </div>
                      <div>
                        <h4 style={{ color: '#059669', margin: '0 0 10px 0' }}>שינוי דעה</h4>
                        {renderMiniChart(summaryResults.q3, 'green')}
                      </div>
                    </div>
                  </div>

                  {!isVotingOpen && (
                    <button className="btn-export" onClick={exportToCSV}>
                      📊 ייצוא נתוני האירוע לאקסל (CSV)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}