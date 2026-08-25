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

  .display-app {
    min-height: 100vh;
    background: #0a192f;
    color: white;
    font-family: 'Rubik', sans-serif;
    direction: rtl;
    padding: 40px;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* עיצוב הלוגו בפינה */
  .company-logo {
    position: absolute;
    top: 30px;
    left: 40px;
    width: 120px;
    filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6));
    z-index: 100;
  }

  .join-container { display: flex; justify-content: center; align-items: center; flex-grow: 1; margin-top: 100px; }
  .glass-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 50px; width: 100%; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
  
  .custom-input { width: 100%; padding: 18px; border-radius: 12px; border: none; font-size: 28px; text-align: center; margin-bottom: 25px; font-family: 'Rubik', sans-serif; font-weight: bold; box-sizing: border-box; color: #0a192f; letter-spacing: 4px; }
  .action-btn { width: 100%; padding: 18px; border-radius: 12px; border: none; background: #38bdf8; color: #0a192f; font-size: 26px; font-weight: bold; cursor: pointer; font-family: 'Rubik', sans-serif; transition: all 0.2s; }
  .action-btn:hover { background: #0ea5e9; color: white; transform: translateY(-2px); }

  .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
  h1 { font-size: 60px; margin: 0 0 10px 0; color: #38bdf8; text-shadow: 0 0 20px rgba(56, 189, 248, 0.3); }
  h2 { font-size: 36px; margin: 0; color: #94a3b8; }
  .phase-title { font-size: 48px; color: #f8fafc; margin-bottom: 30px; text-align: center; font-weight: 800; }

  .bar-row { display: flex; align-items: center; margin-bottom: 25px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 15px; }
  .bar-label { width: 250px; font-size: 28px; font-weight: bold; padding-left: 20px; }
  .bar-track { flex-grow: 1; background: rgba(255,255,255,0.1); height: 50px; border-radius: 25px; position: relative; overflow: hidden; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #0284c7, #38bdf8); transition: width 1s; border-radius: 25px; }
  .bar-value { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); font-size: 24px; font-weight: bold; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }

  .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; }
  .summary-box { background: rgba(255,255,255,0.05); padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); }
  .summary-box h3 { font-size: 26px; color: #38bdf8; margin: 0 0 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; text-align: center; }
  
  .mini-bar-row { margin-bottom: 15px; }
  .mini-bar-label { font-size: 20px; margin-bottom: 5px; }
  .mini-bar-track { background: rgba(255,255,255,0.1); height: 30px; border-radius: 15px; position: relative; overflow: hidden; }
  .mini-bar-fill { height: 100%; background: #38bdf8; border-radius: 15px; transition: width 1s; }
  .mini-bar-value { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-weight: bold; }
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

    return items.map(([name, votes]) => (
      <div className="bar-row" key={name}>
        <div className="bar-label">{name}</div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${(votes / maxVotes) * 100}%` }}></div>
          <div className="bar-value">{votes} קולות</div>
        </div>
      </div>
    ));
  };

  const renderMiniChart = (dataObj) => {
    if(!dataObj || Object.keys(dataObj).length === 0) return <div style={{ opacity: 0.5, textAlign: 'center' }}>אין נתונים עדיין</div>;
    const items = Object.entries(dataObj).sort((a, b) => b[1] - a[1]).slice(0, 5); 
    const maxVotes = Math.max(...items.map(i => i[1]), 1);

    return items.map(([name, votes]) => (
      <div className="mini-bar-row" key={name}>
        <div className="mini-bar-label">{name}</div>
        <div className="mini-bar-track">
          <div className="mini-bar-fill" style={{ width: `${(votes / maxVotes) * 100}%` }}></div>
          <div className="mini-bar-value">{votes}</div>
        </div>
      </div>
    ));
  };

  return (
    <>
      <style>{styles}</style>
      <div className="display-app">
        <img src="/image_a4f483.png" alt="אקטיביטיז הפקות" className="company-logo" />
        <div className="header">
          <h1>פאנל בחירות <img src="https://flagcdn.com/il.svg" alt="Israel Flag" style={{ width: '60px', verticalAlign: 'middle', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' }} /></h1>
          <h2>{schoolName}</h2>
        </div>

        {phase === 'waiting' && <h2 style={{ textAlign: 'center', fontSize: '50px', marginTop: '100px' }}>הפאנל יתחיל בעוד מספר רגעים...</h2>}
        
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
              <br/><span style={{ fontSize: '30px', color: '#94a3b8' }}>מי מהנציגים ניצח בסבב הזה?</span>
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