var express = require('express');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(express);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var crypto = require('crypto');
var uuid = require('node-uuid');
var nodemailer = require("nodemailer");

// Connect to database
mongoose.connect('mongodb://localhost/passportauth');

// Setup SMTP
var transport = nodemailer.createTransport("sendmail");
var senderaddress = "mark@markcallen.com";

var app = express.createServer();
app.configure(function() {
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride()); // must come after bodyParser
  app.use(express.session({
    secret:'passportauthexample',
    maxAge: new Date(Date.now() + 3600000),
    store: new MongoStore(
        {db: mongoose.connection.db.databaseName, host: mongoose.connection.db.serverConfig.host},
        function(err){
            console.log(err || 'connect-mongodb setup ok');
        })
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var UserSchema = new Schema({
  username: {type: String, required: true, unique: true},
  passwordHash: {type: String},
  salt: {type: String, required: true, default: uuid.v1},
  firstname: {type: String},
  lastname: {type: String},
  email: {type: String, required: true, unique: true},
  minecraftLogin: {type: String},
  pubkey: {type: String},
  privkey: {type: String},
  isadmin: {type: Boolean, default: false},
  verifiedEmail: {type: Boolean, default: false},
  verifySalt: {type: String},
  recoverSalt: {type: String},
  externalAuth: {type: String},
  externalId: {type: String},
  externalToken: {type: String},
  created: {type: Date, default: Date.now}
});

var hash = function(passwd, salt) {
    return crypto.createHmac('sha256', salt).update(passwd).digest('hex');
};
 
UserSchema.methods.setPassword = function(passwordString) {
    this.passwordHash = hash(passwordString, this.salt);
};
 
UserSchema.methods.isPasswordValid = function(passwordString) {
    return (this.passwordHash === hash(passwordString, this.salt));
};

mongoose.model('User', UserSchema);
var User = mongoose.model('User');

// Authentication

passport.serializeUser(function(user, done) {
  done(null, user.username);
});

passport.deserializeUser(function(username, done) {
  User.findOne({username: username}, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { 
        return done(err); 
      }
      if (!user) {
        console.log("Unknown user: " + user);
        return done(null, false, { message: 'Unknown user' });
      }
      if (! user.isPasswordValid(password)) {
        console.log("Invalid password: " + password);
        return done(null, false, { message: 'Invalid password' });
      }
      return done(null, user);
    });
  }
));

passport.use(new BasicStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { 
        return done(err); 
      }
      if (!user) { 
        console.log("Unknown user: " + user);
        return done(null, false, { message: 'Unknown user' });
      }
      if (! user.isPasswordValid(password)) {
        console.log("Invalid password: " + password);
        return done(null, false, { message: 'Invalid password' });
      }
      return done(null, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: "...",
    clientSecret: "...",
    callbackURL: "http://localhost:8888/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    var facebookProfile = profile._json;
    User.findOne({ email: facebookProfile.email }, function (err, user) {
      if (err) { 
        return done(err); 
      }
      if (!user) {
        console.log("Creating user from Facebook");
        var user = new User();
        user.username = facebookProfile.email;
        user.externalAuth = "facebook";
      }
      user.email = facebookProfile.email;
      user.firstname = facebookProfile.first_name;
      user.lastname = facebookProfile.last_name;
      user.externalId = facebookProfile.id;
      user.externalToken = accessToken;
      user.save(function(err) {
        if(err) {
          return done(err); 
        } else {
          return done(null, user);
        }
      });
    });
  }
));

app.all('/auth/*', function(req, res, next) {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

app.post('/auth/login', function(req, res, next) {
  var successUrl = (req.body.successUrl != null ? req.body.successUrl : '/#validlogin');
  var failureUrl = (req.body.failureUrl != null ? req.body.failureUrl : '/#invalidlogin');
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }
    if (!user) { return res.redirect(failureUrl) }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect(successUrl);
     });
  })(req, res, next);
});

app.get('/auth/logout', function(req, res){
  req.logOut();
  res.redirect('/');
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback', 
    passport.authenticate('facebook', { successRedirect: '/#validlogin',
                                      failureRedirect: '/#invalidlogin' })
);

// All API requests

app.all('/api/*', function(req, res, next){
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  // Allow for the POST to account to be unauthenicated
  if (req.url == '/api/account' && req.method == 'POST') {
     return next();
  }
  if (req.isAuthenticated()) { 
    return next(); 
  } else {
    // try basic
    passport.authenticate('basic', function(err, user, info) {
      if (err) { 
        console.log(err) 
      }
      if (!user) { 
        return res.status(401).send({err: 'Need to login'});
      }
      req.logIn(user, function(err) {
        if (err) { 
          console.log(err);
          return res.status(401).send({err: 'Need to login'});
        }
        return next();
       });
    })(req, res, next);
  }
});


// All Admin requests

app.all('/admin/*', function(req, res, next){
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  if (req.isAuthenticated() && req.user && req.user.isadmin) {
    return next();
  } else {
    res.status(401).send({err: 'Need to login'});
  }
});

// Accounts
var sanitizeUser = function(user) {
  var suser = (user != undefined ? user.toJSON() : undefined);
  if (suser != undefined) {
    delete suser.passwordHash;
    delete suser.salt;
    delete suser.recoverSalt;
    delete suser.verifySalt;
    delete suser.privkey;
    delete suser.isadmin;
  }
  return suser;
}

function checkName(name) {
  var re = /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*\.?$/;
  return re.test(name);
}

function checkEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function verifyEmail(user, cb) {
  var buffer = new Array(32);
  uuid.v4(null, buffer, 0);
  user.verifySalt = uuid.unparse(buffer);
  return user.save(function (err) {
    if (err) {
      next(err);
    } else {
      var url = "http://localhost:8888/#verify/" + user.email + "/" + hash(user.email, user.verifySalt);
      var textData = "Use this URL to verify your account: " + url;
      var htmlData = "Use this URL to verify your account: <a href=\"" + url + "\">" + url + "</a>";
      var message = {
        to: user.email,
        from: senderaddress,
        subject: 'Verify Account',
        text: textData,
        html: htmlData
      };
      transport.sendMail(message, function(err){
        cb(err, "Message Sent");
      });
    }
  });
}

app.get('/admin/accounts', function (req, res, next) {
  User.find({}, [], { sort: [['created', -1]]}, function(err, accounts) {
    if (err) {
      return next(err);
    }
    var results = new Array();
    for (var i=0; i < accounts.length; i++) {
      results.push(sanitizeUser(accounts[i]));
    }
    res.send(results);
  });
});

app.post('/api/account', function (req, res, next) {
    var user = new User();
    user.username = req.body.username;
    if (req.body.password == null || req.body.password.length == 0) {
      return next("no password supplied");
    }
    user.setPassword(req.body.password);
    if (! checkEmail(req.body.email)) {
      return next(req.body.email + " is not a valid email address.");
    }
    user.username = req.body.username;
    user.setPassword(req.body.password);
    user.email = req.body.email;
    user.firstname = req.body.firstname;
    user.lastname = req.body.lastname;
    user.minecraftLogin = req.body.minecraftLogin;
    if (req.body.pubkey) {
      user.pubkey = req.body.pubkey;
    }
    if (req.body.privkey) {
      user.privkey = req.body.privkey;
    }
    if (req.body.isadmin) {
      user.isadmin = req.body.isadmin;
    }
    user.save(function(err) {
      if(err) { 
        if (11000 === err.code) {
          next("Email " + req.body.email + " already taken");
        } else {
          next(err); 
        } 
      } else { 
        verifyEmail(user, function(err, result) {
          if (err) {
            console.log(err);
          } 
          next();
        });
      }
    });
}, passport.authenticate('local', { successRedirect: '/#validlogin',
                                   failureRedirect: '/#invalidlogin',
                                   failureFlash: false }) );

app.get('/api/account', function (req, res) {
  res.send(sanitizeUser(req.user));
});

app.get('/admin/account', function (req, res) {
  res.send(sanitizeUser(req.user));
});

app.get('/api/account/:id', function (req, res) {
  res.send(sanitizeUser(req.user));
});

app.get('/admin/account/:id', function (req, res, next) {
  User.findById(req.params.id, function (err, user) {
    if (err) {
      return next(err);
    }
    res.send(sanitizeUser(user));
  });
});

app.put('/api/account/:id', function (req, res, next){
  return User.findById(req.params.id, function (err, user) {
    if (! checkEmail(req.body.email)) {
      return next(req.body.email + " is not a valid email address.");
    }
    if (user.email != req.body.email) {
      user.verifiedEmail = false;
    }
    user.email = req.body.email;
    user.firstname = req.body.firstname;
    user.lastname = req.body.lastname;
    user.minecraftLogin = req.body.minecraftLogin;
    return user.save(function (err) {
      if (err) {
        if (11001 === err.code) {
          next("Email " + req.body.email + " already used");
        } else {
          next(err); 
        }
      } else {
        return res.send(sanitizeUser(user));
      }
   });
  });
}); 

app.post('/api/changePassword', function (req, res, next){
    var user = req.user;
    if (user.isPasswordValid(req.body.oldPassword)) {
      user.setPassword(req.body.newPassword);
      return user.save(function (err) {
        if (err) {
          next(err); 
        } else {
          return res.send(sanitizeUser(user));
        }
      });
    } else {
      next("Invalid Old Password");
    }
}); 

app.post('/auth/forgottenPassword', function (req, res, next){
  User.find({username: req.body.username}, function(err, user) {
    if (err) {
      next(err);
    } else if (user == null || user.length != 1 || user[0].username != req.body.username ) {
      next("Can not find user for: " + req.body.username);
    } else {
      var buffer = new Array(32);
      uuid.v4(null, buffer, 0);
      user[0].recoverSalt = uuid.unparse(buffer);
      return user[0].save(function (err) {
        if (err) {
          next(err); 
        } else {
          var url = "http://localhost:8888/#recover/" + user[0].username + "/" + hash(user[0].username, user[0].recoverSalt);
          var textData = "Use this URL to recover your account: " + url;
          var htmlData = "Use this URL to recover your account: <a href=\"" + url + "\">" + url + "</a>";
          var message = {
            to: user[0].email,
            from: senderaddress,
            subject: 'Forgotten Password',
            text: textData,
            html: htmlData
          };
          transport.sendMail(message, function(err){
            if (err) {
              return next(err);
            } else 
            return res.send("Message sent");
          });
        }
      });
    }
  });
});

app.post('/auth/recoverAccount', function (req, res, next){
  User.find({username: req.body.username}, function(err, user) {
    if (err) {
      next(err);
    } else if (user == null || user.length != 1 || user[0].username != req.body.username ) {
      next("Can not find user for: " + req.body.username);
    } else {
      if(req.body.hash === hash(req.body.username, user[0].recoverSalt)) {
        user[0].setPassword(req.body.password);
        user[0].recoverSalt = "";
        return user[0].save(function (err) {
          if (err) {
            next(err); 
          } else {
            next();
          }
        });
      } else {
        next("Can not verify account.");
      }
    }
  });
}, passport.authenticate('local', { successRedirect: '/#validlogin',
                                   failureRedirect: '/#invalidlogin',
                                   failureFlash: false }) );

app.get('/api/sendVerifyEmail', function (req, res, next) {
  var user = req.user;
  verifyEmail(user, function(err, result) {
    if (err) {
      next(err);
    } else {
      console.log(result);
      var output = { };
      output.SendEmailResult = result.SendEmailResult;
      output.email = req.user.email;
      return res.send(output);
    }
  });
});

app.post('/api/verifyEmail', function (req, res, next) {
  var user = req.user;
  if(req.body.hash === hash(req.body.email, user.verifySalt)) {
    user.verifiedEmail = true;
    user.verifySalt = "";
    return user.save(function (err) {
      if (err) {
        next(err);
      } else {
        return res.send('Account verified');
      }
    });
  } else {
    next("Can not verify email.");
  }
});

// File System

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

app.get('/favicon.ico', function (req, res) {
  res.sendfile(__dirname + '/public/favicon.ico');
});

app.get('/css/*', function (req, res) {
  res.sendfile(__dirname +  '/public' +req.url);
});

app.get('/js/*', function (req, res) {
  var url = req.url.replace(/^\/js\//, '/js/');
  res.sendfile(__dirname +  '/public' + url);
});

app.get('/img/*', function (req, res) {
  res.sendfile(__dirname +  '/public' +req.url);
});


app.listen(8888);

