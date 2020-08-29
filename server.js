const express = require("express");
const app = express();

const { config: { heroesLounge: { username, password } } } = require('./config');
const { getTeam, formatter } = require('./heroes_lounge')

app.get("/heroeslounge/team/:hlTeamCode", (request, response) => {
  const { hlTeamCode } = request.params;
  getTeam(hlTeamCode, username, password).then(formatter).then((csv) => {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/csv');
    response.write(csv);
    response.end();
  })
});

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
