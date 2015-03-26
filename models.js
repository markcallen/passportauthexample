var fs = require('fs');
var mongoose = require('mongoose');
var db = require('config').DB;

// Connect to database
mongoose.connect(db.uri);

var models = {};

module.exports = function(params) {
  if (! params) {
    params = {};
  }
  params.mongoose = mongoose;
  fs.readdirSync(__dirname + '/models/').forEach(function(name) {
    if (name.slice(-3) == '.js') {
      var model = require('./models/' + name);
      var modelname = name.split('.')[0];
      console.log("Loading model: " + modelname);
      models[modelname] = model(params);
    }
  });

  return models;
};
