import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700;900&display=swap');

  @keyframes pulseRed {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }

  .admin-app {
    min-height: 100vh;
    background: #f8fafc;
    font-family: 'Rubik', sans-serif;
    direction: rtl;
    padding: 40px 20px;
    color: #0f172a;
  }

  .admin-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .header-title {
    text-align: center;
    color: #1e293b;
    font-size: 36px;
    font-weight: 900;
    margin-bottom: 40px;
    letter-spacing: -0.5px;
  }

  .card {
    background: white;
    border-radius: 24px;
    padding: 40px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.04);
    border: 1px solid #f1f5f9;
  }

  .form-group {
    margin-bottom: 25px;
  }

  .form-label {
    display: block;
    font-weight: 600;
    margin-bottom: 10px;
    color: #475569;
    font-size: 16px;
  }

  .form-input {
    width: 100%;
    padding: 16px 20px;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    font-size: 18px;
    font-family: 'Rubik', sans-serif;
    transition: all 0.2s;
    box-sizing: border-box;
    background: #f8fafc;
  }
  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    background: white;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }

  .party-tag {
    background: #eff6ff;
    color: #1d4ed8;
    padding: 8px 16px;
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    font-size: 15px;
    border: 1px solid #bfdbfe;
  }

  .delete-btn {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    font-weight: bold;
    font-size: 18px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .delete-btn:hover { color: #b91c1c; }

  .btn-primary {
    width: 100%;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: white;
    border: none;
    padding: 18px;
    border-radius: 14px;
    font-size: 20px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Rubik', sans-serif;
    box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
    margin-top: 20px;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 25px rgba(37, 99, 235, 0.3); }

  .btn-add {
    background: #f1f5f9;
    color: #475569;
    border: 2px solid #e2e8f0;
    padding: 0 25px;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Rubik', sans-serif;
  }
  .btn-add:hover { background: #e2e8f0; color: #1e293b; }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #f1f5f9;
    padding-bottom: 25px;
    margin-bottom: 35px;
  }

  .stat-block {
    text-align: left;
    background: #f8fafc;
    padding: 15px 25px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
  }

  .control-btn {
    width: 100%;
    padding: 25px;
    font-size: 28px;
    font-weight: 900;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;
    color: white;
    font-family: 'Rubik', sans-serif;
  }

  .btn-open {
    background: linear-gradient(135deg, #10b981, #059669);
    box-shadow: 0 15px 30px rgba(16, 185, 129, 0.3);
  }
  .btn-open:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(16, 185, 129, 0.4); }

  .btn-close {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    box-shadow: 0 15px 30px rgba(239, 68, 68, 0.3);
    animation: pulseRed 2s infinite;
  }
  .btn-close:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(239, 68, 68, 0.4); }
`;

export default function AdminView() {
  const [eventCode, setEventCode] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [parties, setParties] = useState(['הליכוד', 'יש עתיד', 'המחנה הממלכתי', 'ש״ס', 'ישראל ביתנו', 'הציונות הדתית', 'העבודה-מרצ']);
  const [newParty, setNewParty] = useState('');
  const [isCreated, setIsCreated] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [isRoundOpen, setIsRoundOpen] = useState(false);

  useEffect(() => {
    socket.on('participants_update', (count) => {
      setParticipantsCount(count);
    });

    socket.on('round_status', ({ round, isOpen }) => {
      setCurrentRound(round);
      setIsRoundOpen(isOpen);
    });

    return () => {
      socket.off('participants_update');
      socket.off('round_status');
    };
  }, []);

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!eventCode || !schoolName) return alert('נא להזין קוד אירוע ושם בית ספר');
    
    socket.emit('create_event', { eventCode, schoolName, parties });
    setIsCreated(true);
  };

  const handleAddParty = () => {
    if (newParty.trim() && !parties.includes(newParty.trim())) {
      setParties([...parties, newParty.trim()]);
      setNewParty('');
    }
  };

  const handleRemoveParty = (partyToRemove) => {
    setParties(parties.filter(p => p !== partyToRemove));
  };

  const handleToggleRound = () => {
    if (!isRoundOpen) {
      socket.emit('open_round', { eventCode });
    } else {
      socket.emit('close_round', { eventCode });
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="admin-app">
        <div className="admin-container">
          <h1 className="header-title">מערכת ניהול פאנל 🎛️</h1>

          {!isCreated ? (
            <div className="card">
              <h2 style={{ margin: '0 0 30px 0', fontSize: '24px', color: '#1e293b' }}>הגדרת אירוע חדש</h2>
              
              <form onSubmit={handleCreateEvent}>
                <div className="form-group">
                  <label className="form-label">שם בית הספר / מוסד:</label>
                  <input 
                    type="text" 
                    value={schoolName} 
                    onChange={(e) => setSchoolName(e.target.value)} 
                    placeholder="לדוגמה: תיכון מקיף א'"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">קוד גישה (PIN):</label>
                  <input 
                    type="text" 
                    value={eventCode} 
                    onChange={(e) => setEventCode(e.target.value)} 
                    placeholder="לדוגמה: 1234"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">רשימת מפלגות להצבעה:</label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input 
                      type="text" 
                      value={newParty} 
                      onChange={(e) => setNewParty(e.target.value)} 
                      placeholder="הוסף מפלגה חדשה..."
                      className="form-input"
                    />
                    <button type="button" onClick={handleAddParty} className="btn-add">הוסף</button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {parties.map((party) => (
                      <span key={party} className="party-tag">
                        {party}
                        <button type="button" onClick={() => handleRemoveParty(party)} className="delete-btn">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-primary">צור אירוע והתחל פאנל</button>
              </form>
            </div>
          ) : (
            <div className="card">
              <div className="dashboard-header">
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '28px', color: '#0f172a' }}>{schoolName}</h3>
                  <div style={{ fontSize: '18px', color: '#64748b' }}>
                    קוד כניסה למשתתפים: <strong style={{ color: '#2563eb', fontSize: '22px', background: '#eff6ff', padding: '4px 12px', borderRadius: '8px' }}>{eventCode}</strong>
                  </div>
                </div>
                <div className="stat-block">
                  <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '5px' }}>
                    מחוברים עכשיו: <strong style={{ color: '#10b981', fontSize: '22px' }}>{participantsCount}</strong>
                  </div>
                  <div style={{ fontSize: '16px', color: '#64748b' }}>
                    סבב נוכחי: <strong style={{ color: '#0f172a', fontSize: '20px' }}>{currentRound}</strong>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px 0' }}>
                <button 
                  onClick={handleToggleRound} 
                  className={`control-btn ${isRoundOpen ? 'btn-close' : 'btn-open'}`}
                >
                  {isRoundOpen ? `סגור קלפי (סבב ${currentRound})` : `פתח קלפי להצבעה (סבב ${currentRound + 1})`}
                </button>
                <p style={{ marginTop: '20px', color: '#64748b', fontSize: '16px', fontWeight: '500' }}>
                  {isRoundOpen 
                    ? "ההצבעה פתוחה כעת! התלמידים יכולים להצביע במכשירים שלהם."
                    : "לחץ על הכפתור הירוק כדי לאפשר לתלמידים להתחיל להצביע."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}