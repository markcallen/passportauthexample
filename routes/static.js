// Static 

module.exports = function(params) {
  var app = params.app;

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

};
