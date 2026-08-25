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

const PARTIES_LIST = [
  'הליכוד', 'ישר', 'ביחד', 'הדמוקרטים', 'עוצמה יהודית',
  'הציונות הדתית', 'יהדות התורה', 'שס', 'רעמ',
  'הרשימה המשותפת', 'ישראל ביתנו', 'בית ציוני', 'כחול לבן',
  'האחדות', 'זהות', 'ישראל תחילה', 'המפלגה של וינטר', 'רשימה אחרת'
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;800&display=swap');

  @keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes popIn {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .student-app {
    min-height: 100vh;
    background: linear-gradient(-45deg, #0a2342, #1756a9, #3b82f6, #0ea5e9);
    background-size: 400% 400%;
    animation: gradientBG 12s ease infinite;
    font-family: 'Rubik', sans-serif;
    direction: rtl;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 15px;
    box-sizing: border-box;
    color: white;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 35px;
    padding: 40px 30px;
    width: 92%;
    max-width: 450px;
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.35);
    animation: popIn 0.6s ease-out forwards;
    box-sizing: border-box;
    margin-bottom: 20px;
  }

  .main-title {
    font-size: 40px;
    font-weight: 800;
    margin: 0 0 8px 0;
    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
  }

  .custom-input {
    width: 100%;
    padding: 22px;
    border-radius: 20px;
    border: 2px solid transparent;
    background: rgba(255, 255, 255, 0.95);
    font-size: 36px;
    text-align: center;
    letter-spacing: 8px;
    font-weight: 800;
    color: #1756a9;
    margin-bottom: 25px;
    box-sizing: border-box;
    font-family: 'Rubik', sans-serif;
  }

  .custom-select {
    width: 100%;
    padding: 18px;
    border-radius: 15px;
    border: none;
    background: rgba(255, 255, 255, 0.95);
    font-size: 22px;
    color: #1756a9;
    margin-bottom: 20px;
    font-family: 'Rubik', sans-serif;
    font-weight: 600;
    direction: rtl;
    box-sizing: border-box;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }

  .action-btn {
    width: 100%;
    background: linear-gradient(135deg, #0ea5e9, #2563eb);
    color: white;
    border: none;
    padding: 22px;
    border-radius: 20px;
    font-size: 28px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 8px 25px rgba(37, 99, 235, 0.5);
    font-family: 'Rubik', sans-serif;
  }
  
  .action-btn:disabled {
    background: gray;
    box-shadow: none;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .party-btn {
    width: 100%;
    background: white;
    color: #1756a9;
    border: none;
    padding: 24px;
    border-radius: 20px;
    font-size: 26px;
    font-weight: 800;
    cursor: pointer;
    margin-bottom: 18px;
    font-family: 'Rubik', sans-serif;
    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  }

  .summary-label {
    display: block;
    font-size: 22px;
    font-weight: bold;
    margin-bottom: 10px;
    text-align: right;
  }
`;

export default function StudentView() {
  const [eventCode, setEventCode] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [representatives, setRepresentatives] = useState([]);
  const [phase, setPhase] = useState('waiting'); // waiting, warmup, round1..6, summary
  
  // Tracking if user voted in the *current* phase
  const [votedPhases, setVotedPhases] = useState({});
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9));

  // Summary form answers
  const [summaryAnswers, setSummaryAnswers] = useState({
    q1: '', q2: '', q3: '', q4: '', q5: ''
  });

  useEffect(() => {
    const handleStateUpdate = (data) => {
      setSchoolName(data.schoolName);
      setRepresentatives(data.representatives || []);
      setPhase(data.phase);
      setIsJoined(true);
    };

    socket.on('event_state', handleStateUpdate);
    socket.on('phase_changed', handleStateUpdate);

    socket.on('vote_confirmed', () => {
      setVotedPhases(prev => ({ ...prev, [phase]: true }));
    });

    socket.on('error_message', (msg) => alert(msg));

    return () => {
      socket.off('event_state');
      socket.off('phase_changed');
      socket.off('vote_confirmed');
      socket.off('error_message');
    };
  }, [phase]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!eventCode.trim()) return;
    socket.emit('join_event', { eventCode: eventCode.trim(), role: 'student' });
  };

  const handleWarmupVote = (rep) => {
    socket.emit('submit_warmup', { eventCode, userId, representative: rep });
  };

  const handleRoundVote = (rep) => {
    const roundId = phase.replace('round', '');
    socket.emit('submit_round_vote', { eventCode, userId, roundId, representative: rep });
  };

  const handleSummarySubmit = () => {
    socket.emit('submit_summary', { eventCode, userId, answers: summaryAnswers });
  };

  const isSummaryComplete = Object.values(summaryAnswers).every(answer => answer !== '');
  const hasVotedCurrent = votedPhases[phase];

  // תצוגת המתנה או אישור הצבעה
  const renderStatusCard = (icon, title, subtitle) => (
    <div className="glass-card" style={{ textAlign: 'center', padding: '60px 25px' }}>
      <div style={{ fontSize: '80px', marginBottom: '20px' }}>{icon}</div>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '30px', fontWeight: '800' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '20px', opacity: 0.9 }}>{subtitle}</p>
    </div>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="student-app">
        
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ fontSize: '70px', marginBottom: '10px' }}>🇮🇱</div>
          <h2 className="main-title">פאנל בחירות</h2>
          {schoolName && <h4 style={{ fontSize: '24px', margin: 0 }}>{schoolName}</h4>}
        </div>

        {!isJoined ? (
          <div className="glass-card">
            <h3 style={{ textAlign: 'center', margin: '0 0 25px 0', fontSize: '28px', fontWeight: '800' }}>הצטרפו להצבעה</h3>
            <form onSubmit={handleJoin}>
              <input
                type="text"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                placeholder="קוד כניסה"
                className="custom-input"
                autoComplete="off"
              />
              <button type="submit" className="action-btn">היכנס לפאנל 🚀</button>
            </form>
          </div>
        ) : (
          <div style={{ width: '92%', maxWidth: '450px' }}>
            
            {hasVotedCurrent ? (
              renderStatusCard('✅', 'הצבעתך נקלטה!', 'המתן להמשך הפאנל...')
            ) : (
              <>
                {phase === 'waiting' && renderStatusCard('⏳', 'ממתינים שנתחיל', 'המסך יתעדכן אוטומטית כשהמנחה יפתח את הפאנל.')}

                {phase === 'warmup' && (
                  <div className="glass-card">
                    <h3 style={{ textAlign: 'center', fontSize: '30px', marginBottom: '25px' }}>שאלת חימום</h3>
                    <p style={{ textAlign: 'center', fontSize: '24px', marginBottom: '20px' }}>את מי הכי מעניין אותך לשמוע?</p>
                    {representatives.map(rep => (
                      <button key={rep} onClick={() => handleWarmupVote(rep)} className="party-btn">{rep}</button>
                    ))}
                  </div>
                )}

                {phase.startsWith('round') && (
                  <div className="glass-card">
                    <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.25)', paddingBottom: '18px', marginBottom: '25px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.25)', padding: '8px 20px', borderRadius: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                        סבב {phase.replace('round', '')}
                      </span>
                      <h3 style={{ margin: '15px 0 5px 0', fontSize: '32px' }}>{ROUND_TITLES[phase.replace('round', '')]}</h3>
                    </div>
                    <p style={{ textAlign: 'center', fontSize: '24px', marginBottom: '20px' }}>מי מהנציגים ניצח לדעתך בסבב הזה?</p>
                    {representatives.map(rep => (
                      <button key={rep} onClick={() => handleRoundVote(rep)} className="party-btn">{rep}</button>
                    ))}
                  </div>
                )}

                {phase === 'summary' && (
                  <div className="glass-card" style={{ padding: '30px 20px' }}>
                    <h3 style={{ textAlign: 'center', fontSize: '32px', marginBottom: '25px', borderBottom: '2px solid white', paddingBottom: '10px' }}>סיכום הפאנל</h3>
                    
                    <label className="summary-label">1. מי ניצח מבין המשתתפים?</label>
                    <select className="custom-select" value={summaryAnswers.q1} onChange={e => setSummaryAnswers({...summaryAnswers, q1: e.target.value})}>
                      <option value="">בחר/י נציג...</option>
                      {representatives.map(rep => <option key={rep} value={rep}>{rep}</option>)}
                    </select>

                    <label className="summary-label">2. למי היית מצביע/ה?</label>
                    <select className="custom-select" value={summaryAnswers.q2} onChange={e => setSummaryAnswers({...summaryAnswers, q2: e.target.value})}>
                      <option value="">בחר/י מפלגה...</option>
                      {PARTIES_LIST.map(party => <option key={party} value={party}>{party}</option>)}
                    </select>

                    <label className="summary-label">3. האם הפאנל:</label>
                    <select className="custom-select" value={summaryAnswers.q3} onChange={e => setSummaryAnswers({...summaryAnswers, q3: e.target.value})}>
                      <option value="">בחר/י תשובה...</option>
                      <option value="חיזק את דעתי">חיזק את דעתי</option>
                      <option value="החליש (ערער את דעתי)">החליש (ערער את דעתי)</option>
                      <option value="לא שינה את דעתי">לא שינה את דעתי</option>
                    </select>

                    <label className="summary-label">4. איך היה הפאנל? (1-10)</label>
                    <select className="custom-select" value={summaryAnswers.q4} onChange={e => setSummaryAnswers({...summaryAnswers, q4: e.target.value})}>
                      <option value="">דירוג פאנל...</option>
                      {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                    </select>

                    <label className="summary-label">5. מה דעתך על המנחה? (1-10)</label>
                    <select className="custom-select" value={summaryAnswers.q5} onChange={e => setSummaryAnswers({...summaryAnswers, q5: e.target.value})}>
                      <option value="">דירוג מנחה...</option>
                      {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                    </select>

                    <button 
                      onClick={handleSummarySubmit} 
                      className="action-btn" 
                      disabled={!isSummaryComplete}
                      style={{ marginTop: '15px' }}
                    >
                      שלח שאלון
                    </button>
                    {!isSummaryComplete && <p style={{ textAlign: 'center', fontSize: '16px', marginTop: '10px' }}>יש לענות על כל השאלות כדי לשלוח.</p>}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}