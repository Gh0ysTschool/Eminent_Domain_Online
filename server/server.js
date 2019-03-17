const WebSocket = require('ws');
const games={};
const wss = new WebSocket.Server({ port: 3030 });
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    if(data.header=='set'){
      games[data.game_id]=data;
    }
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
});
