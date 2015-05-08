var utils = require('../utils');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var facebook = require('config').Facebook;
var localauth = require('config').LocalAuth;

// Authentication

module.exports = function(params) {

  var app = params.app;
  var User = params.models.user;
  var passport = params.passport;

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


  if (facebook.appID && facebook.appSecret) {
  passport.use(new FacebookStrategy({
      clientID: facebook.appID,
      clientSecret: facebook.appSecret,
      callbackURL: facebook.callbackURL
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
  }

  app.all("/auth/*", function(req, res, next) {
    res.header("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
    next();
  });

  app.post('/auth/login', function(req, res, next) {
    var successUrl = (req.body.successUrl != null ? req.body.successUrl : localauth.successUrl);
    var failureUrl = (req.body.failureUrl != null ? req.body.failureUrl : localauth.loginFailureUrl);
    passport.authenticate('local', function(err, user, info) {
      if (err) { 
        return next(err); 
      }
      if (!user) { 
	req.session.error = "Can not authenicated";
        return res.redirect(failureUrl); 
      }
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

  //@TODO: create test
  app.post('/auth/forgottenPassword', function (req, res, next){
    User.find({username: req.body.username}, function(err, user) {
      if (err) {
        next(err);
      } else if (user == null || user.length != 1 || user[0].username != req.body.username ) {
        next("Can not find user for: " + req.body.username);
      } else {
        user[0].createVerifySalt();
        return user[0].save(function (err) {
          if (err) {
            return next(err); 
          } 
          utils.verifyEmail(user, function(err, message) {
            if (err) {
              return next(err);
            }
            return res.send(message);
          });
        });
      }
    });
  });

  //@TODO: create test
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
  }, passport.authenticate('local', { successRedirect: localauth.successUrl,
    failureRedirect: localauth.loginFailureUrl,
    failureFlash: false }) );

  //@TODO: create test
  app.post('/auth/changePassword', function (req, res, next){
    var user = req.user;
    if (user.isPasswordValid(req.body.oldPassword)) {
      user.setPassword(req.body.newPassword);
      return user.save(function (err) {
        if (err) {
          next(err); 
        } else {
          return res.send(user.sanitizeUser());
        }
      });
    } else {
      next("Invalid Old Password");
    }
  }); 

  //@TODO: create test
  app.get('/auth/sendVerifyEmail', function (req, res, next) {
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

  //@TODO: create test
  app.post('/auth/verifyEmail', function (req, res, next) {
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

  app.get('/auth/facebook', 
      passport.authenticate('facebook', { scope: ['email'] })
  );

  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: localauth.successUrl,
                                      failureRedirect: localauth.loginFailureUrl })
  );

};
