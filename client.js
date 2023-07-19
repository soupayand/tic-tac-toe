const serverIp = process.argv[2] || '127.0.0.1';
const serverPort = process.argv[3] || 5050;
const io = require('socket.io-client');
const readcommand = require('readcommand');

const socket = io('http://' + serverIp + ':' + serverPort);

socket.on('connect', () => {
  console.log('Connected to ' + serverIp + ' ' + serverPort);
  process.stdout.write('> ');
});

socket.on('gameStart', (message) => {
  console.log(message);
});

socket.on('updateBoard', (board) => {
  console.log('Current board:');
  console.log(board.slice(0, 3).join(' | '));
  console.log('-- + -- + --');
  console.log(board.slice(3, 6).join(' | '));
  console.log('-- + -- + --');
  console.log(board.slice(6, 9).join(' | '));
});

socket.on('nextMove', () => {
  console.log("> Your move (1-9):");
  process.stdout.write('> ');
});

socket.on('gameResult', (message) => {
  console.log(message);
  socket.disconnect(true);
});

readcommand.loop(function(err, args, str, next) {
  if (err && err.code !== 'SIGINT') {
    throw err;
  } else if (err) {
    process.exit(0);
  }
  
  const command = args[0];
  
  if (command === 'r') {
    socket.emit('resign');
  } else {
    const parsedCommand = parseInt(command);
    if (parsedCommand >= 1 && parsedCommand <= 9) {
      socket.emit('move', parsedCommand - 1);
    } else {
      console.log('Invalid move. Please enter a number between 1 and 9, or "r" to resign.');
    }
  }
  process.stdout.write('> ');
  return next();
});
