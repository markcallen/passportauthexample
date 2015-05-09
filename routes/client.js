var utils = require('../utils');

module.exports = function(params) {

  var app = params.app;
  var passport = params.passport;
  var Client = params.models.client;

  app.post('/api/client', function(req, res, next) {
    var client = new Client();
    utils.updateModel(req.body, client, function(client) {
      client.save(function(err) {
	if (err) {
          if (11000 === err.code) {
            return next("Duplicate client: " + client.name + " found.");
          } else {
            return next(err);
          }
        }
        res.send(client);
      });
    });
  });

  app.get('/api/client/:id', function (req, res, next) {
    Client.findById(req.params.id, function(err, client) {
      if (err) {
        return next(err);
      }
      res.send(client);
    });
  });

};
