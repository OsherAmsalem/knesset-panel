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
  }

  .header {
    text-align: center;
    margin-bottom: 40px;
    border-bottom: 2px solid rgba(255,255,255,0.1);
    padding-bottom: 20px;
  }

  h1 { font-size: 60px; margin: 0 0 10px 0; color: #38bdf8; text-shadow: 0 0 20px rgba(56, 189, 248, 0.3); }
  h2 { font-size: 36px; margin: 0; color: #94a3b8; }
  .phase-title { font-size: 48px; color: #f8fafc; margin-bottom: 30px; text-align: center; font-weight: 800; }

  .bar-row {
    display: flex;
    align-items: center;
    margin-bottom: 25px;
    background: rgba(255,255,255,0.05);
    padding: 15px;
    border-radius: 15px;
  }

  .bar-label {
    width: 250px;
    font-size: 28px;
    font-weight: bold;
    padding-left: 20px;
  }

  .bar-track {
    flex-grow: 1;
    background: rgba(255,255,255,0.1);
    height: 50px;
    border-radius: 25px;
    overflow: hidden;
    position: relative;
  }

  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #0284c7, #38bdf8);
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 25px;
    box-shadow: 0 0 15px rgba(56,189,248,0.5);
  }

  .bar-value {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 24px;
    font-weight: bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }

  .summary-box {
    background: rgba(255,255,255,0.05);
    padding: 30px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .summary-box h3 { font-size: 28px; color: #38bdf8; margin: 0 0 20px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }

  .mini-bar-row { margin-bottom: 15px; }
  .mini-bar-label { font-size: 20px; margin-bottom: 5px; }
  .mini-bar-track { background: rgba(255,255,255,0.1); height: 30px; border-radius: 15px; position: relative; }
  .mini-bar-fill { height: 100%; background: #38bdf8; border-radius: 15px; transition: width 1s; }
  .mini-bar-value { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-weight: bold; }

  .rating-box {
    text-align: center;
    padding: 20px;
    background: rgba(56,189,248,0.1);
    border-radius: 15px;
    margin-top: 20px;
  }
  .rating-number { font-size: 60px; font-weight: 800; color: #38bdf8; }

  .global-stats {
    margin-top: 40px;
    padding: 30px;
    background: linear-gradient(45deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.2));
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 20px;
  }
  .global-title { color: #34d399; font-size: 32px; margin-bottom: 20px; text-align: center; font-weight: 800; }
`;

export default function DisplayView() {
  const [eventData, setEventData] = useState(null);

  useEffect(() => {
    // בקשה להצטרף כמסך מקרן (נניח שקוד האירוע מוזן כאן או נלקח מה-URL, לשם פשטות אפשר להאזין גלובלית אם זה רק מקרן אחד, או להוסיף מסך כניסה קטן. פה נניח שאנחנו מאזינים לכל שינוי)
    // הערה: כדאי להוסיף מסך קטן שמבקש את קוד האירוע כמו בתלמיד, או לקחת אותו מה-URL. 
    // לצורך הדוגמה הקודמת, אם היה לך פה קוד קבוע, תוסיף אותו.
    
    const code = prompt("הכנס את קוד האירוע להקרנה:");
    if(code) {
      socket.emit('join_event', { eventCode: code, role: 'display' });
    }

    socket.on('event_state', setEventData);
    socket.on('phase_changed', setEventData);
    socket.on('live_results', setEventData);

    return () => {
      socket.off('event_state');
      socket.off('phase_changed');
      socket.off('live_results');
    };
  }, []);

  if (!eventData) return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px', fontSize: '30px' }}>ממתין לחיבור... (רענן והכנס קוד אירוע)</div>;

  const { schoolName, phase, warmupResults, rounds, summaryResults, globalStats } = eventData;

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
    if(!dataObj || Object.keys(dataObj).length === 0) return <div style={{ opacity: 0.5 }}>אין נתונים עדיין</div>;
    const items = Object.entries(dataObj).sort((a, b) => b[1] - a[1]).slice(0, 5); // מציג טופ 5
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

  const getAvg = (sum, count) => count > 0 ? (sum / count).toFixed(1) : 0;

  return (
    <>
      <style>{styles}</style>
      <div className="display-app">
        <div className="header">
          <h1>פאנל בחירות 🇮🇱</h1>
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
            <div className="phase-title">תוצאות סיכום הפאנל ב{schoolName}</div>
            
            <div className="summary-grid">
              <div className="summary-box">
                <h3>המנצח של הפאנל (שאלה 1)</h3>
                {renderMiniChart(summaryResults.q1)}
              </div>
              <div className="summary-box">
                <h3>מפלגות מועדפות (שאלה 2)</h3>
                {renderMiniChart(summaryResults.q2)}
              </div>
              <div className="summary-box">
                <h3>שינוי דעה (שאלה 3)</h3>
                {renderMiniChart(summaryResults.q3)}
              </div>
              <div className="summary-box">
                <h3>ציוני הפאנל (שאלות 4-5)</h3>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div className="rating-box" style={{ flex: 1 }}>
                    <div>ציון הפאנל</div>
                    <div className="rating-number">{getAvg(summaryResults.q4.sum, summaryResults.q4.count)}</div>
                  </div>
                  <div className="rating-box" style={{ flex: 1 }}>
                    <div>ציון המנחה</div>
                    <div className="rating-number">{getAvg(summaryResults.q5.sum, summaryResults.q5.count)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* הקופה הראשית - ממוצע ארצי */}
            {globalStats && (
              <div className="global-stats">
                <div className="global-title">🌍 הנתונים הארציים (מכל בתי הספר)</div>
                <div className="summary-grid">
                  <div>
                    <h3 style={{ color: 'white', marginBottom: '15px' }}>מפלגות - מגמה ארצית</h3>
                    {renderMiniChart(globalStats.parties)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ color: 'white', marginBottom: '15px' }}>שינוי דעה ארצי</h3>
                        {renderMiniChart(globalStats.opinionChange)}
                      </div>
                      <div className="rating-box" style={{ flex: 1, background: 'rgba(16,185,129,0.2)' }}>
                        <div style={{ color: 'white' }}>ממוצע דירוג הפאנלים הארצי</div>
                        <div className="rating-number" style={{ color: '#34d399' }}>
                          {getAvg(globalStats.panelRating.sum, globalStats.panelRating.count)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}