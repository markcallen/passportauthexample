var utils = require('../utils');

module.exports = function(params) {

  var mongoose = params.mongoose;
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  var ClientSchema = new Schema({
      name: {type: String, required: true, unique: true},
      clientId: {type: String, required: true, unique: true, default: utils.randomId(16)},
      clientSecret: {type: String, required: true, default: utils.randomSecret(32)},
      created: {type: Date, default: Date.now}
  });

  mongoose.model('Client', ClientSchema);
  var Client = mongoose.model('Client');

  return Client;

};
