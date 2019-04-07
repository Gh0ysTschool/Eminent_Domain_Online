const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 5000;
let server = express()
  .use(express.static(path.join(__dirname, "public")))
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get("/", (req, res) => res.render("pages/index"))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const WebSocket = require("ws");
const games = [];
const wss = new WebSocket.Server({ server: server });
let _clients = [];
let generatenewgame = function(state) {
  state.game_id = games.length;
  games.push({ game: state });
  _clients.push({});
  return state.game_id;
};
wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(data) {
    data = JSON.parse(data);
    if (data.header == "register") {
      _clients[data.game_id][data.sender] = ws;
    } else if (data.header == "set") {
      games[data.game_id] = { game: data };
      _clients[data.game_id][data.sender] = ws;
      let num = 0;
      for (let i in _clients[data.game_id]) {
        if (
          i != data.sender &&
          _clients[data.game_id][i].readyState === WebSocket.OPEN
        ) {
          _clients[data.game_id][i].send(JSON.stringify(data));
        }
      }
    } else if (data.header == "newgame") {
      let i = generatenewgame(data.game);
      ws.send(i);
    } else if (data.header == "ping") {
      ws.send(JSON.stringify({ header: "pong" }));
    } else if (data.header == "fetchexisting") {
      data = games;
      ws.send(JSON.stringify(games));
    } else if (data.header == "remove") {
      games = games.splice(data.game_id,1);
    } else if (data.header == "enterexisting") {
      let game_id = data.game_id;
      let slot = data.slot;
      let player_name = data.player_name;
      games[game_id].game.players[slot].name = player_name;
      games[game_id].game.players[slot].available = false;
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(games[game_id].game));
        }
      });
    }
  });
});
