const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');  // Import the CORS middleware

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",  // Allow requests from this origin
    methods: ["GET", "POST"]
  }
});

// Apply the CORS middleware to your Express app
app.use(cors());

let spreadsheetData =  Array.from({ length: 10 }, () => Array(10).fill(''));


io.on('connection', (socket) => {
  console.log('New client connected');

  socket.emit('loadSpreadsheet', spreadsheetData);

  socket.on('updateCell', ({ row, col, value }) => {
    spreadsheetData[row][col] = value;  // Update only the specific cell
    io.emit('cellUpdated', { row, col, value });  // Notify all clients
});


  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));