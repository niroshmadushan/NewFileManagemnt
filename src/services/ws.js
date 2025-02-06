const WebSocket = require('ws');
const { activeConnections } = require('./ws');

const initializeWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established.');

    // Add the new connection to the active connections list
    activeConnections.add(ws);

    // Handle connection close
    ws.on('close', () => {
      console.log('WebSocket connection closed.');
      activeConnections.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
};

module.exports = { initializeWebSocket };