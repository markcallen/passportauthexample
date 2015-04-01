// Static 

module.exports = function(params) {
  var app = params.app;

  app.get('/', function (req, res) {
    res.render('index', { title: 'Hey', message: 'Hello there!'});
  });

  app.get('/login.html', function (req, res) {
    res.render('login', { });
  });

};
