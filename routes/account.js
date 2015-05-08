var utils = require('../utils');
var localauth = require('config').LocalAuth;

module.exports = function(params) {

  var app = params.app;
  var passport = params.passport;
  var User = params.models.user;
  var jobs = params.jobs;

  function createUser(req, res, next) {
    // set the username to be the email is non is supplied
    if (! req.body.username) {
      req.body.username = req.body.email;
    }
    var user = new User();
    if (req.body.password == null || req.body.password.length === 0) {
      req.session.error = "no password supplied";
      return next();
    }
    user.setPassword(req.body.password);
    if (! utils.checkEmail(req.body.email)) {
      req.session.error = req.body.email + " is not a valid email address.";
      return next();
    }

    utils.updateModel(req.body, user, function(user) {
      user.verifySalt = utils.salt();
      user.save(function(err) {
        if(err) { 
          if (11000 === err.code) {
	    req.session.error = "Email " + req.body.email + " already taken";
          } else {
	    req.session.error = err;
          } 
        } else { 
          req.user = user;
        }
        next();
      });
    });
  }

  app.post('/api/account', function(req, res, next) {
	  createUser(req, res, next);
    }, function(req, res, next) {
      if (req.session.error) {
	return next(req.session.error);
      }
      res.send(req.user.sanitizeUser());
  });

  app.post('/api/accountajax', function(req, res, next) {
      createUser(req, res, next);
    }, passport.authenticate('local', { successRedirect: localauth.successUrl,
      failureRedirect: localauth.newAccountFailureUrl,
      failureFlash: false }) 
   );

  app.get('/api/account', function (req, res) {
    res.send(req.user.sanitizeUser());
  });

  app.get('/api/account/:id', function (req, res) {
    res.send(req.user.sanitizeUser());
  });

  app.put('/api/account/:id', function (req, res, next){
    User.findById(req.params.id, function (err, user) {
      if (req.body.username) {
        return next("Can't change username.");
      }
      if (req.body.password) {
        return next("Can't change password via account using /api/changePassword.");
      }
      if (req.body.email && ! utils.checkEmail(req.body.email)) {
        return next(req.body.email + " is not a valid email address.");
      }
      if (user.email != req.body.email) {
        user.verifiedEmail = false;
      }
      utils.updateModel(req.body, user, function(user) {
        user.save(function (err) {
          if (err) {
            if (11001 === err.code) {
              return next("Email " + req.body.email + " already used");
            } 
            return next(err); 
          } else {
            return res.send(user.sanitizeUser());
          }
        });
      });
    });
  }); 

};
