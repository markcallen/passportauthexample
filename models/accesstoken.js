var utils = require('../utils');

module.exports = function(params) {

  var mongoose = params.mongoose;
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  var AccessTokenSchema = new Schema({
      token: {type: String, required: true},
      clientId: {type: String, required: true},
      userId: {type: String, required: true},
      created: {type: Date, default: Date.now}
  });

  mongoose.model('AccessToken', AccessTokenSchema);
  var AccessToken = mongoose.model('AccessToken');

  return AccessToken;

};
