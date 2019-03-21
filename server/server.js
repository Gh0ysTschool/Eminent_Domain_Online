const WebSocket = require('ws');
const games=[];
const wss = new WebSocket.Server({ port: 3030 });
let generatenewgame = function(state){
  state.game_id= games.length;
  games.push({game:state});
  return state.game_id;
};
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    data = JSON.parse(data);
    if(data.header=='set'){
      games[data.game_id].game=data;
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } else if(data.header=='newgame'){
      let i = generatenewgame(data.game);
      ws.send(i);
    } else if(data.header=='fetchexisting'){
      data = games;
      ws.send(JSON.stringify(games));
    } else if(data.header=='enterexisting'){
      let game_id = data.game_id;
      let slot = data.slot;
      let  player_name = data.player_name;
      games[game_id].game.players[slot].name=player_name;
      games[game_id].game.players[slot].available=false;
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(games[game_id].game));
        }
      });
    }
  });
});
