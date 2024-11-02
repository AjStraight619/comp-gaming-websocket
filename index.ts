import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

type User = {
  id: string;
  username: string;
  roomId: string;
};

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
  },
});

// Array to store connected users
const users: User[] = [];

app.get('/', (req, res) => {
  res.send('Welcome to the WebSocket server with Express!');
});

io.on('connection', socket => {
  console.log('A user connected');

  socket.on('joinRoom', (roomId, username) => {
    socket.join(roomId);
    console.log(`${username} joined room: ${roomId}`);

    // Store the user in the array
    // users.push({ id: socket.id, username, roomId });
    console.log('Current Users:', users);

    // Notify the room about the new user
    io.to(roomId).emit('user joined', { username });
  });

  socket.on('chat message', (roomId, msg) => {
    console.log('Chat message: ', msg);
    io.to(roomId).emit('chat message', msg);
  });

  socket.on('typing', (roomId, username) => {
    console.log(`${username} is typing...`);
    io.to(roomId).emit('typing', username);
  });

  socket.on('start timer', (roomId, seconds) => {
    console.log('Starting timer in room:', roomId);
    recursiveTimer(seconds, roomId); // Pass roomId to recursiveTimer
    io.to(roomId).emit('timer started');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');

    // Remove user from the array when they disconnect
    const index = users.findIndex(user => user.id === socket.id);
    if (index !== -1) {
      const [removedUser] = users.splice(index, 1);
      io.to(removedUser.roomId).emit('user left', {
        username: removedUser.username,
      });
    }
    console.log('Current Users:', users);
  });
});

server.listen(4000, () => {
  console.log('Server is running on http://localhost:4000');
});

function recursiveTimer(seconds: number, roomId: string) {
  if (seconds > 0) {
    console.log(`Time remaining: ${seconds} seconds`);

    // Emit the remaining time to the room
    io.to(roomId).emit('timer update', seconds);

    // Call recursively every second
    setTimeout(() => recursiveTimer(seconds - 1, roomId), 1000);
  } else {
    console.log('Timer finished!');
    io.to(roomId).emit('timer update', 0); // Emit final 0 when the timer ends
    io.to(roomId).emit('timer finished');
  }
}

// recursiveTimer(360);
