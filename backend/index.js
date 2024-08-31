// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { evaluate } = require('mathjs');  // Import mathjs for evaluating formulas

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

let spreadsheetData = Array.from({ length: 10 }, () =>
  Array.from({ length: 10 }, () => ({ value: '', formula: '' }))
);

io.on('connection', (socket) => {
  console.log('New client connected');

  // Send the initial spreadsheet data to the client
  socket.emit('loadSpreadsheet', spreadsheetData);

  // Handle cell updates from clients
  socket.on('updateCell', ({ row, col, value, style }) => {
    let displayValue = value;
    
    if (value.startsWith('=')) {
        try {
            displayValue = eval(value.substring(1)).toString();
        } catch (error) {
            console.error('Error evaluating formula:', error);
            displayValue = 'ERROR';
        }
    }

    spreadsheetData[row][col] = { value: displayValue, style };
    io.emit('cellUpdated', { row, col, value: displayValue, style }); // Notify all clients
});


  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// const evaluateFormula = (formula, data) => {
//   try {
//     const expression = formula.slice(1); // Remove '=' at the beginning
//     const parsedExpression = expression.replace(/([A-Z]+)(\d+)/g, (_, col, row) => {
//       const colIndex = col.charCodeAt(0) - 'A'.charCodeAt(0); // Convert column letter to index
//       const rowIndex = parseInt(row) - 1; // Convert row number to index
//       return data[rowIndex][colIndex].value || '0'; // Replace with cell value or 0 if empty
//     });
//     return evaluate(parsedExpression).toString(); // Evaluate and return the result
//   } catch (error) {
//     console.error('Error evaluating formula:', error);
//     return '#ERROR'; // Return an error message in case of failure
//   }
// };

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
