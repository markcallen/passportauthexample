// Static 
//
var localauth = require('config').LocalAuth;

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.authMessage = req.baseUrl + " access invalid, please login";
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
    console.log(req.authMessage);
    res.render('login', { message: "message for now" });
  });

  app.get('/private.html', checkAuth, function (req, res) {
    res.render('private', { });
  });

  app.get('/autherror.html', function (req, res) {
    res.render('autherror', { message: "Auth Error" });
  });

  app.get('/logout.html', checkAuth, function (req, res) {
    res.render('logout', { });
  });

};
