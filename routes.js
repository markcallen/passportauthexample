var fs = require('fs');

var express = require('express');
var morgan  = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var methodOverride = require('method-override');
var session      = require('express-session');
var MongoStore = require('connect-mongo')(session);
var sessiondb = require('config').Sessiondb;
var webserver = require('config').Webserver;
var passport = require('passport');
var authorization= require('./authorization')();

var app = express();

app.use(morgan('combined'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(methodOverride()); // must come after bodyParser
app.use(session({
  secret:'mysecretcookie',
  maxAge: new Date(Date.now() + 3600000),
  store: new MongoStore(
    {db: sessiondb.name, host: sessiondb.host},
    function(collection){
      if (collection.db && collection.db.databaseName) {
        console.log('connect-mongodb setup ok. Connected to: ' + collection.db.databaseName);
      } else {
        console.log(collection);
      }
  }), 
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(authorization.middleware());

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

module.exports = function(params) {
  params.app = app;
  params.passport = passport;
  params.authorization = authorization;

  fs.readdirSync(__dirname + '/routes/').forEach(function(name) {
    if (name.slice(-3) == '.js') {
      var route = require('./routes/' + name);
      var routename = name.split('.')[0];
      console.log("Loading route: " + routename);
      route(params);
    }
  });

  app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
  });

  var server = require('http').createServer(app);
  server.listen(webserver.port);
  console.log("started express at: http://localhost:"+webserver.port);
};
