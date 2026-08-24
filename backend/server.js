const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// מבנה נתונים בזיכרון
const events = {};

io.on('connection', (socket) => {
  // יצירת אירוע ע"י מנחה
  socket.on('create_event', ({ eventCode, schoolName, parties }) => {
    events[eventCode] = {
      schoolName,
      parties,
      currentRound: 0,
      isRoundOpen: false,
      participants: 0,
      rounds: {} // שומר snapshot של כל סבב: { 1: { votes: {}, results: {} } }
    };
    socket.join(eventCode);
    socket.join(`${eventCode}_admin`);
    console.log(`Event ${eventCode} created for ${schoolName}`);
  });

  // הצטרפות לאירוע (תלמיד / מקרן / מנחה)
  socket.on('join_event', ({ eventCode, role }) => {
    const event = events[eventCode];
    if (!event) {
      return socket.emit('error_message', 'קוד אירוע לא נמצא');
    }

    socket.join(eventCode);
    if (role === 'student') {
      event.participants++;
      io.to(eventCode).emit('participants_update', event.participants);
    } else if (role === 'display') {
      socket.join(`${eventCode}_display`);
    }

    // שליחת מצב נוכחי למצטרף
    socket.emit('event_state', {
      schoolName: event.schoolName,
      parties: event.parties,
      currentRound: event.currentRound,
      isRoundOpen: event.isRoundOpen,
      participants: event.participants,
      rounds: event.rounds
    });
  });

  // פתיחת סבב חדש
  socket.on('open_round', ({ eventCode }) => {
    const event = events[eventCode];
    if (!event) return;

    event.currentRound++;
    event.isRoundOpen = true;
    event.rounds[event.currentRound] = { votes: {}, results: {} };

    // אתחול מונה קולות למפלגות
    event.parties.forEach(p => event.rounds[event.currentRound].results[p] = 0);

    io.to(eventCode).emit('round_status', {
      round: event.currentRound,
      isOpen: true,
      parties: event.parties
    });
  });

  // סגירת סבב
  socket.on('close_round', ({ eventCode }) => {
    const event = events[eventCode];
    if (!event) return;

    event.isRoundOpen = false;

    io.to(eventCode).emit('round_status', {
      round: event.currentRound,
      isOpen: false,
      results: event.rounds[event.currentRound].results,
      allRounds: event.rounds
    });
  });

  // קליטת הצבעה ממשתתף
  socket.on('submit_vote', ({ eventCode, userId, party }) => {
    const event = events[eventCode];
    if (!event || !event.isRoundOpen) return;

    const currentRoundVotes = event.rounds[event.currentRound].votes;
    
    // מניעת הצבעה כפולה באותו סבב
    if (currentRoundVotes[userId]) return;

    currentRoundVotes[userId] = party;
    event.rounds[event.currentRound].results[party] = (event.rounds[event.currentRound].results[party] || 0) + 1;

    // עדכון תוצאות חיות למסך המקרן ולמנחה בלבד
    io.to(`${eventCode}_admin`).to(`${eventCode}_display`).emit('live_results', {
      round: event.currentRound,
      results: event.rounds[event.currentRound].results
    });

    socket.emit('vote_confirmed');
  });

  socket.on('disconnect', () => {
    // ניתן להוסיף הפחתת משתתפים במידת הצורך
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));