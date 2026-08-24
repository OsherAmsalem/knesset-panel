import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from 'recharts';

const socket = io('https://knesset-backend.onrender.com');

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;800&display=swap');

  @keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes pulseSoft {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
  }

  .display-app {
    min-height: 100vh;
    background: linear-gradient(-45deg, #0a2342, #1756a9, #3b82f6, #020617);
    background-size: 400% 400%;
    animation: gradientBG 15s ease infinite;
    font-family: 'Rubik', sans-serif;
    direction: rtl;
    padding: 30px 40px;
    color: white;
  }

  .glass-panel {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 24px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
    padding: 25px;
  }

  .header-glass {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 20px 40px;
    margin-bottom: 40px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }

  .code-badge {
    background: linear-gradient(135deg, #f43f5e, #e11d48);
    padding: 5px 20px;
    border-radius: 12px;
    font-size: 40px;
    font-weight: 900;
    letter-spacing: 4px;
    box-shadow: 0 5px 15px rgba(225, 29, 72, 0.4);
    display: inline-block;
    margin-right: 15px;
  }

  .stat-box {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 15px 25px;
    font-size: 24px;
    text-align: left;
    border: 1px solid rgba(255,255,255,0.05);
  }

  .waiting-title {
    font-size: 80px;
    font-weight: 800;
    background: linear-gradient(to right, #60a5fa, #e0f2fe);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 20px;
  }
`;

const CustomXAxisTick = ({ x, y, payload, index }) => {
  const yOffset = index % 2 === 0 ? 25 : 55;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={yOffset}
        textAnchor="middle" 
        fill="rgba(255, 255, 255, 0.9)"
        fontSize="18" 
        fontWeight="bold"
      >
        {payload.value}
      </text>
    </g>
  );
};

export default function DisplayView() {
  const [eventCode, setEventCode] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [participantsCount, setParticipantsCount] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [isRoundOpen, setIsRoundOpen] = useState(false);
  const [results, setResults] = useState({});
  const [allRounds, setAllRounds] = useState({});

  useEffect(() => {
    socket.on('event_state', (data) => {
      setSchoolName(data.schoolName);
      setParticipantsCount(data.participants);
      setCurrentRound(data.currentRound);
      setIsRoundOpen(data.isRoundOpen);
      if (data.rounds) {
        setAllRounds(data.rounds);
        if (data.rounds[data.currentRound]) {
          setResults(data.rounds[data.currentRound].results || {});
        }
      }
      setIsJoined(true);
    });

    socket.on('participants_update', (count) => setParticipantsCount(count));
    socket.on('round_status', (data) => {
      setCurrentRound(data.round);
      setIsRoundOpen(data.isOpen);
      if (data.results) setResults(data.results);
      if (data.allRounds) setAllRounds(data.allRounds);
    });
    socket.on('live_results', (data) => setResults(data.results));

    return () => {
      socket.off('event_state');
      socket.off('participants_update');
      socket.off('round_status');
      socket.off('live_results');
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!eventCode.trim()) return;
    socket.emit('join_event', { eventCode: eventCode.trim(), role: 'display' });
  };

  const chartData = Object.keys(results).map(party => ({
    name: party,
    votes: results[party]
  })).sort((a, b) => b.votes - a.votes);

  const trendData = Object.keys(allRounds).map(roundNum => {
    const roundData = { name: `סבב ${roundNum}` };
    const roundResults = allRounds[roundNum].results || {};
    Object.keys(roundResults).forEach(party => {
      roundData[party] = roundResults[party];
    });
    return roundData;
  });

  const parties = Object.keys(results);
  const colors = ['#60a5fa', '#f43f5e', '#34d399', '#fbbf24', '#c084fc', '#f472b6', '#2dd4bf', '#a3e635', '#fb923c'];

  const renderCustomLegend = () => {
    if (currentRound < 2) return null;
    const prevRoundNum = currentRound - 1;
    const prevResults = allRounds[prevRoundNum]?.results || {};
    const currResults = allRounds[currentRound]?.results || {};
    const prevTotal = Object.values(prevResults).reduce((a, b) => a + b, 0) || 1;
    const currTotal = Object.values(currResults).reduce((a, b) => a + b, 0) || 1;

    return (
      <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
        {parties.map((party, index) => {
          const prevPct = ((prevResults[party] || 0) / prevTotal) * 100;
          const currPct = ((currResults[party] || 0) / currTotal) * 100;
          const diff = (currPct - prevPct).toFixed(1);
          if ((prevResults[party] || 0) === 0 && (currResults[party] || 0) === 0) return null;
          const diffColor = diff > 0 ? '#34d399' : (diff < 0 ? '#f43f5e' : '#94a3b8');
          const sign = diff > 0 ? '+' : '';

          return (
            <div key={party} style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '8px 15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: colors[index % colors.length], borderRadius: '50%', marginLeft: '8px', boxShadow: `0 0 10px ${colors[index % colors.length]}` }}></div>
              <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'white' }}>{party}</span>
              <span style={{ direction: 'ltr', display: 'inline-block', marginRight: '8px', color: diffColor, fontWeight: 'bold', fontSize: '18px' }}>
                ({sign}{diff}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const tooltipStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    fontFamily: "'Rubik', sans-serif",
    direction: 'rtl',
    padding: '15px 20px'
  };

  // העיצוב הבסיסי לטקסט החלונית (ללא צבע קבוע - יאפשר לספרייה לצבוע אוטומטית לפי המפלגה)
  const tooltipItemBaseStyle = {
    fontFamily: "'Rubik', sans-serif",
    fontWeight: '800',
    fontSize: '20px',
    padding: '4px 0'
  };

  const tooltipLabelStyle = {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
    paddingBottom: '8px',
    fontSize: '22px',
    fontWeight: '900',
    fontFamily: "'Rubik', sans-serif"
  };

  return (
    <>
      <style>{styles}</style>
      <div className="display-app">
        {!isJoined ? (
          <div style={{ textAlign: 'center', marginTop: '150px' }}>
            <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '60px' }}>
              <h1 style={{ fontSize: '45px', marginBottom: '40px', fontWeight: '800' }}>חיבור מקרן לאולם</h1>
              <form onSubmit={handleJoin}>
                <input
                  type="text"
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value)}
                  placeholder="הזן קוד אירוע"
                  style={{ width: '100%', padding: '20px', fontSize: '30px', textAlign: 'center', borderRadius: '15px', border: 'none', background: 'rgba(255,255,255,0.9)', color: '#0f172a', fontWeight: 'bold', marginBottom: '20px', boxSizing: 'border-box', fontFamily: 'Rubik' }}
                />
                <button type="submit" style={{ width: '100%', padding: '20px', fontSize: '28px', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#fff', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'Rubik', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)' }}>
                  הצג מסך פאנל
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div>
            <div className="header-glass">
              <div>
                <h1 style={{ margin: 0, fontSize: '45px', fontWeight: '800', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                  כנסת 26 <span style={{ opacity: 0.7 }}>|</span> {schoolName}
                </h1>
                <h2 style={{ margin: '15px 0 0 0', fontSize: '30px', fontWeight: '600' }}>
                  כנסו להצביע עם הקוד: <span className="code-badge">{eventCode}</span>
                </h2>
              </div>
              <div className="stat-box">
                <div style={{ marginBottom: '10px' }}>משתתפים באולם: <strong style={{ color: '#34d399', fontSize: '32px' }}>{participantsCount}</strong></div>
                <div>סבב נוכחי: <strong style={{ color: '#60a5fa' }}>{currentRound}</strong></div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              {isRoundOpen ? (
                <div style={{ marginTop: '120px', animation: 'pulseSoft 2s infinite' }}>
                  <h1 style={{ fontSize: '120px', color: '#f43f5e', margin: 0, textShadow: '0 0 40px rgba(244, 63, 94, 0.5)', fontWeight: '900' }}>זמן הצבעה!</h1>
                  <h2 style={{ fontSize: '50px', color: 'rgba(255,255,255,0.9)' }}>כנסו מהטלפונים והשפיעו עכשיו...</h2>
                  <div style={{ fontSize: '100px', marginTop: '20px' }}>📱✨</div>
                </div>
              ) : currentRound === 0 ? (
                <div style={{ marginTop: '150px' }}>
                  <h1 className="waiting-title">ממתינים לתחילת הפאנל</h1>
                  <h2 style={{ fontSize: '40px', color: 'rgba(255,255,255,0.7)', fontWeight: '400' }}>היכנסו לאתר והקלידו את הקוד שלמעלה.</h2>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: currentRound >= 2 ? 'row' : 'column', gap: '40px', height: '58vh' }}>
                  
                  {/* גרף עמודות */}
                  <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '32px', marginBottom: '20px', fontWeight: '800' }}>תוצאות סבב {currentRound}</h2>
                    <div style={{ flex: 1 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 40, left: 0, bottom: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={0} stroke="rgba(255,255,255,0.3)" />
                          <YAxis tick={{ fontSize: 24, fill: 'rgba(255,255,255,0.7)' }} dx={-10} allowDecimals={false} stroke="rgba(255,255,255,0.3)" />
                          
                          {/* בגרף העמודות אנחנו מכריחים את הטקסט להיות לבן בלבד */}
                          <Tooltip 
                            wrapperStyle={{ zIndex: 1000 }} 
                            contentStyle={tooltipStyle}
                            itemStyle={{ ...tooltipItemBaseStyle, color: '#ffffff' }}
                            labelStyle={tooltipLabelStyle}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                          />
                          
                          <Bar dataKey="votes" name="קולות" radius={[8, 8, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* גרף מגמות */}
                  {currentRound >= 2 && (
                    <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h2 style={{ fontSize: '32px', marginBottom: '20px', fontWeight: '800' }}>מגמות שינוי - דעת קהל</h2>
                      <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData} margin={{ top: 20, right: 40, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" tick={{ fontSize: 20, fill: 'rgba(255,255,255,0.9)', fontWeight: 'bold', dy: 15 }} stroke="rgba(255,255,255,0.3)" />
                            <YAxis tick={{ fontSize: 24, fill: 'rgba(255,255,255,0.7)' }} dx={-10} allowDecimals={false} stroke="rgba(255,255,255,0.3)" />
                            
                            {/* בגרף המגמות אנחנו משאירים את הסטייל הבסיסי כדי שהמערכת תצבע כל מפלגה בצבע שלה */}
                            <Tooltip 
                              wrapperStyle={{ zIndex: 1000 }} 
                              contentStyle={tooltipStyle}
                              itemStyle={tooltipItemBaseStyle}
                              labelStyle={tooltipLabelStyle}
                            />
                            
                            <Legend content={renderCustomLegend} verticalAlign="bottom" />
                            {parties.map((party, index) => (
                              <Line 
                                key={party} 
                                type="monotone" 
                                dataKey={party} 
                                stroke={colors[index % colors.length]} 
                                strokeWidth={6} 
                                activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }} 
                                dot={{ r: 4, fill: colors[index % colors.length], strokeWidth: 0 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}