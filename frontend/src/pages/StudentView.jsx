import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://knesset-backend.onrender.com');

// כאן אנחנו מזריקים את העיצוב המיוחד והאנימציות למסך הזה בלבד
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

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
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
    justify-content: center; /* הוספנו את זה כדי למרכז לאורך */
    padding: 20px 15px;
    box-sizing: border-box; /* הוספנו את זה כדי שהפאדינג לא יחרוג מהמסך */
    color: white;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 24px;
    padding: 30px 25px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    box-sizing: border-box;
  }

  .title-icon {
    font-size: 50px;
    animation: float 3s ease-in-out infinite;
    margin-bottom: 10px;
    display: inline-block;
  }

  .main-title {
    font-size: 28px;
    font-weight: 800;
    margin: 0 0 5px 0;
    text-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }

  .sub-title {
    font-size: 18px;
    color: rgba(255,255,255,0.8);
    margin: 0 0 20px 0;
  }

  .custom-input {
    width: 100%;
    padding: 16px;
    border-radius: 16px;
    border: 2px solid transparent;
    background: rgba(255, 255, 255, 0.9);
    font-size: 28px;
    text-align: center;
    letter-spacing: 4px;
    font-weight: 800;
    color: #1756a9;
    margin-bottom: 20px;
    box-sizing: border-box;
    transition: all 0.3s ease;
    font-family: 'Rubik', sans-serif;
  }
  .custom-input:focus {
    outline: none;
    border: 2px solid #0ea5e9;
    background: #fff;
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.4);
  }

  .action-btn {
    width: 100%;
    background: linear-gradient(135deg, #0ea5e9, #3b82f6);
    color: white;
    border: none;
    padding: 16px;
    border-radius: 16px;
    font-size: 22px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    font-family: 'Rubik', sans-serif;
  }
  .action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.6);
  }
  .action-btn:active {
    transform: translateY(2px) scale(0.97);
  }

  .party-btn {
    width: 100%;
    background: white;
    color: #1756a9;
    border: none;
    padding: 18px;
    border-radius: 16px;
    font-size: 20px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    margin-bottom: 12px;
    font-family: 'Rubik', sans-serif;
    position: relative;
    overflow: hidden;
  }
  .party-btn:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    color: #0ea5e9;
  }
  .party-btn:active {
    transform: translateY(1px) scale(0.98);
  }

  .pulse-text {
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(0.95); }
  }
`;

export default function StudentView() {
  const [eventCode, setEventCode] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [parties, setParties] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [isRoundOpen, setIsRoundOpen] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    socket.on('event_state', (data) => {
      setSchoolName(data.schoolName);
      setParties(data.parties);
      setCurrentRound(data.currentRound);
      setIsRoundOpen(data.isRoundOpen);
      setIsJoined(true);
    });

    socket.on('round_status', (data) => {
      setCurrentRound(data.round);
      setIsRoundOpen(data.isOpen);
      if (data.parties) setParties(data.parties);
      if (data.isOpen) setHasVoted(false);
    });

    socket.on('vote_confirmed', () => {
      setHasVoted(true);
    });

    socket.on('error_message', (msg) => alert(msg));

    return () => {
      socket.off('event_state');
      socket.off('round_status');
      socket.off('vote_confirmed');
      socket.off('error_message');
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!eventCode.trim()) return;
    socket.emit('join_event', { eventCode: eventCode.trim(), role: 'student' });
  };

  const handleVote = (party) => {
    if (hasVoted || !isRoundOpen) return;
    socket.emit('submit_vote', { eventCode, userId, party });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="student-app">
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="title-icon">🇮🇱</div>
          <h2 className="main-title">פאנל בחירות</h2>
          {schoolName && <h4 className="sub-title">{schoolName}</h4>}
        </div>

        {!isJoined ? (
          <div className="glass-card">
            <h3 style={{ textAlign: 'center', margin: '0 0 25px 0', fontSize: '22px' }}>הצטרפו להצבעה</h3>
            <form onSubmit={handleJoin}>
              <input
                type="text"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                placeholder="קוד כניסה"
                className="custom-input"
                autoComplete="off"
              />
              <button type="submit" className="action-btn">
                היכנס לפאנל 🚀
              </button>
            </form>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '400px' }}>
            {!isRoundOpen ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{ fontSize: '60px', marginBottom: '15px' }}>⏳</div>
                <h3 className="pulse-text" style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                  ממתינים לסבב ההצבעה...
                </h3>
                <p style={{ margin: 0, opacity: 0.8 }}>המסך יתעדכן אוטומטית כשהמנחה יפתח את הקלפי.</p>
              </div>
            ) : hasVoted ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{ fontSize: '70px', marginBottom: '15px', textShadow: '0 0 20px rgba(0,255,0,0.5)' }}>✅</div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '26px' }}>הצבעתך נקלטה!</h3>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '18px' }}>התוצאות יוצגו על המסך הראשי באולם.</p>
              </div>
            ) : (
              <div className="glass-card">
                <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '15px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                    סבב {currentRound}
                  </span>
                  <h3 style={{ margin: '15px 0 0 0', fontSize: '24px' }}>למי תצביע/י?</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {parties.map((party, index) => (
                    <button
                      key={party}
                      onClick={() => handleVote(party)}
                      className="party-btn"
                      style={{ animationDelay: `${index * 0.1}s` }} // אפקט כניסה מדורג
                    >
                      {party}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}