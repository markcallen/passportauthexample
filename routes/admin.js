

module.exports = function(params) {

  var app = params.app;
  var passport = params.passport;
  var User = params.models.user;

app.all('/admin/*', function(req, res, next) {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  if (req.isAuthenticated() && req.user && req.user.isadmin) {
    return next();
  } else {
    // try basic
    passport.authenticate('basic', function(err, user, info) {
      if (err) { 
        console.log(err);
      }
      if (!user && !user.isadmin) { 
        return res.status(401).send({err: 'Need to login'});
      }
      req.logIn(user, function(err) {
        if (err) { 
          console.log(err);
        } else if (user.isadmin) {
          return next();
        }
        return res.status(401).send({err: 'Need to login'});
       });
    })(req, res, next);
  }

});

app.get('/admin/accounts', function (req, res, next) {
  User.find({}).sort('-created').exec(function(err, accounts) {
    if (err) {
      return next(err);
    }
    var results = [];
    for (var i=0; i < accounts.length; i++) {
      results.push(accounts[i].sanitizeUser());
    }
    res.send(results);
  });
});

app.get('/admin/account/:id', function (req, res, next) {
  User.findById(req.params.id, function (err, user) {
    if (err) {
      return next(err);
    }
    if (user) {
      return res.send(user.sanitizeUser());
    }
    else {
      return res.send("Can't find user: " + req.params.id);
    }
  });
});

app.delete('/admin/account/:id', function (req, res, next) {
  User.findById(req.params.id, function (err, user) {
    if (err) {
      return next(err);
    }
    if (! user) {
      return next("Can't find user: " + req.params.id);
    }
    user.remove(function (err) {
      if (err) {
        return next(err);
      }
      res.send("Done");
    });
  });
});

};
