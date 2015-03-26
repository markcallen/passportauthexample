// Load Models
var models = require('./models')();

// Load Routes
var routes = require('./routes');
routes({models: models});


