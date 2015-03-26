// must be _api.js so that it is loaded before all other /api routes

module.exports = function(params) {

var app = params.app;
var passport = params.passport;

app.all('/api/*', function(req, res, next){
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  // Allow for the POST to account to be unauthenicated
  if ((req.url === '/api/account' || req.url === '/api/accountajax') && req.method == 'POST') {
     return next();
  }
  if (req.isAuthenticated()) { 
    return next(); 
  } else {
    // try basic
    passport.authenticate('basic', function(err, user, info) {
      if (err) { 
        console.log(err);
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

};
