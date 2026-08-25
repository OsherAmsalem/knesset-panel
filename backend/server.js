const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');

// מנסים לטעון את משתנה הסביבה, ואם הוא לא קיים - נזהיר במקום שהשרת יקרוס
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (e) {
  console.log("WARNING: FIREBASE_SERVICE_ACCOUNT is not defined or invalid JSON!");
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://knessetpanel-default-rtdb.firebaseio.com"
  });
} else {
  // מצב חירום: אם המפתח לא הגיע, השרת ירוץ בלי פיירבייס כדי שלא יקרוס, ונראה למה המשתנה ריק
  console.log("Running server without Firebase connection due to missing credentials.");
}

const db = serviceAccount ? admin.database() : null;
// (וכדי שהשרת לא ייפול בהמשך כשננסה לשמור נתונים, נוסיף בדיקה קטנה ש-db קיים)

const db = admin.database();
const eventsRef = db.ref('events');
const globalStatsRef = db.ref('globalStats');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// הזיכרון הזמני של השרת
let globalStats = {
  parties: {}, 
  opinionChange: { 'חיזק את דעתי': 0, 'החליש (ערער את דעתי)': 0, 'לא שינה את דעתי': 0 },
  panelRating: { sum: 0, count: 0 } 
};
let events = {};

// 2. משיכת הנתונים מהענן ברגע שהשרת עולה (כדי לא לאבד נתונים מהעבר)
globalStatsRef.once('value', (snapshot) => {
  if (snapshot.exists()) globalStats = snapshot.val();
});
eventsRef.once('value', (snapshot) => {
  if (snapshot.exists()) events = snapshot.val();
});

// פונקציות עזר לגיבוי מהיר לענן
function saveEventToDB(eventCode) {
  eventsRef.child(eventCode).set(events[eventCode]);
}
function saveGlobalStatsToDB() {
  globalStatsRef.set(globalStats);
}

io.on('connection', (socket) => {
  
  socket.on('create_event', ({ eventCode, schoolName, representatives }) => {
    if (events[eventCode]) {
      return socket.emit('error_message', 'קוד אירוע זה כבר קיים במערכת. אנא בחר קוד אחר.');
    }

    events[eventCode] = {
      schoolName,
      representatives,
      phase: 'waiting',
      isVotingOpen: true,
      participants: 0,
      warmupResults: {},
      warmupVotes: {},
      rounds: {
        1: { title: 'כלכלי חברתי', votes: {}, results: {} },
        2: { title: 'ישראל כמדינה יהודית', votes: {}, results: {} },
        3: { title: 'רפורמה משפטית', votes: {}, results: {} },
        4: { title: 'גיוס', votes: {}, results: {} },
        5: { title: 'מדיני בטחוני', votes: {}, results: {} },
        6: { title: 'שיטת הממשל', votes: {}, results: {} }
      },
      summaryResults: {
        q1: {}, q2: {}, q3: {}, q4: { sum: 0, count: 0 }, q5: { sum: 0, count: 0 }
      },
      summaryVotes: {}
    };

    representatives.forEach(rep => {
      events[eventCode].warmupResults[rep] = 0;
      for(let i=1; i<=6; i++) {
        events[eventCode].rounds[i].results[rep] = 0;
      }
    });

    saveEventToDB(eventCode); // גיבוי לענן

    socket.join(eventCode);
    socket.join(`${eventCode}_admin`);
    socket.emit('admin_joined_success', eventCode); 
  });

  socket.on('join_admin', ({ eventCode }) => {
    const event = events[eventCode];
    if (!event) return socket.emit('error_message', 'קוד אירוע לא נמצא. ודא שהאירוע נוצר.');
    
    socket.join(`${eventCode}_admin`);
    socket.emit('admin_joined_success', eventCode);
    socket.emit('live_results', getEventState(event));
  });

  socket.on('join_event', ({ eventCode, role }) => {
    const event = events[eventCode];
    if (!event) return socket.emit('error_message', 'קוד אירוע לא נמצא');

    socket.join(eventCode);
    if (role === 'student') {
      event.participants++;
      saveEventToDB(eventCode); // מעדכן בענן שיש משתתף חדש
      io.to(eventCode).emit('participants_update', event.participants);
    } else if (role === 'display') {
      socket.join(`${eventCode}_display`);
    }

    socket.emit('event_state', getEventState(event));
  });

  socket.on('change_phase', ({ eventCode, phase }) => {
    const event = events[eventCode];
    if (!event) return;
    event.phase = phase;
    event.isVotingOpen = true; 
    saveEventToDB(eventCode); // גיבוי לענן

    io.to(eventCode).emit('phase_changed', getEventState(event));
    updateAdminAndDisplay(eventCode, event);
  });

  socket.on('toggle_voting', ({ eventCode }) => {
    const event = events[eventCode];
    if (!event) return;
    event.isVotingOpen = !event.isVotingOpen;
    saveEventToDB(eventCode); // גיבוי לענן

    io.to(eventCode).emit('event_state', getEventState(event));
    updateAdminAndDisplay(eventCode, event); 
  });

  socket.on('submit_warmup', ({ eventCode, userId, representative }) => {
    const event = events[eventCode];
    if (!event || event.phase !== 'warmup' || event.warmupVotes[userId] || !event.isVotingOpen) return;
    
    event.warmupVotes[userId] = representative;
    event.warmupResults[representative]++;
    saveEventToDB(eventCode); // גיבוי לענן
    
    updateAdminAndDisplay(eventCode, event);
    socket.emit('vote_confirmed');
  });

  socket.on('submit_round_vote', ({ eventCode, userId, roundId, representative }) => {
    const event = events[eventCode];
    if (!event || event.phase !== `round${roundId}` || event.rounds[roundId].votes[userId] || !event.isVotingOpen) return;

    event.rounds[roundId].votes[userId] = representative;
    event.rounds[roundId].results[representative]++;
    saveEventToDB(eventCode); // גיבוי לענן

    updateAdminAndDisplay(eventCode, event);
    socket.emit('vote_confirmed');
  });

  socket.on('submit_summary', ({ eventCode, userId, answers }) => {
    const event = events[eventCode];
    if (!event || event.phase !== 'summary' || event.summaryVotes[userId] || !event.isVotingOpen) return;

    event.summaryVotes[userId] = true;
    const { q1, q2, q3, q4, q5 } = answers;
    
    if(q1) event.summaryResults.q1[q1] = (event.summaryResults.q1[q1] || 0) + 1;
    if(q2) event.summaryResults.q2[q2] = (event.summaryResults.q2[q2] || 0) + 1;
    if(q3) event.summaryResults.q3[q3] = (event.summaryResults.q3[q3] || 0) + 1;
    event.summaryResults.q4.sum += Number(q4);
    event.summaryResults.q4.count++;
    event.summaryResults.q5.sum += Number(q5);
    event.summaryResults.q5.count++;

    if(q2) globalStats.parties[q2] = (globalStats.parties[q2] || 0) + 1;
    if(q3) globalStats.opinionChange[q3] = (globalStats.opinionChange[q3] || 0) + 1;
    globalStats.panelRating.sum += Number(q4);
    globalStats.panelRating.count++;

    saveEventToDB(eventCode); // גיבוי האירוע לענן
    saveGlobalStatsToDB();    // גיבוי הקופה הראשית לענן

    updateAdminAndDisplay(eventCode, event);
    socket.emit('vote_confirmed');
  });

  socket.on('reset_global_stats', ({ eventCode }) => {
    globalStats.parties = {};
    globalStats.opinionChange = { 'חיזק את דעתי': 0, 'החליש (ערער את דעתי)': 0, 'לא שינה את דעתי': 0 };
    globalStats.panelRating = { sum: 0, count: 0 };
    
    saveGlobalStatsToDB(); // גיבוי האיפוס לענן
    
    const event = events[eventCode];
    if (event) {
      updateAdminAndDisplay(eventCode, event);
    }
  });
});

function updateAdminAndDisplay(eventCode, event) {
  io.to(`${eventCode}_admin`).to(`${eventCode}_display`).emit('live_results', getEventState(event));
}

function getEventState(event) {
  return {
    schoolName: event.schoolName,
    representatives: event.representatives,
    phase: event.phase,
    isVotingOpen: event.isVotingOpen, 
    participants: event.participants,
    warmupResults: event.warmupResults,
    rounds: event.rounds,
    summaryResults: event.summaryResults,
    globalStats
  };
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));