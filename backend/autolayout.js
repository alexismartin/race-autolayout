var SSE = require('sse'),
    https = require('https'),
    http = require('http'),
    fs = require('fs');

var server = https.createServer({
        key: fs.readFileSync('/etc/letsencrypt/live/necrommunity.ovh/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/necrommunity.ovh/fullchain.pem'),
        ca: fs.readFileSync('/etc/letsencrypt/live/necrommunity.ovh/chain.pem')
    }),
    serverIO = http.createServer();

var io = require('socket.io')(serverIO);

var clients = [],
    races = [];

var getInit = function(race) {
    if(!race) {
        if(races.length == 1) {
            race = races[0];
        } else {
            var currentRaces = races.filter(function(el) {
                return !el.ended;
            });
            if(currentRaces.length == 1 ) {
                race = currentRaces[0];
            } else {
                var racers = [];
                for(var i = 0; i < currentRaces.length; i++) {
                    racers.push({racers: [currentRaces[i].racer1, currentRaces[i].racer2], score: [currentRaces[i].points1||0, currentRaces[i].points2||0], timer: currentRaces[i].start?Date.now()-currentRaces[i].start:0});
                }
                if(racers.length) return {multi: true, races: racers};
            }
        }
    }
    if(!race) return false;
    else return {racers: [race.racer1, race.racer2], score: [race.points1||0, race.points2||0], timer: race.start?Date.now()-race.start:0};
}

server.listen(8080, function() {
    var sse = new SSE(server);
    sse.on('connection', function(client) {
        clients.push(client);
        var init = getInit();
        if(init) client.send(JSON.stringify({type: 'init', data: init}));
        else client.send(JSON.stringify({type: 'norace'}));

        client.on('close', function() {
            clients.splice(clients.indexOf(client));
        });
    });
});


var sendAll = function(message) {
    message = JSON.stringify(message);
    for(var i = 0; i < clients.length; i++) {
        clients[i].send(message);
    }
    console.log('Current races',races);
    console.log('Number of clients',clients.length);
}


io.on('connection', function(socket){
  socket.on('racestart', function(data){
    console.log('RECEIVED: racestart', data);
    var race = false;
    for(var i = 0; i < races.length; i++) {
        if(!races[i].ended && (data.racer1 == races[i].racer1 && data.racer2 == races[i].racer2 || data.racer2 == races[i].racer1 && data.racer1 == races[i].racer2)) {
            race = races[i];
            break;
        }
    }
    if(!race) {
        race = {
            racer1: data.racer1,
            racer2: data.racer2
        };
        races.push(race);
        sendAll({type: 'init', data: getInit(race)});
    }
    race.start = Date.now();
    sendAll({type: 'start', data: {racers: [race.racer1, race.racer2]}});
  });
  socket.on('racesoon', function(data){
    console.log('RECEIVED: racesoon', data);
    var race = false;
    for(var i = 0; i < races.length; i++) {
        if(!races[i].ended && (data.racer1 == races[i].racer1 && data.racer2 == races[i].racer2 || data.racer2 == races[i].racer1 && data.racer1 == races[i].racer2)) {
            race = races[i];
            break;
        }
    }
    if(!race) {
        race = {
            racer1: data.racer1,
            racer2: data.racer2
        };
        races.push(race);
        sendAll({type: 'init', data: getInit(race)});
    }
  });
  socket.on('raceend', function(data){
    console.log('RECEIVED: raceend', data);
    var race = false;
    for(var i = 0; i < races.length; i++) {
        if(!races[i].ended && (data.racer1 == races[i].racer1 && data.racer2 == races[i].racer2 || data.racer2 == races[i].racer1 && data.racer1 == races[i].racer2)) {
            race = races[i];
            break;
        }
    }
    if(!race) {
        race = {
            racer1: data.racer1,
            racer2: data.racer2
        };
        races.push(race);
    }
    race.start = 0;

    if(race.racer1 == data.winner) {
        race.points1 = (race.points1 || 0) + 1;
    } else {
        race.points2 = (race.points2 || 0) + 1;
    }

    sendAll({type: 'end', data: {racers: [race.racer1, race.racer2], winner: data.winner}});
    if(data.ended) {
        races = races.filter(function(el) {
            return !el.ended;
        });
        race.ended = true;
    }
  });
  socket.on('matchend', function(data){
    console.log('RECEIVED: matchend', data);
    var race = false;
    for(var i = 0; i < races.length; i++) {
        if(data.racer1 == races[i].racer1 && data.racer2 == races[i].racer2 || data.racer2 == races[i].racer1 && data.racer1 == races[i].racer2) {
            race = races[i];
            break;
        }
    }
    if(race) {
        races = races.filter(function(el) {
            return !el.ended;
        });
        race.ended = true;
    }
  });
});
serverIO.listen(5000);