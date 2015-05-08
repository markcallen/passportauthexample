// Static 
//
var localauth = require('config').LocalAuth;

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.session.error = req.baseUrl + " access invalid, please login";
    return res.redirect(localauth.loginUrl);
  }
}


module.exports = function(params) {
  var app = params.app;

  app.get('/', function (req, res) {
    res.render('index', { });
  });

  app.get('/index.html', function (req, res) {
    res.render('index', { });
  });

  app.get('/login.html', function (req, res) {
    var message = req.session.error;
    req.session.error = null;
    res.render('login', { message: message });
  });

  app.get('/newaccount.html', function (req, res) {
    var message = req.session.error;
    if (message) {
      message = JSON.stringify(message, null, 2);
    }
    req.session.error = null;
    res.render('newaccount', { message: message });
  });

  app.get('/account.html', checkAuth, function (req, res) {
    res.render('account', { account: req.user.sanitizeUser() });
  });

  app.get('/private.html', checkAuth, function (req, res) {
    res.render('private', { });
  });

  app.get('/logout.html', checkAuth, function (req, res) {
    res.render('logout', { });
  });

};
