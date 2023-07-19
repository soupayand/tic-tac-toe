const serverPort = process.argv[2] || 5050;
const io = require('socket.io')(serverPort);
let clients = [];
let currentPlayer = 0;
let board = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // Represents the game board

function checkWin() {
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];

  for (let i = 0; i < winningCombinations.length; i++) {
    const [a, b, c] = winningCombinations[i];
    if (board[a] !== ' ' && board[a] === board[b] && board[a] === board[c]) {
      return true; // We have a winner!
    }
  }

  return false; // No winner
}

function checkTie() {
  return !board.some((square) => typeof square === 'number');
}

function handleMove(player, move) {
  if (player === currentPlayer && typeof board[move] === 'number') {
    board[move] = player === 0 ? 'X' : 'O';
    io.emit('updateBoard', board);

    if (checkWin()) {
      io.emit('gameResult', `Game won by ${player === 0 ? 'first' : 'second'} player.`);
      resetGame();
    } else {
      currentPlayer = currentPlayer === 0 ? 1 : 0;
      clients[currentPlayer].emit('nextMove');
      
      if (checkTie()) {
        io.emit('gameResult', 'Game is tied.');
        resetGame();
      }
    }
  }
}

function resetGame() {
  currentPlayer = 0;
  board = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  clients = []
}

io.on('connection', (socket) => {
  if (clients.length < 2) {
    clients.push(socket);
    socket.emit('connected', clients.length);

    if (clients.length === 2) {
      clients[0].emit('gameStart', 'Game started. You are the first player.');
      clients[1].emit('gameStart', 'Game started. You are the second player.'); 
      clients[0].emit('updateBoard', board);
      clients[0].emit('nextMove');
    }
  } else {
    socket.emit('gameError', 'Game is already full. Please try again later.');
    socket.disconnect(true);
  }

  socket.on('move', (move) => {
    handleMove(clients.indexOf(socket), move);
  });

  socket.on('resign', () => {
    const disconnectedPlayer = clients.indexOf(socket);
    const remainingPlayer = disconnectedPlayer === 0 ? 1 : 0;

    io.emit('gameResult', `Game won by ${remainingPlayer === 0 ? 'first' : 'second'} player due to resignation.`);
    resetGame();
  });

  socket.on('disconnect', () => {
    const disconnectedPlayer = clients.indexOf(socket);
    const remainingPlayer = disconnectedPlayer === 0 ? 1 : 0;

    io.emit('gameResult', `Game won by ${remainingPlayer === 0 ? 'first' : 'second'} player since ${remainingPlayer === 0 ? 'second' : 'first'} player disconnected.`);


    if (clients.every(client => !client.connected)) {
      resetGame();
    }
  });
});

console.log('Server started on port ' + serverPort);
