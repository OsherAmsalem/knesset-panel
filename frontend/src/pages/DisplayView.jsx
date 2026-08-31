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

  @keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
    100% { transform: translateY(0px); }
  }

  @keyframes pulseSoft {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
  }

  .display-app {
    min-height: 100vh;
    background: linear-gradient(-45deg, #0a2342, #1756a9, #3b82f6, #0ea5e9);
    background-size: 400% 400%;
    animation: gradientBG 12s ease infinite;
    color: white;
    font-family: 'Rubik', sans-serif;
    direction: rtl;
    padding: 40px;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* עיצוב הלוגו בפינה השמאלית */
  .company-logo {
    position: absolute;
    top: 30px;
    left: 40px;
    width: 120px;
    filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6));
    z-index: 100;
  }

  /* תג קוד התחברות בפינה הימנית (אדום זכוכית) */
  .event-code-badge {
    position: absolute;
    top: 30px;
    right: 40px;
    background: rgba(220, 38, 38, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 120, 120, 0.5);
    padding: 12px 25px;
    border-radius: 20px;
    font-size: 34px;
    font-weight: 800;
    color: white;
    box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
    z-index: 100;
    text-align: center;
    letter-spacing: 3px;
  }
  .event-code-badge span {
    display: block;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: normal;
    margin-bottom: 2px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }

  .join-container { display: flex; justify-content: center; align-items: center; flex-grow: 1; margin-top: 100px; }
  .glass-card { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; padding: 50px; width: 100%; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
  
  .custom-input { width: 100%; padding: 18px; border-radius: 12px; border: none; font-size: 28px; text-align: center; margin-bottom: 25px; font-family: 'Rubik', sans-serif; font-weight: bold; box-sizing: border-box; color: #0a192f; letter-spacing: 4px; }
  .action-btn { width: 100%; padding: 18px; border-radius: 12px; border: none; background: #38bdf8; color: #0a192f; font-size: 26px; font-weight: bold; cursor: pointer; font-family: 'Rubik', sans-serif; transition: all 0.2s; }
  .action-btn:hover { background: #0ea5e9; color: white; transform: translateY(-2px); }

  .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid rgba(255,255,255,0.2); padding-bottom: 20px; }
  h1 { font-size: 60px; margin: 0 0 10px 0; color: #ffffff; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
  h2 { font-size: 36px; margin: 0; color: #e2e8f0; text-shadow: 0 1px 5px rgba(0,0,0,0.2); }
  .phase-title { font-size: 48px; color: #ffffff; margin-bottom: 30px; text-align: center; font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }

  /* עיצוב מסך ברוכים הבאים */
  .welcome-container { display: flex; justify-content: center; align-items: center; flex-grow: 1; margin-top: 50px; }
  .welcome-card { background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 30px; padding: 60px; text-align: center; max-width: 800px; width: 90%; box-shadow: 0 20px 50px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.1); animation: float 6s ease-in-out infinite; }
  .welcome-icon { font-size: 100px; margin-bottom: 20px; animation: pulseSoft 3s infinite; }
  .welcome-title { font-size: 65px; font-weight: 800; margin: 0 0 15px 0; background: linear-gradient(to right, #ffffff, #bae6fd); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 4px 15px rgba(0,0,0,0.2); }
  .welcome-subtitle { font-size: 32px; color: #e2e8f0; margin: 0; font-weight: 600; text-shadow: 0 2px 5px rgba(0,0,0,0.3); }

  .bar-row { display: flex; align-items: center; margin-bottom: 25px; background: rgba(255,255,255,0.1); backdrop-filter: blur(5px); padding: 15px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
  .bar-label { width: 250px; font-size: 28px; font-weight: bold; padding-left: 20px; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
  .bar-track { flex-grow: 1; background: rgba(255,255,255,0.15); height: 50px; border-radius: 25px; position: relative; overflow: hidden; box-shadow: inset 0 2px 5px rgba(0,0,0,0.2); }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #38bdf8, #bae6fd); transition: width 1s; border-radius: 25px; box-shadow: 0 0 15px rgba(56,189,248,0.6); }
  .bar-value { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); font-size: 24px; font-weight: bold; color: #0f172a; text-shadow: none; }
  .bar-percentage { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); font-size: 24px; font-weight: bold; color: #0f172a; text-shadow: none; }

  .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; }
  .summary-box { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
  .summary-box h3 { font-size: 26px; color: #ffffff; margin: 0 0 20px 0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px; text-align: center; text-shadow: 0 1px 4px rgba(0,0,0,0.3); }
  
  .mini-bar-row { margin-bottom: 15px; }
  .mini-bar-label { font-size: 20px; margin-bottom: 5px; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
  .mini-bar-track { background: rgba(255,255,255,0.15); height: 30px; border-radius: 15px; position: relative; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); }
  .mini-bar-fill { height: 100%; background: #38bdf8; border-radius: 15px; transition: width 1s; }
  .mini-bar-value { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-weight: bold; color: #0f172a; }
  .mini-bar-percentage { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-weight: bold; color: #0f172a; }
`;

export default function DisplayView() {
  const [eventData, setEventData] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    socket.on('event_state', (data) => {
      setEventData(data);
      setIsJoined(true);
    });
    socket.on('phase_changed', setEventData);
    socket.on('live_results', setEventData);
    socket.on('error_message', (msg) => alert(msg));

    return () => {
      socket.off('event_state');
      socket.off('phase_changed');
      socket.off('live_results');
      socket.off('error_message');
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      socket.emit('join_event', { eventCode: inputCode.trim(), role: 'display' });
    }
  };

  if (!isJoined || !eventData) {
    return (
      <>
        <style>{styles}</style>
        <div className="display-app">
          <img src="/image_a4f483.png" alt="אקטיביטיז הפקות" className="company-logo" />
          <div className="header">
            <h1>פאנל בחירות <img src="https://flagcdn.com/il.svg" alt="Israel Flag" style={{ width: '60px', verticalAlign: 'middle', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' }} /></h1>
            <h2>מסך מקרן ראשי</h2>
          </div>
          <div className="join-container">
            <div className="glass-card">
              <h3 style={{ fontSize: '32px', margin: '0 0 30px 0', color: 'white' }}>התחברות לאירוע</h3>
              <form onSubmit={handleJoin}>
                <input type="text" className="custom-input" placeholder="הזן קוד אירוע" value={inputCode} onChange={e => setInputCode(e.target.value)} autoComplete="off" />
                <button type="submit" className="action-btn">התחבר להקרנה</button>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  const { schoolName, phase, warmupResults, rounds, summaryResults } = eventData;

  const renderBigChart = (dataObj) => {
    if(!dataObj) return null;
    const items = Object.entries(dataObj).sort((a, b) => b[1] - a[1]);
    const maxVotes = Math.max(...items.map(i => i[1]), 1);
    
    const totalVotes = items.reduce((sum, item) => sum + item[1], 0);

    return items.map(([name, votes]) => {
      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
      return (
        <div className="bar-row" key={name}>
          <div className="bar-label">{name}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(votes / maxVotes) * 100}%` }}></div>
            <div className="bar-percentage">{percentage}%</div>
            <div className="bar-value">{votes} קולות</div>
          </div>
        </div>
      );
    });
  };

  const renderMiniChart = (dataObj) => {
    if(!dataObj || Object.keys(dataObj).length === 0) return <div style={{ opacity: 0.5, textAlign: 'center' }}>אין נתונים עדיין</div>;
    
    const totalVotes = Object.values(dataObj).reduce((sum, val) => sum + val, 0);
    
    const items = Object.entries(dataObj).sort((a, b) => b[1] - a[1]).slice(0, 5); 
    const maxVotes = Math.max(...items.map(i => i[1]), 1);

    return items.map(([name, votes]) => {
      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
      return (
        <div className="mini-bar-row" key={name}>
          <div className="mini-bar-label">{name}</div>
          <div className="mini-bar-track">
            <div className="mini-bar-fill" style={{ width: `${(votes / maxVotes) * 100}%` }}></div>
            <div className="mini-bar-percentage">{percentage}%</div>
            <div className="mini-bar-value">{votes}</div>
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="display-app">
        <img src="/image_a4f483.png" alt="אקטיביטיז הפקות" className="company-logo" />
        
        {/* תגית קוד האירוע - בולטת באדום זכוכית בפינה הימנית */}
        <div className="event-code-badge">
          <span>קוד התחברות:</span>
          {inputCode}
        </div>

        <div className="header">
          <h1>פאנל בחירות <img src="https://flagcdn.com/il.svg" alt="Israel Flag" style={{ width: '60px', verticalAlign: 'middle', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' }} /></h1>
          <h2>{schoolName}</h2>
        </div>

        {/* מסך ברוכים הבאים המחודש */}
        {phase === 'waiting' && (
          <div className="welcome-container">
            <div className="welcome-card">
              <div className="welcome-icon">✨</div>
              <h2 className="welcome-title">ברוכים הבאים לפאנל!</h2>
              <p className="welcome-subtitle">התחברו באמצעות הקוד בפינה, מתחילים בעוד רגע...</p>
            </div>
          </div>
        )}
        
        {phase === 'warmup' && (
          <div>
            <div className="phase-title">שאלת חימום: את מי הכי מעניין אותך לשמוע?</div>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              {renderBigChart(warmupResults)}
            </div>
          </div>
        )}

        {phase.startsWith('round') && (
          <div>
            <div className="phase-title">
              סבב {phase.replace('round', '')}: {ROUND_TITLES[phase.replace('round', '')]}
              <br/><span style={{ fontSize: '30px', color: '#e2e8f0' }}>מי מהנציגים ניצח בסבב הזה?</span>
            </div>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              {renderBigChart(rounds[phase.replace('round', '')]?.results)}
            </div>
          </div>
        )}

        {phase === 'summary' && (
          <div>
            <div className="phase-title">תוצאות הפאנל ב{schoolName}</div>
            <div className="summary-grid">
              <div className="summary-box">
                <h3>המנצח של הפאנל</h3>
                {renderMiniChart(summaryResults.q1)}
              </div>
              <div className="summary-box">
                <h3>מפלגות מועדפות</h3>
                {renderMiniChart(summaryResults.q2)}
              </div>
              <div className="summary-box">
                <h3>השפעת הפאנל</h3>
                {renderMiniChart(summaryResults.q3)}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}